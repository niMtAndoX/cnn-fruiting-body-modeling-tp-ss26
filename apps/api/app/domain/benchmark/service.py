"""Koordiniert ZIP-Verarbeitung, Modellaufrufe, Ground-Truth-Vergleich und Metrikberechnung."""

import io
import zipfile
from pathlib import Path
from time import perf_counter

from PIL import Image, UnidentifiedImageError

from app.domain.benchmark.entities import (
	BenchmarkInput,
	BenchmarkResult,
	ImageBenchmarkResult,
)
from app.domain.benchmark.exceptions import BenchmarkBadRequestError
from app.domain.prediction.entities import PredictionInput
from app.domain.prediction.ports import PredictionPort

_BBox = tuple[float, float, float, float]  # normiert (x_center, y_center, w, h)
_Detection = tuple[str, float, _BBox]  # (image_id, confidence, bbox)

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
_IOU_THRESHOLD = 0.5


class BenchmarkService:
	"""Verarbeitet Benchmark-Eingaben und liefert aggregierte sowie bildgenaue Metriken."""

	def __init__(self, prediction_port: PredictionPort) -> None:
		self.prediction_port = prediction_port

	def benchmark(self, benchmark_input: BenchmarkInput) -> BenchmarkResult:
		started_at = perf_counter()

		test_files = _extract_zip(benchmark_input.test_archive_bytes, "Testbilder-Archiv")
		label_files = _extract_zip(benchmark_input.label_archive_bytes, "Label-Archiv")

		image_files = {
			name: data
			for name, data in test_files.items()
			if Path(name).suffix.lower() in _IMAGE_EXTENSIONS
		}
		if not image_files:
			raise BenchmarkBadRequestError(
				"Das Testarchiv enthält keine unterstützten Bilder (JPG, PNG)."
			)

		all_predictions: list[_Detection] = []
		gt_boxes: dict[str, list[_BBox]] = {}
		image_results: list[ImageBenchmarkResult] = []
		model_version = "unknown"
		failed_images = 0

		for filepath, image_bytes in image_files.items():
			img_id = Path(filepath).stem

			label_key = _find_label_key(img_id, label_files)
			gt = _parse_yolo_labels(label_files[label_key]) if label_key else []
			gt_boxes[img_id] = gt

			dims = _get_image_dimensions(image_bytes)
			if dims is None:
				image_results.append(
					ImageBenchmarkResult(
						image_id=img_id,
						ground_truth_count=len(gt),
						predicted_count=0,
						true_positives=0,
						false_positives=0,
						false_negatives=len(gt),
						error="Bild konnte nicht gelesen werden.",
					)
				)
				failed_images += 1
				continue

			img_w, img_h = dims

			try:
				prediction_input = PredictionInput(
					filename=Path(filepath).name,
					content_type="image/jpeg",
					image_bytes=image_bytes,
				)
				result = self.prediction_port.predict(prediction_input)
				model_version = result.model_version

				image_preds: list[_BBox] = []
				for det in result.detections:
					if det.bbox is None:
						continue
					bb = det.bbox
					norm_bbox: _BBox = (
						(bb.x + bb.width / 2) / img_w,
						(bb.y + bb.height / 2) / img_h,
						bb.width / img_w,
						bb.height / img_h,
					)
					all_predictions.append((img_id, det.score, norm_bbox))
					image_preds.append(norm_bbox)

				tp, fp, fn = _match_predictions(image_preds, gt)
				image_results.append(
					ImageBenchmarkResult(
						image_id=img_id,
						ground_truth_count=len(gt),
						predicted_count=len(image_preds),
						true_positives=tp,
						false_positives=fp,
						false_negatives=fn,
					)
				)

			except Exception as exc:
				image_results.append(
					ImageBenchmarkResult(
						image_id=img_id,
						ground_truth_count=len(gt),
						predicted_count=0,
						true_positives=0,
						false_positives=0,
						false_negatives=len(gt),
						error=str(exc),
					)
				)
				failed_images += 1

		processing_time_ms = int((perf_counter() - started_at) * 1000)
		precision, recall, f1, map_score = _compute_metrics(all_predictions, gt_boxes)

		return BenchmarkResult(
			model_version=model_version,
			precision=precision,
			recall=recall,
			f1_score=f1,
			map_score=map_score,
			total_images=len(image_files),
			failed_images=failed_images,
			processing_time_ms=processing_time_ms,
			image_results=image_results,
		)


def _extract_zip(archive_bytes: bytes, label: str) -> dict[str, bytes]:
	try:
		files: dict[str, bytes] = {}
		with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
			for name in zf.namelist():
				if not name.endswith("/"):
					files[name] = zf.read(name)
		return files
	except zipfile.BadZipFile as exc:
		raise BenchmarkBadRequestError(
			f"Das {label} ist kein gültiges ZIP-Archiv."
		) from exc


def _find_label_key(img_stem: str, label_files: dict[str, bytes]) -> str | None:
	for name in label_files:
		if Path(name).stem == img_stem and Path(name).suffix.lower() == ".txt":
			return name
	return None


def _parse_yolo_labels(data: bytes) -> list[_BBox]:
	bboxes: list[_BBox] = []
	try:
		for line in data.decode("utf-8").strip().splitlines():
			parts = line.strip().split()
			if len(parts) >= 5:
				bboxes.append(
					(float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4]))
				)
	except (ValueError, UnicodeDecodeError):
		pass
	return bboxes


def _get_image_dimensions(image_bytes: bytes) -> tuple[int, int] | None:
	try:
		with Image.open(io.BytesIO(image_bytes)) as img:
			return img.size  # (width, height)
	except (UnidentifiedImageError, OSError):
		return None


def _match_predictions(preds: list[_BBox], gt: list[_BBox]) -> tuple[int, int, int]:
	"""Gibt (true_positives, false_positives, false_negatives) zurück."""
	matched: set[int] = set()
	tp = 0
	fp = 0
	for pred in preds:
		best_iou = 0.0
		best_j = -1
		for j, g in enumerate(gt):
			if j in matched:
				continue
			iou = _compute_iou(pred, g)
			if iou > best_iou:
				best_iou = iou
				best_j = j
		if best_iou >= _IOU_THRESHOLD and best_j >= 0:
			tp += 1
			matched.add(best_j)
		else:
			fp += 1
	fn = len(gt) - tp
	return tp, fp, fn


def _compute_iou(b1: _BBox, b2: _BBox) -> float:
	x1_min, y1_min = b1[0] - b1[2] / 2, b1[1] - b1[3] / 2
	x1_max, y1_max = b1[0] + b1[2] / 2, b1[1] + b1[3] / 2
	x2_min, y2_min = b2[0] - b2[2] / 2, b2[1] - b2[3] / 2
	x2_max, y2_max = b2[0] + b2[2] / 2, b2[1] + b2[3] / 2

	inter_w = max(0.0, min(x1_max, x2_max) - max(x1_min, x2_min))
	inter_h = max(0.0, min(y1_max, y2_max) - max(y1_min, y2_min))
	inter_area = inter_w * inter_h
	union_area = b1[2] * b1[3] + b2[2] * b2[3] - inter_area
	return inter_area / union_area if union_area > 0 else 0.0


def _compute_metrics(
	predictions: list[_Detection],
	gt_boxes: dict[str, list[_BBox]],
) -> tuple[float, float, float, float]:
	total_gt = sum(len(boxes) for boxes in gt_boxes.values())

	if total_gt == 0 and not predictions:
		return 1.0, 1.0, 1.0, 1.0
	if not predictions:
		return 0.0, 0.0, 0.0, 0.0
	if total_gt == 0:
		return 0.0, 1.0, 0.0, 0.0

	sorted_preds = sorted(predictions, key=lambda x: x[1], reverse=True)
	matched_gt: dict[str, set[int]] = {img_id: set() for img_id in gt_boxes}
	tps: list[int] = []
	fps: list[int] = []

	for img_id, _score, pred_bbox in sorted_preds:
		img_gt = gt_boxes.get(img_id, [])
		best_iou = 0.0
		best_idx = -1
		for j, gt_bbox in enumerate(img_gt):
			if j in matched_gt.get(img_id, set()):
				continue
			iou = _compute_iou(pred_bbox, gt_bbox)
			if iou > best_iou:
				best_iou = iou
				best_idx = j
		if best_iou >= _IOU_THRESHOLD and best_idx >= 0:
			tps.append(1)
			fps.append(0)
			matched_gt.setdefault(img_id, set()).add(best_idx)
		else:
			tps.append(0)
			fps.append(1)

	cum_tp = 0
	cum_fp = 0
	precisions: list[float] = []
	recalls: list[float] = []
	for tp, fp in zip(tps, fps):
		cum_tp += tp
		cum_fp += fp
		precisions.append(cum_tp / (cum_tp + cum_fp))
		recalls.append(cum_tp / total_gt)

	final_precision = precisions[-1]
	final_recall = recalls[-1]
	f1 = (
		2 * final_precision * final_recall / (final_precision + final_recall)
		if (final_precision + final_recall) > 0
		else 0.0
	)
	ap = _compute_ap(precisions, recalls)
	return final_precision, final_recall, f1, ap


def _compute_ap(precisions: list[float], recalls: list[float]) -> float:
	p = [0.0] + list(precisions) + [0.0]
	r = [0.0] + list(recalls) + [1.0]
	for i in range(len(p) - 2, -1, -1):
		p[i] = max(p[i], p[i + 1])
	ap = sum((r[i] - r[i - 1]) * p[i] for i in range(1, len(r)))
	return max(0.0, min(1.0, ap))
