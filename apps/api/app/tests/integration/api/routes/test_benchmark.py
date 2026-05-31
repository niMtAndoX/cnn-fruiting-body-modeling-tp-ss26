import io
import zipfile
from uuid import UUID

from fastapi.testclient import TestClient

from app.core.dependencies import get_benchmark_service
from app.domain.benchmark.entities import BenchmarkResult
from app.domain.benchmark.exceptions import BenchmarkBadRequestError
from app.main import app


def make_zip(files: dict[str, bytes]) -> bytes:
	buf = io.BytesIO()
	with zipfile.ZipFile(buf, "w") as zf:
		for name, content in files.items():
			zf.writestr(name, content)
	return buf.getvalue()


FAKE_RESULT = BenchmarkResult(
	model_version="test-model-v1",
	precision=0.91,
	recall=0.85,
	f1_score=0.88,
	map_score=0.87,
	total_images=50,
	failed_images=0,
	processing_time_ms=3200,
	image_results=[],
	zip_file=""
)

TEST_ZIP = make_zip({"img1.jpg": b"fake-image", "img2.jpg": b"fake-image-2"})
LABEL_ZIP = make_zip({"img1.txt": b"0 0.5 0.5 0.3 0.3", "img2.txt": b"0 0.4 0.4 0.2 0.2"})


class FakeBenchmarkService:
	def benchmark(self, benchmark_input):
		return FAKE_RESULT


class FailingBenchmarkService:
	def benchmark(self, benchmark_input):
		raise RuntimeError("Darknet nicht verfügbar")


class BadRequestBenchmarkService:
	def benchmark(self, benchmark_input):
		raise BenchmarkBadRequestError("Das Testarchiv enthält keine Bilder.")


def test_benchmark_returns_benchmark_response() -> None:
	app.dependency_overrides[get_benchmark_service] = lambda: FakeBenchmarkService()

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": ("test_images.zip", TEST_ZIP, "application/zip"),
				"label_archive": ("labels.zip", LABEL_ZIP, "application/zip"),
			},
		)

		assert response.status_code == 200

		body = response.json()
		UUID(body.pop("request_id"))

		assert body == {
			"model_version": "test-model-v1",
			"processing_time_ms": 3200,
			"average_inference_time_ms": 0.0,
			"true_positives": 0,
			"false_positives": 0,
			"false_negatives": 0,
			"precision": 0.91,
			"recall": 0.85,
			"f1_score": 0.88,
			"accuracy": 0.0,
			"mean_iou": 0.0,
			"map": 0.87,
			"total_images": 50,
			"failed_images": 0,
			"per_label": [],
			"image_results": [],
			"zip_file": ""
		}
	finally:
		app.dependency_overrides.clear()


def test_benchmark_returns_400_for_empty_test_archive() -> None:
	client = TestClient(app)
	response = client.post(
		"/api/v1/benchmark",
		files={
			"test_archive": ("test.zip", b"", "application/zip"),
			"label_archive": ("labels.zip", LABEL_ZIP, "application/zip"),
		},
	)

	assert response.status_code == 400
	assert response.json()["error"] == "bad_request"
	assert "leer" in response.json()["message"].lower()


def test_benchmark_returns_400_for_empty_label_archive() -> None:
	client = TestClient(app)
	response = client.post(
		"/api/v1/benchmark",
		files={
			"test_archive": ("test.zip", TEST_ZIP, "application/zip"),
			"label_archive": ("labels.zip", b"", "application/zip"),
		},
	)

	assert response.status_code == 400
	assert response.json()["error"] == "bad_request"


def test_benchmark_returns_400_when_service_raises_bad_request() -> None:
	app.dependency_overrides[get_benchmark_service] = lambda: BadRequestBenchmarkService()

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": ("test.zip", TEST_ZIP, "application/zip"),
				"label_archive": ("labels.zip", LABEL_ZIP, "application/zip"),
			},
		)

		assert response.status_code == 400
		assert response.json()["error"] == "bad_request"
		assert "keine Bilder" in response.json()["message"]
	finally:
		app.dependency_overrides.clear()


def test_benchmark_returns_500_on_execution_error() -> None:
	app.dependency_overrides[get_benchmark_service] = lambda: FailingBenchmarkService()

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": ("test.zip", TEST_ZIP, "application/zip"),
				"label_archive": ("labels.zip", LABEL_ZIP, "application/zip"),
			},
		)

		assert response.status_code == 500
		assert response.json() == {
			"error": "internal_error",
			"message": "Der Benchmark konnte nicht erfolgreich ausgeführt werden.",
		}
	finally:
		app.dependency_overrides.clear()


def test_benchmark_request_id_is_valid_uuid() -> None:
	app.dependency_overrides[get_benchmark_service] = lambda: FakeBenchmarkService()

	try:
		client = TestClient(app)
		response = client.post(
			"/api/v1/benchmark",
			files={
				"test_archive": ("test.zip", TEST_ZIP, "application/zip"),
				"label_archive": ("labels.zip", LABEL_ZIP, "application/zip"),
			},
		)

		assert response.status_code == 200
		UUID(response.json()["request_id"])
	finally:
		app.dependency_overrides.clear()