"""Contract-Tests für das öffentliche Benchmark-Response-Schema."""

import pytest
from pydantic import ValidationError

from app.api.schemas.benchmark import BenchmarkResponse


def make_valid_benchmark_response_payload() -> dict[str, object]:
	return {
		"request_id": "8fd17d72-3d31-4d87-956c-f8595dc5503f",
		"model_version": "darknet-cnn-v1",
		"processing_time_ms": 1250,
		"average_inference_time_ms": 87.5,
		"true_positives": 8,
		"false_positives": 2,
		"false_negatives": 1,
		"precision": 0.8,
		"recall": 8 / 9,
		"f1_score": 0.8421052632,
		"accuracy": 8 / 11,
		"mean_iou": 0.76,
		"map": 0.74,
		"total_images": 5,
		"failed_images": 0,
		"per_label": [
			{
				"label": "fungus",
				"true_positives": 8,
				"false_positives": 2,
				"false_negatives": 1,
				"precision": 0.8,
				"recall": 8 / 9,
				"f1_score": 0.8421052632,
				"accuracy": 8 / 11,
				"mean_iou": 0.76,
			}
		],
		"image_results": [
			{
				"image_id": "image-1",
				"ground_truth_count": 2,
				"predicted_count": 2,
				"true_positives": 2,
				"false_positives": 0,
				"false_negatives": 0,
				"inference_time_ms": 91,
				"error": None,
				"score": 0
			}
		],
	}


def test_benchmark_response_schema_keeps_frontend_relevant_top_level_fields_stable() -> None:
	response = BenchmarkResponse.model_validate(
		make_valid_benchmark_response_payload()
	)
	body = response.model_dump()

	assert set(body) == {
		"request_id",
		"model_version",
		"processing_time_ms",
		"average_inference_time_ms",
		"true_positives",
		"false_positives",
		"false_negatives",
		"precision",
		"recall",
		"f1_score",
		"accuracy",
		"mean_iou",
		"map",
		"total_images",
		"failed_images",
		"per_label",
		"image_results",
		"zip_file"
	}


def test_benchmark_response_schema_preserves_expected_field_types() -> None:
	response = BenchmarkResponse.model_validate(
		make_valid_benchmark_response_payload()
	)
	body = response.model_dump()

	assert isinstance(body["request_id"], str)
	assert isinstance(body["model_version"], str)

	assert isinstance(body["processing_time_ms"], int)
	assert isinstance(body["average_inference_time_ms"], float)

	assert isinstance(body["true_positives"], int)
	assert isinstance(body["false_positives"], int)
	assert isinstance(body["false_negatives"], int)

	assert isinstance(body["precision"], float)
	assert isinstance(body["recall"], float)
	assert isinstance(body["f1_score"], float)
	assert isinstance(body["accuracy"], float)
	assert isinstance(body["mean_iou"], float)
	assert isinstance(body["map"], float)

	assert isinstance(body["total_images"], int)
	assert isinstance(body["failed_images"], int)

	assert isinstance(body["per_label"], list)
	assert isinstance(body["image_results"], list)
	assert isinstance(body["zip_file"], str)



def test_benchmark_response_schema_preserves_nested_frontend_fields() -> None:
	response = BenchmarkResponse.model_validate(
		make_valid_benchmark_response_payload()
	)
	body = response.model_dump()

	label_metrics = body["per_label"][0]
	assert set(label_metrics) == {
		"label",
		"true_positives",
		"false_positives",
		"false_negatives",
		"precision",
		"recall",
		"f1_score",
		"accuracy",
		"mean_iou",
	}

	image_result = body["image_results"][0]
	assert set(image_result) == {
		"image_id",
		"ground_truth_count",
		"predicted_count",
		"true_positives",
		"false_positives",
		"false_negatives",
		"inference_time_ms",
		"error",
		"score"
	}


def test_benchmark_response_schema_allows_empty_result_lists() -> None:
	payload = make_valid_benchmark_response_payload()
	payload["per_label"] = []
	payload["image_results"] = []

	response = BenchmarkResponse.model_validate(payload)
	body = response.model_dump()

	assert body["per_label"] == []
	assert body["image_results"] == []


@pytest.mark.parametrize(
	"missing_field",
	[
		"request_id",
		"model_version",
		"processing_time_ms",
		"precision",
		"recall",
		"f1_score",
		"map",
		"total_images",
		"failed_images",
		"image_results",
		"zip_file"
	],
)
def test_benchmark_response_schema_rejects_missing_required_fields(
	missing_field: str,
) -> None:
	payload = make_valid_benchmark_response_payload()
	payload.pop(missing_field)

	with pytest.raises(ValidationError):
		BenchmarkResponse.model_validate(payload)