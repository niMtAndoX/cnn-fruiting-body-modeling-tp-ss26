import io
import zipfile

import pytest

from app.domain.benchmark.entities import BenchmarkInput
from app.domain.benchmark.exceptions import BenchmarkBadRequestError
from app.domain.benchmark.service import BenchmarkService
from app.domain.prediction.entities import BoundingBox, Detection, PredictionInput, PredictionResult
from app.domain.prediction.ports import PredictionPort


def _make_zip(files: dict[str, bytes]) -> bytes:
	buf = io.BytesIO()
	with zipfile.ZipFile(buf, "w") as zf:
		for name, content in files.items():
			zf.writestr(name, content)
	return buf.getvalue()


def _make_real_image(width: int = 100, height: int = 100) -> bytes:
	from PIL import Image as PILImage

	img = PILImage.new("RGB", (width, height), color=(128, 64, 32))
	buf = io.BytesIO()
	img.save(buf, format="JPEG")
	return buf.getvalue()


class FakePredictionPort(PredictionPort):
	def __init__(self, result: PredictionResult) -> None:
		self.result = result
		self.received_inputs: list[PredictionInput] = []

	def predict(self, prediction_input: PredictionInput) -> PredictionResult:
		self.received_inputs.append(prediction_input)
		return self.result


class FailingPredictionPort(PredictionPort):
	def predict(self, prediction_input: PredictionInput) -> PredictionResult:
		raise RuntimeError("Darknet nicht verfügbar")


def _make_service(result: PredictionResult) -> tuple[BenchmarkService, FakePredictionPort]:
	port = FakePredictionPort(result=result)
	service = BenchmarkService(prediction_port=port)
	return service, port


def test_benchmark_delegates_to_prediction_port() -> None:
	image_bytes = _make_real_image()
	fake_result = PredictionResult(
		model_version="test-v1",
		detections=[Detection(label="fungus", score=0.9, bbox=BoundingBox(x=10, y=10, width=20, height=20))],
		inference_time_ms=50,
	)
	service, port = _make_service(fake_result)

	benchmark_input = BenchmarkInput(
		test_archive_bytes=_make_zip({"img.jpg": image_bytes}),
		test_archive_filename="test.zip",
		label_archive_bytes=_make_zip({"img.txt": b"0 0.2 0.2 0.2 0.2"}),
		label_archive_filename="labels.zip",
	)
	service.benchmark(benchmark_input)

	assert len(port.received_inputs) == 1
	assert port.received_inputs[0].filename == "img.jpg"


def test_benchmark_result_uses_model_version_from_prediction() -> None:
	image_bytes = _make_real_image()
	fake_result = PredictionResult(
		model_version="darknet-cnn-v2",
		detections=[],
		inference_time_ms=50,
	)
	service, _ = _make_service(fake_result)

	result = service.benchmark(
		BenchmarkInput(
			test_archive_bytes=_make_zip({"img.jpg": image_bytes}),
			test_archive_filename="test.zip",
			label_archive_bytes=_make_zip({"img.txt": b""}),
			label_archive_filename="labels.zip",
		)
	)

	assert result.model_version == "darknet-cnn-v2"


def test_benchmark_counts_total_and_failed_images() -> None:
	good_image = _make_real_image()
	bad_image = b"no-image"

	fake_result = PredictionResult(model_version="v1", detections=[], inference_time_ms=10)
	service, _ = _make_service(fake_result)

	result = service.benchmark(
		BenchmarkInput(
			test_archive_bytes=_make_zip({"good.jpg": good_image, "bad.jpg": bad_image}),
			test_archive_filename="test.zip",
			label_archive_bytes=_make_zip({}),
			label_archive_filename="labels.zip",
		)
	)

	assert result.total_images == 2
	assert result.failed_images == 1


def test_benchmark_ignores_non_benchmark_files_in_archives() -> None:
	image_bytes = _make_real_image()
	fake_result = PredictionResult(model_version="v1", detections=[], inference_time_ms=10)
	service, port = _make_service(fake_result)

	result = service.benchmark(
		BenchmarkInput(
			test_archive_bytes=_make_zip(
				{
					"dataset/img.jpg": image_bytes,
					"._img.jpg": b"not-an-image",
					"__MACOSX/._img.jpg": b"not-an-image",
					".DS_Store": b"finder-metadata",
					"Thumbs.db": b"windows-thumbnail-cache",
					"desktop.ini": b"windows-metadata",
					".directory": b"linux-directory-metadata",
					".hidden/img.jpg": image_bytes,
					"dataset/.hidden.jpg": image_bytes,
					"dataset/img.jpg~": image_bytes,
					"notes.md": b"not-a-benchmark-image",
				}
			),
			test_archive_filename="test.zip",
			label_archive_bytes=_make_zip(
				{
					"dataset/img.txt": b"0 0.5 0.5 0.2 0.2",
					"._img.txt": b"0 0.1 0.1 0.1 0.1",
					"__MACOSX/._img.txt": b"0 0.1 0.1 0.1 0.1",
					".DS_Store": b"finder-metadata",
					"Thumbs.db": b"windows-thumbnail-cache",
					"desktop.ini": b"windows-metadata",
					".directory": b"linux-directory-metadata",
					".hidden/img.txt": b"0 0.1 0.1 0.1 0.1",
					"dataset/.hidden.txt": b"0 0.1 0.1 0.1 0.1",
					"dataset/img.txt~": b"0 0.1 0.1 0.1 0.1",
					"readme.md": b"not-a-label-file",
				}
			),
			label_archive_filename="labels.zip",
		)
	)

	assert result.total_images == 1
	assert result.failed_images == 0
	assert len(port.received_inputs) == 1
	assert port.received_inputs[0].filename == "img.jpg"
	assert result.image_results[0].image_id == "img"
	assert result.image_results[0].ground_truth_count == 1


def test_benchmark_image_results_contain_per_image_data() -> None:
	image_bytes = _make_real_image(width=200, height=200)
	fake_result = PredictionResult(
		model_version="v1",
		detections=[
			Detection(label="fungus", score=0.9, bbox=BoundingBox(x=80, y=80, width=40, height=40))
		],
		inference_time_ms=10,
	)
	service, _ = _make_service(fake_result)

	result = service.benchmark(
		BenchmarkInput(
			test_archive_bytes=_make_zip({"img.jpg": image_bytes}),
			test_archive_filename="test.zip",
			label_archive_bytes=_make_zip({"img.txt": b"0 0.5 0.5 0.2 0.2"}),
			label_archive_filename="labels.zip",
		)
	)

	assert len(result.image_results) == 1
	img_result = result.image_results[0]
	assert img_result.image_id == "img"
	assert img_result.ground_truth_count == 1
	assert img_result.predicted_count == 1
	assert img_result.error is None


def test_benchmark_marks_failed_image_with_error() -> None:
	image_bytes = _make_real_image()
	service = BenchmarkService(prediction_port=FailingPredictionPort())

	result = service.benchmark(
		BenchmarkInput(
			test_archive_bytes=_make_zip({"img.jpg": image_bytes}),
			test_archive_filename="test.zip",
			label_archive_bytes=_make_zip({"img.txt": b"0 0.5 0.5 0.2 0.2"}),
			label_archive_filename="labels.zip",
		)
	)

	assert result.failed_images == 1
	assert result.image_results[0].error is not None


def test_benchmark_raises_bad_request_for_empty_image_archive() -> None:
	empty_zip = _make_zip({})
	label_zip = _make_zip({"img.txt": b"0 0.5 0.5 0.2 0.2"})

	fake_result = PredictionResult(model_version="v1", detections=[], inference_time_ms=10)
	service, _ = _make_service(fake_result)

	with pytest.raises(BenchmarkBadRequestError):
		service.benchmark(
			BenchmarkInput(
				test_archive_bytes=empty_zip,
				test_archive_filename="test.zip",
				label_archive_bytes=label_zip,
				label_archive_filename="labels.zip",
			)
		)


def test_benchmark_raises_bad_request_for_invalid_zip() -> None:
	fake_result = PredictionResult(model_version="v1", detections=[], inference_time_ms=10)
	service, _ = _make_service(fake_result)

	with pytest.raises(BenchmarkBadRequestError):
		service.benchmark(
			BenchmarkInput(
				test_archive_bytes=b"not-a-zip",
				test_archive_filename="test.zip",
				label_archive_bytes=_make_zip({}),
				label_archive_filename="labels.zip",
			)
		)
