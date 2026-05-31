"""Integrationstests für den Benchmark-Endpunkt."""

import io
import zipfile
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.dependencies import get_benchmark_service
from app.domain.benchmark.service import BenchmarkService
from app.main import app


def make_zip(files: dict[str, bytes]) -> bytes:
	"""Erzeugt ein ZIP-Archiv im Speicher."""
	buffer = io.BytesIO()

	with zipfile.ZipFile(buffer, "w") as zip_file:
		for filename, content in files.items():
			zip_file.writestr(filename, content)

	return buffer.getvalue()


def make_png_image() -> bytes:
	"""Erzeugt ein kleines gültiges PNG-Testbild."""
	buffer = io.BytesIO()

	image = Image.new("RGB", (100, 100))
	image.save(buffer, format="PNG")

	return buffer.getvalue()


class FakePredictionPort:
	"""Fake der Modellvorhersage für den Integrationstest."""

	def predict(self, prediction_input):
		return SimpleNamespace(
			model_version="test-model-v1",
			inference_time_ms=42,
			detections=[
				SimpleNamespace(
					label="fungus",
					score=0.99,
					bbox=SimpleNamespace(
						x=30,
						y=30,
						width=40,
						height=40,
					),
				)
			],
		)


def override_benchmark_service() -> BenchmarkService:
	return BenchmarkService(prediction_port=FakePredictionPort())


def test_benchmark_route_returns_metrics_and_image_results_for_valid_archives() -> None:
	app.dependency_overrides[get_benchmark_service] = override_benchmark_service

	test_archive = make_zip(
		{
			"image_1.png": make_png_image(),
		}
	)
	label_archive = make_zip(
		{
			"image_1.txt": b"0 0.5 0.5 0.4 0.4",
		}
	)

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": (
					"test_images.zip",
					test_archive,
					"application/zip",
				),
				"label_archive": (
					"labels.zip",
					label_archive,
					"application/zip",
				),
			},
		)

		assert response.status_code == 200

		body = response.json()
		UUID(body["request_id"])

		# Zusammenfassung
		assert body["model_version"] == "test-model-v1"
		assert body["total_images"] == 1
		assert body["failed_images"] == 0
		assert body["processing_time_ms"] >= 0

		# Globale Metriken
		assert body["true_positives"] == 1
		assert body["false_positives"] == 0
		assert body["false_negatives"] == 0
		assert body["precision"] == pytest.approx(1.0)
		assert body["recall"] == pytest.approx(1.0)
		assert body["f1_score"] == pytest.approx(1.0)
		assert body["accuracy"] == pytest.approx(1.0)
		assert body["mean_iou"] == pytest.approx(1.0)
		assert body["average_inference_time_ms"] == pytest.approx(42.0)

		# Per-Label-Metriken
		assert body["per_label"] == [
			{
				"label": "fungus",
				"true_positives": 1,
				"false_positives": 0,
				"false_negatives": 0,
				"precision": pytest.approx(1.0),
				"recall": pytest.approx(1.0),
				"f1_score": pytest.approx(1.0),
				"accuracy": pytest.approx(1.0),
				"mean_iou": pytest.approx(1.0),
			}
		]

		# Bildresultate
		assert len(body["image_results"]) == 1

		image_result = body["image_results"][0]
		assert image_result == {
			"image_id": "image_1",
			"ground_truth_count": 1,
			"predicted_count": 1,
			"true_positives": 1,
			"false_positives": 0,
			"false_negatives": 0,
			"inference_time_ms": 42,
			"error": None,
			"score": 0
		}
	finally:
		app.dependency_overrides.clear()


@pytest.mark.parametrize(
	"invalid_archive",
	["test_archive", "label_archive"],
	ids=["invalid-test-archive", "invalid-label-archive"],
)
def test_benchmark_route_returns_400_for_invalid_zip_archives(
	invalid_archive: str,
) -> None:
	app.dependency_overrides[get_benchmark_service] = override_benchmark_service

	valid_test_archive = make_zip(
		{
			"image_1.png": make_png_image(),
		}
	)
	valid_label_archive = make_zip(
		{
			"image_1.txt": b"0 0.5 0.5 0.4 0.4",
		}
	)

	test_archive = (
		b"not-a-valid-zip"
		if invalid_archive == "test_archive"
		else valid_test_archive
	)
	label_archive = (
		b"not-a-valid-zip"
		if invalid_archive == "label_archive"
		else valid_label_archive
	)

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": (
					"test_images.zip",
					test_archive,
					"application/zip",
				),
				"label_archive": (
					"labels.zip",
					label_archive,
					"application/zip",
				),
			},
		)

		assert response.status_code == 400
		assert response.json()["error"] == "bad_request"
		assert "zip-archiv" in response.json()["message"].lower()
	finally:
		app.dependency_overrides.clear()