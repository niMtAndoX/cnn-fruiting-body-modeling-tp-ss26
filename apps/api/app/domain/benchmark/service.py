"""Koordiniert ZIP-Verarbeitung, Modellaufrufe, Ground-Truth-Vergleich und Metrikberechnung."""

import io
import zipfile
from pathlib import Path
from time import perf_counter

from PIL import Image, UnidentifiedImageError

from app.domain.benchmark.entities import (
	BenchmarkInput,
	BenchmarkObject,
	BenchmarkResult,
	BoundingBox,
	ImageBenchmarkResult,
)
from app.domain.benchmark.exceptions import BenchmarkBadRequestError
from app.domain.benchmark.metrics import (
	calculate_benchmark_result,
	calculate_iou,
	match_predictions_to_ground_truth,
)
from app.domain.prediction.entities import PredictionInput
from app.domain.prediction.ports import PredictionPort

_ScoredDetection = tuple[str, float, BenchmarkObject]

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
_LABEL_EXTENSIONS = {".txt"}
_IOU_THRESHOLD = 0.5

# Aktuell ist der Benchmark fachlich auf den bestehenden Ein-Klassen-Fall ausgelegt.
# Falls später mehrere YOLO-Klassen in den Label-Dateien ausgewertet werden sollen,
# sollte hier eine explizite Mapping-Strategie von Klassen-ID -> Label ergänzt werden.
_DEFAULT_GROUND_TRUTH_LABEL = "fungus"


class BenchmarkService:
	"""Verarbeitet Benchmark-Eingaben und liefert aggregierte sowie bildgenaue Metriken."""

	def __init__(self, prediction_port: PredictionPort) -> None:
		self.prediction_port = prediction_port

	def benchmark(self, benchmark_input: BenchmarkInput) -> BenchmarkResult:
		started_at = perf_counter()

		image_files = _extract_zip(
			benchmark_input.test_archive_bytes,
			"Testbilder-Archiv",
			allowed_extensions=_IMAGE_EXTENSIONS,
		)
		label_files = _extract_zip(
			benchmark_input.label_archive_bytes,
			"Label-Archiv",
			allowed_extensions=_LABEL_EXTENSIONS,
		)

		if not image_files:
			raise BenchmarkBadRequestError(
				"Das Testarchiv enthält keine unterstützten Bilder (JPG, PNG)."
			)

		all_predictions: list[_ScoredDetection] = []
		ground_truth_by_image: dict[str, list[BenchmarkObject]] = {}
		image_results: list[ImageBenchmarkResult] = []
		model_version = "unknown"
		failed_images = 0

		for filepath, image_bytes in image_files.items():
			image_id = Path(filepath).stem

			label_key = _find_label_key(image_id, label_files)
			ground_truth_objects = (
				_parse_yolo_labels(label_files[label_key]) if label_key else []
			)
			ground_truth_by_image[image_id] = ground_truth_objects

			dimensions = _get_image_dimensions(image_bytes)
			if dimensions is None:
				matching_result = match_predictions_to_ground_truth(
					predictions=[],
					ground_truth_objects=ground_truth_objects,
					iou_threshold=_IOU_THRESHOLD,
				)

				image_results.append(
					ImageBenchmarkResult(
						image_id=image_id,
						ground_truth_count=len(ground_truth_objects),
						predicted_count=0,
						true_positives=matching_result.true_positives,
						false_positives=matching_result.false_positives,
						false_negatives=matching_result.false_negatives,
						error="Bild konnte nicht gelesen werden.",
						matched_ious=list(matching_result.matched_ious),
						label_results=list(matching_result.label_results),
					)
				)
				failed_images += 1
				continue

			image_width, image_height = dimensions

			try:
				prediction_input = PredictionInput(
					filename=Path(filepath).name,
					content_type="image/jpeg",
					image_bytes=image_bytes,
				)
				prediction_result = self.prediction_port.predict(prediction_input)
				model_version = prediction_result.model_version

				prediction_objects: list[BenchmarkObject] = []

				for detection in prediction_result.detections:
					if detection.bbox is None:
						continue

					bbox = detection.bbox
					normalized_bounding_box = BoundingBox(
						x=bbox.x / image_width,
						y=bbox.y / image_height,
						width=bbox.width / image_width,
						height=bbox.height / image_height,
					)
					prediction_object = BenchmarkObject(
						label=detection.label,
						bounding_box=normalized_bounding_box,
					)

					prediction_objects.append(prediction_object)
					all_predictions.append(
						(image_id, detection.score, prediction_object)
					)

				matching_result = match_predictions_to_ground_truth(
					predictions=prediction_objects,
					ground_truth_objects=ground_truth_objects,
					iou_threshold=_IOU_THRESHOLD,
				)

				image_results.append(
					ImageBenchmarkResult(
						image_id=image_id,
						ground_truth_count=len(ground_truth_objects),
						predicted_count=len(prediction_objects),
						true_positives=matching_result.true_positives,
						false_positives=matching_result.false_positives,
						false_negatives=matching_result.false_negatives,
						inference_time_ms=prediction_result.inference_time_ms,
						matched_ious=list(matching_result.matched_ious),
						label_results=list(matching_result.label_results),
					)
				)

			except Exception as exc:
				matching_result = match_predictions_to_ground_truth(
					predictions=[],
					ground_truth_objects=ground_truth_objects,
					iou_threshold=_IOU_THRESHOLD,
				)

				image_results.append(
					ImageBenchmarkResult(
						image_id=image_id,
						ground_truth_count=len(ground_truth_objects),
						predicted_count=0,
						true_positives=matching_result.true_positives,
						false_positives=matching_result.false_positives,
						false_negatives=matching_result.false_negatives,
						error=str(exc),
						matched_ious=list(matching_result.matched_ious),
						label_results=list(matching_result.label_results),
					)
				)
				failed_images += 1

		processing_time_ms = int((perf_counter() - started_at) * 1000)
		map_score = _compute_map_score(all_predictions, ground_truth_by_image)

		return calculate_benchmark_result(
			model_version=model_version,
			image_results=image_results,
			total_images=len(image_files),
			failed_images=failed_images,
			processing_time_ms=processing_time_ms,
			map_score=map_score,
		)


def _extract_zip(
	archive_bytes: bytes,
	label: str,
	allowed_extensions: set[str],
) -> dict[str, bytes]:
	try:
		files: dict[str, bytes] = {}
		with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zip_file:
			for name in zip_file.namelist():
				if not name.endswith("/") and _is_allowed_archive_entry(name, allowed_extensions):
					files[name] = zip_file.read(name)
		return files
	except zipfile.BadZipFile as exc:
		raise BenchmarkBadRequestError(
			f"Das {label} ist kein gültiges ZIP-Archiv."
		) from exc


def _is_allowed_archive_entry(name: str, allowed_extensions: set[str]) -> bool:
	path = Path(name)

	if path.suffix.lower() not in allowed_extensions:
		return False

	if not path.name or path.name.startswith("."):
		return False

	for part in path.parts[:-1]:
		if not part or part.startswith(".") or part.startswith("__"):
			return False

	return True


def _find_label_key(image_stem: str, label_files: dict[str, bytes]) -> str | None:
	for name in label_files:
		if Path(name).stem == image_stem and Path(name).suffix.lower() == ".txt":
			return name
	return None


def _parse_yolo_labels(data: bytes) -> list[BenchmarkObject]:
	try:
		lines = data.decode("utf-8").strip().splitlines()
	except UnicodeDecodeError:
		return []

	objects: list[BenchmarkObject] = []

	for line in lines:
		parts = line.strip().split()
		if len(parts) < 5:
			continue

		try:
			x_center = float(parts[1])
			y_center = float(parts[2])
			width = float(parts[3])
			height = float(parts[4])
		except ValueError:
			continue

		objects.append(
			BenchmarkObject(
				label=_DEFAULT_GROUND_TRUTH_LABEL,
				bounding_box=BoundingBox(
					x=x_center - width / 2,
					y=y_center - height / 2,
					width=width,
					height=height,
				),
			)
		)

	return objects


def _get_image_dimensions(image_bytes: bytes) -> tuple[int, int] | None:
	try:
		with Image.open(io.BytesIO(image_bytes)) as image:
			return image.size
	except (UnidentifiedImageError, OSError):
		return None


def _compute_map_score(
	predictions: list[_ScoredDetection],
	ground_truth_by_image: dict[str, list[BenchmarkObject]],
) -> float:
	total_ground_truth_objects = sum(
		len(objects) for objects in ground_truth_by_image.values()
	)

	if total_ground_truth_objects == 0 and not predictions:
		return 1.0
	if not predictions:
		return 0.0
	if total_ground_truth_objects == 0:
		return 0.0

	sorted_predictions = sorted(
		predictions,
		key=lambda prediction: prediction[1],
		reverse=True,
	)

	matched_ground_truth: dict[str, set[int]] = {
		image_id: set() for image_id in ground_truth_by_image
	}

	true_positive_flags: list[int] = []
	false_positive_flags: list[int] = []

	for image_id, _score, prediction_object in sorted_predictions:
		image_ground_truth = ground_truth_by_image.get(image_id, [])
		best_iou = 0.0
		best_ground_truth_index = -1

		for ground_truth_index, ground_truth_object in enumerate(image_ground_truth):
			if ground_truth_index in matched_ground_truth.get(image_id, set()):
				continue

			if prediction_object.label != ground_truth_object.label:
				continue

			iou = calculate_iou(
				prediction_object.bounding_box,
				ground_truth_object.bounding_box,
			)

			if iou > best_iou:
				best_iou = iou
				best_ground_truth_index = ground_truth_index

		if best_iou >= _IOU_THRESHOLD and best_ground_truth_index >= 0:
			true_positive_flags.append(1)
			false_positive_flags.append(0)
			matched_ground_truth.setdefault(image_id, set()).add(
				best_ground_truth_index
			)
		else:
			true_positive_flags.append(0)
			false_positive_flags.append(1)

	cumulative_true_positives = 0
	cumulative_false_positives = 0
	precisions: list[float] = []
	recalls: list[float] = []
 
	for true_positive, false_positive in zip(
		true_positive_flags,
		false_positive_flags,
		strict=True,
	):
		cumulative_true_positives += true_positive
		cumulative_false_positives += false_positive

		precisions.append(
			cumulative_true_positives
			/ (cumulative_true_positives + cumulative_false_positives)
		)
		recalls.append(
			cumulative_true_positives / total_ground_truth_objects
		)

	return _compute_average_precision(precisions, recalls)


def _compute_average_precision(
	precisions: list[float],
	recalls: list[float],
) -> float:
	precision_curve = [0.0] + list(precisions) + [0.0]
	recall_curve = [0.0] + list(recalls) + [1.0]

	for index in range(len(precision_curve) - 2, -1, -1):
		precision_curve[index] = max(
			precision_curve[index],
			precision_curve[index + 1],
		)

	average_precision = sum(
		(recall_curve[index] - recall_curve[index - 1]) * precision_curve[index]
		for index in range(1, len(recall_curve))
	)

	return max(0.0, min(1.0, average_precision))
