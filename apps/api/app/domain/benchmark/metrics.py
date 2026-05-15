from collections.abc import Sequence

from app.domain.benchmark.entities import (
	BenchmarkObject,
	BenchmarkResult,
	BoundingBox,
	ImageBenchmarkResult,
	ObjectMatchingResult,
)


def calculate_iou(first_box: BoundingBox, second_box: BoundingBox) -> float:
	"""Berechnet die Intersection over Union zweier Bounding Boxes.

	Die IoU beschreibt das Verhältnis der gemeinsamen Fläche zweier Boxen
	zur gesamten von beiden Boxen abgedeckten Fläche.

	Rückgabewert:
		- 0.0 bei keiner Überschneidung
		- 1.0 bei identischen Boxen
		- Wert zwischen 0.0 und 1.0 bei teilweiser Überschneidung
	"""
	if (
		first_box.width <= 0
		or first_box.height <= 0
		or second_box.width <= 0
		or second_box.height <= 0
	):
		return 0.0

	intersection_left = max(first_box.x, second_box.x)
	intersection_top = max(first_box.y, second_box.y)
	intersection_right = min(
		first_box.x + first_box.width,
		second_box.x + second_box.width,
	)
	intersection_bottom = min(
		first_box.y + first_box.height,
		second_box.y + second_box.height,
	)

	intersection_width = max(0.0, intersection_right - intersection_left)
	intersection_height = max(0.0, intersection_bottom - intersection_top)
	intersection_area = intersection_width * intersection_height

	if intersection_area == 0.0:
		return 0.0

	first_box_area = first_box.width * first_box.height
	second_box_area = second_box.width * second_box.height
	union_area = first_box_area + second_box_area - intersection_area

	if union_area <= 0.0:
		return 0.0

	iou = intersection_area / union_area

	return max(0.0, min(1.0, iou))


def match_predictions_to_ground_truth(
	predictions: Sequence[BenchmarkObject],
	ground_truth_objects: Sequence[BenchmarkObject],
	iou_threshold: float,
) -> ObjectMatchingResult:
	"""Vergleicht Predictions mit Ground Truth anhand von Label und IoU.

	Ein Match zählt nur, wenn:
		- Prediction und Ground Truth dasselbe Label besitzen
		- die IoU mindestens dem konfigurierten Schwellwert entspricht

	Jedes Ground-Truth-Objekt und jede Prediction kann höchstens einmal
	gematcht werden.
	"""
	if not 0.0 <= iou_threshold <= 1.0:
		raise ValueError("Der IoU-Schwellwert muss zwischen 0.0 und 1.0 liegen.")

	match_candidates: list[tuple[float, int, int]] = []

	for prediction_index, prediction in enumerate(predictions):
		for ground_truth_index, ground_truth in enumerate(ground_truth_objects):
			if prediction.label != ground_truth.label:
				continue

			iou = calculate_iou(
				prediction.bounding_box,
				ground_truth.bounding_box,
			)

			if iou >= iou_threshold:
				match_candidates.append(
					(iou, prediction_index, ground_truth_index)
				)

	match_candidates.sort(key=lambda candidate: candidate[0], reverse=True)

	matched_prediction_indices: set[int] = set()
	matched_ground_truth_indices: set[int] = set()
	matched_ious: list[float] = []

	for iou, prediction_index, ground_truth_index in match_candidates:
		if prediction_index in matched_prediction_indices:
			continue

		if ground_truth_index in matched_ground_truth_indices:
			continue

		matched_prediction_indices.add(prediction_index)
		matched_ground_truth_indices.add(ground_truth_index)
		matched_ious.append(iou)

	true_positives = len(matched_prediction_indices)
	false_positives = len(predictions) - true_positives
	false_negatives = len(ground_truth_objects) - true_positives

	return ObjectMatchingResult(
		true_positives=true_positives,
		false_positives=false_positives,
		false_negatives=false_negatives,
		matched_ious=tuple(matched_ious),
	)


def calculate_benchmark_result(
	*,
	model_version: str,
	image_results: Sequence[ImageBenchmarkResult],
	total_images: int,
	failed_images: int,
	processing_time_ms: int,
	map_score: float = 0.0,
) -> BenchmarkResult:
	"""Aggregiert Einzelbildergebnisse zu einem Benchmark-Gesamtergebnis."""
	true_positives = sum(result.true_positives for result in image_results)
	false_positives = sum(result.false_positives for result in image_results)
	false_negatives = sum(result.false_negatives for result in image_results)

	precision = _safe_divide(
		true_positives,
		true_positives + false_positives,
	)
	recall = _safe_divide(
		true_positives,
		true_positives + false_negatives,
	)
	f1_score = _safe_divide(
		2 * precision * recall,
		precision + recall,
	)
	accuracy = _safe_divide(
		true_positives,
		true_positives + false_positives + false_negatives,
	)

	matched_ious = [
		iou
		for result in image_results
		for iou in result.matched_ious
	]
	mean_iou = _safe_divide(
		sum(matched_ious),
		len(matched_ious),
	)

	inference_times = [
		result.inference_time_ms
		for result in image_results
		if result.inference_time_ms is not None
	]
	average_inference_time_ms = _safe_divide(
		sum(inference_times),
		len(inference_times),
	)

	return BenchmarkResult(
		model_version=model_version,
		precision=precision,
		recall=recall,
		f1_score=f1_score,
		map_score=map_score,
		total_images=total_images,
		failed_images=failed_images,
		processing_time_ms=processing_time_ms,
		true_positives=true_positives,
		false_positives=false_positives,
		false_negatives=false_negatives,
		accuracy=accuracy,
		mean_iou=mean_iou,
		average_inference_time_ms=average_inference_time_ms,
		image_results=list(image_results),
	)


def _safe_divide(numerator: float | int, denominator: float | int) -> float:
	"""Teilt sicher und liefert bei Nenner 0 den Wert 0.0."""
	if denominator == 0:
		return 0.0

	return float(numerator / denominator)