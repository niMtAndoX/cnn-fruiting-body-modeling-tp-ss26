"""Benchmark-Adapter: verarbeitet ZIP-Archive, ruft Darknet auf und berechnet Metriken."""

import io
import tempfile
import zipfile
from pathlib import Path
from time import perf_counter

from PIL import Image, UnidentifiedImageError

from app.domain.benchmark.entities import BenchmarkInput, BenchmarkResult
from app.domain.benchmark.exceptions import BenchmarkBadRequestError
from app.domain.benchmark.ports import BenchmarkPort
from app.infrastructure.darknet.parser import parse_darknet_output
from app.infrastructure.darknet.runner import DarknetRunner

# (x_center_norm, y_center_norm, width_norm, height_norm)
_BBox = tuple[float, float, float, float]
# (image_id, confidence_score, normalized_bbox)
_Detection = tuple[str, float, _BBox]


class DarknetBenchmarkAdapter(BenchmarkPort):
	"""Führt Benchmark-Auswertung durch: Bilder aus ZIP → Darknet → Metriken."""

	IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
	IOU_THRESHOLD = 0.5

	def __init__(
		self,
		runner: DarknetRunner,
		model_version: str,
		temp_dir: str | None = None,
	) -> None:
		self.runner = runner
		self.model_version = model_version
		self.temp_dir = temp_dir

	def benchmark(self, benchmark_input: BenchmarkInput) -> BenchmarkResult:
		started_at = perf_counter()

		with tempfile.TemporaryDirectory(dir=self.temp_dir) as tmpdir:
			tmpdir_path = Path(tmpdir)
			test_dir = tmpdir_path / "test"
			label_dir = tmpdir_path / "labels"

			self._extract_zip(benchmark_input.test_archive_bytes, test_dir, "Testbilder-Archiv")
			self._extract_zip(benchmark_input.label_archive_bytes, label_dir, "Label-Archiv")

			image_paths = self._find_images(test_dir)
			if not image_paths:
				raise BenchmarkBadRequestError(
					"Das Testarchiv enthält keine unterstützten Bilder (JPG, PNG)."
				)

			all_predictions: list[_Detection] = []
			gt_boxes: dict[str, list[_BBox]] = {}

			for image_path in image_paths:
				img_id = image_path.stem

				label_path = self._find_label(img_id, label_dir)
				gt_boxes[img_id] = self._parse_yolo_labels(label_path) if label_path else []

				dims = self._get_image_dimensions(image_path)
				if dims is None:
					continue

				img_w, img_h = dims

				try:
					run_result = self.runner.run(image_path)
					parsed = parse_darknet_output(run_result.stdout)
					for det in parsed.detections:
						if det.bounding_box is None:
							continue
						bb = det.bounding_box
						# Darknet: (left_x, top_y, width_px, height_px) → normalized center format
						x_center = (bb.x + bb.width / 2) / img_w
						y_center = (bb.y + bb.height / 2) / img_h
						w_norm = bb.width / img_w
						h_norm = bb.height / img_h
						all_predictions.append((img_id, det.confidence, (x_center, y_center, w_norm, h_norm)))
				except Exception:
					# Fehlerhafte Einzelbilder überspringen, nicht den gesamten Lauf abbrechen
					pass

		processing_time_ms = int((perf_counter() - started_at) * 1000)
		precision, recall, f1, map_score = self._compute_metrics(all_predictions, gt_boxes)

		return BenchmarkResult(
			model_version=self.model_version,
			precision=precision,
			recall=recall,
			f1_score=f1,
			map_score=map_score,
			total_images=len(image_paths),
			processing_time_ms=processing_time_ms,
		)

	@staticmethod
	def _extract_zip(archive_bytes: bytes, dest_dir: Path, label: str) -> None:
		dest_dir.mkdir(parents=True, exist_ok=True)
		try:
			with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
				zf.extractall(dest_dir)
		except zipfile.BadZipFile as exc:
			raise BenchmarkBadRequestError(
				f"Das {label} ist kein gültiges ZIP-Archiv."
			) from exc

	def _find_images(self, test_dir: Path) -> list[Path]:
		images: set[Path] = set()
		for ext in self.IMAGE_EXTENSIONS:
			images.update(test_dir.rglob(f"*{ext}"))
			images.update(test_dir.rglob(f"*{ext.upper()}"))
		return sorted(images)

	@staticmethod
	def _find_label(img_stem: str, label_dir: Path) -> Path | None:
		for path in label_dir.rglob(f"{img_stem}.txt"):
			return path
		return None

	@staticmethod
	def _parse_yolo_labels(label_path: Path) -> list[_BBox]:
		"""Liest YOLO-Labels (class_id x_center y_center width height, normiert 0–1)."""
		bboxes: list[_BBox] = []
		try:
			for line in label_path.read_text(encoding="utf-8").strip().splitlines():
				parts = line.strip().split()
				if len(parts) < 5:
					continue
				bboxes.append((float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])))
		except (OSError, ValueError):
			pass
		return bboxes

	@staticmethod
	def _get_image_dimensions(image_path: Path) -> tuple[int, int] | None:
		try:
			with Image.open(image_path) as img:
				return img.size  # (width, height)
		except (UnidentifiedImageError, OSError):
			return None

	def _compute_metrics(
		self,
		predictions: list[_Detection],
		gt_boxes: dict[str, list[_BBox]],
	) -> tuple[float, float, float, float]:
		"""Berechnet (precision, recall, f1, mAP) via IoU-basiertem TP/FP/FN-Matching."""
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
				iou = self._compute_iou(pred_bbox, gt_bbox)
				if iou > best_iou:
					best_iou = iou
					best_idx = j

			if best_iou >= self.IOU_THRESHOLD and best_idx >= 0:
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
		ap = self._compute_ap(precisions, recalls)

		return final_precision, final_recall, f1, ap

	@staticmethod
	def _compute_iou(b1: _BBox, b2: _BBox) -> float:
		"""IoU zweier Bounding Boxes im Format (x_center, y_center, width, height) normiert."""
		x1_min = b1[0] - b1[2] / 2
		y1_min = b1[1] - b1[3] / 2
		x1_max = b1[0] + b1[2] / 2
		y1_max = b1[1] + b1[3] / 2

		x2_min = b2[0] - b2[2] / 2
		y2_min = b2[1] - b2[3] / 2
		x2_max = b2[0] + b2[2] / 2
		y2_max = b2[1] + b2[3] / 2

		inter_w = max(0.0, min(x1_max, x2_max) - max(x1_min, x2_min))
		inter_h = max(0.0, min(y1_max, y2_max) - max(y1_min, y2_min))
		inter_area = inter_w * inter_h

		area1 = b1[2] * b1[3]
		area2 = b2[2] * b2[3]
		union_area = area1 + area2 - inter_area

		return inter_area / union_area if union_area > 0 else 0.0

	@staticmethod
	def _compute_ap(precisions: list[float], recalls: list[float]) -> float:
		"""Average Precision via monoton-decreasing Precision-Recall-Kurve (Trapezregel)."""
		p = [0.0] + list(precisions) + [0.0]
		r = [0.0] + list(recalls) + [1.0]

		for i in range(len(p) - 2, -1, -1):
			p[i] = max(p[i], p[i + 1])

		ap = sum((r[i] - r[i - 1]) * p[i] for i in range(1, len(r)))
		return max(0.0, min(1.0, ap))
