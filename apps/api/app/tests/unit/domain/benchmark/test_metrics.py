import pytest

from app.domain.benchmark.entities import (
	BenchmarkObject,
	BoundingBox,
	ImageBenchmarkResult,
	LabelMatchingResult,
)
from app.domain.benchmark.metrics import (
	calculate_benchmark_result,
	calculate_iou,
	match_predictions_to_ground_truth,
)


def test_calculate_iou_returns_one_for_identical_boxes() -> None:
	first_box = BoundingBox(x=10, y=20, width=30, height=40)
	second_box = BoundingBox(x=10, y=20, width=30, height=40)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(1.0)


def test_calculate_iou_returns_zero_for_non_overlapping_boxes() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=20, y=20, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)


def test_calculate_iou_returns_expected_value_for_partially_overlapping_boxes() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=5, y=5, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(25 / 175)


def test_calculate_iou_returns_expected_value_when_one_box_is_contained_in_another() -> None:
	outer_box = BoundingBox(x=0, y=0, width=10, height=10)
	inner_box = BoundingBox(x=2, y=2, width=4, height=4)

	result = calculate_iou(outer_box, inner_box)

	assert result == pytest.approx(16 / 100)


def test_calculate_iou_returns_zero_when_boxes_only_touch_at_edge() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=10, y=0, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)


def test_calculate_iou_is_symmetric() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=5, y=5, width=10, height=10)

	forward_result = calculate_iou(first_box, second_box)
	reverse_result = calculate_iou(second_box, first_box)

	assert forward_result == pytest.approx(reverse_result)


def test_calculate_iou_returns_zero_for_box_with_zero_area() -> None:
	first_box = BoundingBox(x=0, y=0, width=0, height=10)
	second_box = BoundingBox(x=0, y=0, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)


def test_match_predictions_to_ground_truth_counts_true_positive_for_matching_label_and_iou() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 1
	assert result.false_positives == 0
	assert result.false_negatives == 0
	assert result.matched_ious == pytest.approx((1.0,))


def test_match_predictions_to_ground_truth_counts_label_mismatch_as_false_positive_and_false_negative() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="wood",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 0
	assert result.false_positives == 1
	assert result.false_negatives == 1
	assert result.matched_ious == ()


def test_match_predictions_to_ground_truth_counts_iou_below_threshold_as_false_positive_and_false_negative() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=8, y=8, width=10, height=10),
		)
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 0
	assert result.false_positives == 1
	assert result.false_negatives == 1
	assert result.matched_ious == ()


def test_match_predictions_to_ground_truth_counts_unmatched_predictions_as_false_positives() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		),
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=30, y=30, width=10, height=10),
		),
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 1
	assert result.false_positives == 1
	assert result.false_negatives == 0


def test_match_predictions_to_ground_truth_counts_unmatched_ground_truth_objects_as_false_negatives() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		),
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=30, y=30, width=10, height=10),
		),
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 1
	assert result.false_positives == 0
	assert result.false_negatives == 1


def test_match_predictions_to_ground_truth_matches_each_ground_truth_object_only_once() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		),
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		),
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]

	result = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result.true_positives == 1
	assert result.false_positives == 1
	assert result.false_negatives == 0


def test_match_predictions_to_ground_truth_uses_configurable_iou_threshold() -> None:
	predictions = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=0, y=0, width=10, height=10),
		)
	]
	ground_truth_objects = [
		BenchmarkObject(
			label="fungus",
			bounding_box=BoundingBox(x=5, y=0, width=10, height=10),
		)
	]

	result_with_lower_threshold = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.3,
	)
	result_with_higher_threshold = match_predictions_to_ground_truth(
		predictions=predictions,
		ground_truth_objects=ground_truth_objects,
		iou_threshold=0.5,
	)

	assert result_with_lower_threshold.true_positives == 1
	assert result_with_lower_threshold.false_positives == 0
	assert result_with_lower_threshold.false_negatives == 0

	assert result_with_higher_threshold.true_positives == 0
	assert result_with_higher_threshold.false_positives == 1
	assert result_with_higher_threshold.false_negatives == 1


@pytest.mark.parametrize("iou_threshold", [-0.1, 1.1])
def test_match_predictions_to_ground_truth_rejects_invalid_iou_threshold(
	iou_threshold: float,
) -> None:
	with pytest.raises(
		ValueError,
		match="Der IoU-Schwellwert muss zwischen 0.0 und 1.0 liegen.",
	):
		match_predictions_to_ground_truth(
			predictions=[],
			ground_truth_objects=[],
			iou_threshold=iou_threshold,
		)


def test_calculate_benchmark_result_returns_perfect_metrics() -> None:
	image_results = [
		ImageBenchmarkResult(
			image_id="image-1",
			ground_truth_count=1,
			predicted_count=1,
			true_positives=1,
			false_positives=0,
			false_negatives=0,
			inference_time_ms=100,
			matched_ious=[1.0],
		),
		ImageBenchmarkResult(
			image_id="image-2",
			ground_truth_count=1,
			predicted_count=1,
			true_positives=1,
			false_positives=0,
			false_negatives=0,
			inference_time_ms=200,
			matched_ious=[0.8],
		),
	]

	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=image_results,
		total_images=2,
		failed_images=0,
		processing_time_ms=750,
	)

	assert result.true_positives == 2
	assert result.false_positives == 0
	assert result.false_negatives == 0
	assert result.precision == pytest.approx(1.0)
	assert result.recall == pytest.approx(1.0)
	assert result.f1_score == pytest.approx(1.0)
	assert result.accuracy == pytest.approx(1.0)
	assert result.mean_iou == pytest.approx(0.9)
	assert result.average_inference_time_ms == pytest.approx(150.0)
	assert result.processing_time_ms == 750


def test_calculate_benchmark_result_returns_partial_metrics() -> None:
	image_results = [
		ImageBenchmarkResult(
			image_id="image-1",
			ground_truth_count=1,
			predicted_count=2,
			true_positives=1,
			false_positives=1,
			false_negatives=0,
			inference_time_ms=100,
			matched_ious=[0.8],
		),
		ImageBenchmarkResult(
			image_id="image-2",
			ground_truth_count=1,
			predicted_count=0,
			true_positives=0,
			false_positives=0,
			false_negatives=1,
			inference_time_ms=200,
			matched_ious=[],
		),
	]

	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=image_results,
		total_images=2,
		failed_images=0,
		processing_time_ms=900,
	)

	assert result.true_positives == 1
	assert result.false_positives == 1
	assert result.false_negatives == 1
	assert result.precision == pytest.approx(0.5)
	assert result.recall == pytest.approx(0.5)
	assert result.f1_score == pytest.approx(0.5)
	assert result.accuracy == pytest.approx(1 / 3)
	assert result.mean_iou == pytest.approx(0.8)
	assert result.average_inference_time_ms == pytest.approx(150.0)
	assert result.processing_time_ms == 900


def test_calculate_benchmark_result_returns_zero_detection_metrics_for_completely_wrong_results() -> None:
	image_results = [
		ImageBenchmarkResult(
			image_id="image-1",
			ground_truth_count=1,
			predicted_count=2,
			true_positives=0,
			false_positives=2,
			false_negatives=1,
			inference_time_ms=120,
			matched_ious=[],
		),
		ImageBenchmarkResult(
			image_id="image-2",
			ground_truth_count=1,
			predicted_count=0,
			true_positives=0,
			false_positives=0,
			false_negatives=1,
			inference_time_ms=180,
			matched_ious=[],
		),
	]

	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=image_results,
		total_images=2,
		failed_images=0,
		processing_time_ms=1000,
	)

	assert result.true_positives == 0
	assert result.false_positives == 2
	assert result.false_negatives == 2
	assert result.precision == pytest.approx(0.0)
	assert result.recall == pytest.approx(0.0)
	assert result.f1_score == pytest.approx(0.0)
	assert result.accuracy == pytest.approx(0.0)
	assert result.mean_iou == pytest.approx(0.0)
	assert result.average_inference_time_ms == pytest.approx(150.0)
	assert result.processing_time_ms == 1000


def test_calculate_benchmark_result_handles_empty_results_without_division_by_zero() -> None:
	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=[],
		total_images=0,
		failed_images=0,
		processing_time_ms=0,
	)

	assert result.true_positives == 0
	assert result.false_positives == 0
	assert result.false_negatives == 0
	assert result.precision == pytest.approx(0.0)
	assert result.recall == pytest.approx(0.0)
	assert result.f1_score == pytest.approx(0.0)
	assert result.accuracy == pytest.approx(0.0)
	assert result.mean_iou == pytest.approx(0.0)
	assert result.average_inference_time_ms == pytest.approx(0.0)
	assert result.processing_time_ms == 0
 
 
def test_calculate_benchmark_result_returns_label_metrics_for_single_label_case() -> None:
	image_results = [
		ImageBenchmarkResult(
			image_id="image-1",
			ground_truth_count=2,
			predicted_count=2,
			true_positives=1,
			false_positives=1,
			false_negatives=1,
			inference_time_ms=120,
			matched_ious=[0.75],
			label_results=[
				LabelMatchingResult(
					label="fungus",
					true_positives=1,
					false_positives=1,
					false_negatives=1,
					matched_ious=(0.75,),
				)
			],
		)
	]

	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=image_results,
		total_images=1,
		failed_images=0,
		processing_time_ms=300,
	)

	assert result.true_positives == 1
	assert result.false_positives == 1
	assert result.false_negatives == 1

	assert len(result.label_metrics) == 1

	label_metrics = result.label_metrics[0]

	assert label_metrics.label == "fungus"
	assert label_metrics.true_positives == 1
	assert label_metrics.false_positives == 1
	assert label_metrics.false_negatives == 1
	assert label_metrics.precision == pytest.approx(0.5)
	assert label_metrics.recall == pytest.approx(0.5)
	assert label_metrics.f1_score == pytest.approx(0.5)
	assert label_metrics.accuracy == pytest.approx(1 / 3)
	assert label_metrics.mean_iou == pytest.approx(0.75)


def test_calculate_benchmark_result_returns_metrics_per_label_for_multiple_labels() -> None:
	image_results = [
		ImageBenchmarkResult(
			image_id="image-1",
			ground_truth_count=3,
			predicted_count=3,
			true_positives=2,
			false_positives=1,
			false_negatives=1,
			inference_time_ms=100,
			matched_ious=[0.9, 0.8],
			label_results=[
				LabelMatchingResult(
					label="fungus",
					true_positives=1,
					false_positives=1,
					false_negatives=0,
					matched_ious=(0.9,),
				),
				LabelMatchingResult(
					label="wood",
					true_positives=1,
					false_positives=0,
					false_negatives=1,
					matched_ious=(0.8,),
				),
			],
		),
		ImageBenchmarkResult(
			image_id="image-2",
			ground_truth_count=2,
			predicted_count=2,
			true_positives=1,
			false_positives=1,
			false_negatives=1,
			inference_time_ms=200,
			matched_ious=[0.7],
			label_results=[
				LabelMatchingResult(
					label="fungus",
					true_positives=1,
					false_positives=0,
					false_negatives=1,
					matched_ious=(0.7,),
				),
				LabelMatchingResult(
					label="wood",
					true_positives=0,
					false_positives=1,
					false_negatives=0,
					matched_ious=(),
				),
			],
		),
	]

	result = calculate_benchmark_result(
		model_version="darknet-cnn-v1",
		image_results=image_results,
		total_images=2,
		failed_images=0,
		processing_time_ms=900,
	)

	assert result.true_positives == 3
	assert result.false_positives == 2
	assert result.false_negatives == 2
	assert result.precision == pytest.approx(3 / 5)
	assert result.recall == pytest.approx(3 / 5)
	assert result.f1_score == pytest.approx(3 / 5)
	assert result.accuracy == pytest.approx(3 / 7)
	assert result.mean_iou == pytest.approx(0.8)
	assert result.average_inference_time_ms == pytest.approx(150.0)

	assert len(result.label_metrics) == 2

	fungus_metrics = next(
		metric for metric in result.label_metrics if metric.label == "fungus"
	)
	wood_metrics = next(
		metric for metric in result.label_metrics if metric.label == "wood"
	)

	assert fungus_metrics.true_positives == 2
	assert fungus_metrics.false_positives == 1
	assert fungus_metrics.false_negatives == 1
	assert fungus_metrics.precision == pytest.approx(2 / 3)
	assert fungus_metrics.recall == pytest.approx(2 / 3)
	assert fungus_metrics.f1_score == pytest.approx(2 / 3)
	assert fungus_metrics.accuracy == pytest.approx(2 / 4)
	assert fungus_metrics.mean_iou == pytest.approx(0.8)

	assert wood_metrics.true_positives == 1
	assert wood_metrics.false_positives == 1
	assert wood_metrics.false_negatives == 1
	assert wood_metrics.precision == pytest.approx(0.5)
	assert wood_metrics.recall == pytest.approx(0.5)
	assert wood_metrics.f1_score == pytest.approx(0.5)
	assert wood_metrics.accuracy == pytest.approx(1 / 3)
	assert wood_metrics.mean_iou == pytest.approx(0.8)