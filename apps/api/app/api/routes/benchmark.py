"""HTTP-Endpunkt zum Starten eines Modell-Benchmarks."""

from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.schemas.benchmark import BenchmarkResponse, ImageBenchmarkResultSchema
from app.core.config import Settings
from app.core.dependencies import get_benchmark_service, get_settings_dependency
from app.domain.benchmark.entities import BenchmarkInput, BenchmarkResult
from app.domain.benchmark.exceptions import (
	BenchmarkBadRequestError,
	BenchmarkExecutionError,
)
from app.domain.benchmark.service import BenchmarkService

router = APIRouter(tags=["benchmark"])


def to_benchmark_response(
	result: BenchmarkResult,
	request_id: str,
) -> BenchmarkResponse:
	return BenchmarkResponse(
		request_id=request_id,
		model_version=result.model_version,
		processing_time_ms=result.processing_time_ms,
		average_inference_time_ms=result.average_inference_time_ms,
		true_positives=result.true_positives,
		false_positives=result.false_positives,
		false_negatives=result.false_negatives,
		precision=result.precision,
		recall=result.recall,
		f1_score=result.f1_score,
		accuracy=result.accuracy,
		mean_iou=result.mean_iou,
		map=result.map_score,
		total_images=result.total_images,
		failed_images=result.failed_images,
		image_results=[
			ImageBenchmarkResultSchema(
				image_id=img.image_id,
				ground_truth_count=img.ground_truth_count,
				predicted_count=img.predicted_count,
				true_positives=img.true_positives,
				false_positives=img.false_positives,
				false_negatives=img.false_negatives,
				inference_time_ms=img.inference_time_ms,
				error=img.error,
			)
			for img in result.image_results
		],
	)


@router.post("/benchmark", response_model=BenchmarkResponse)
async def benchmark(
	settings: Annotated[Settings, Depends(get_settings_dependency)],
	service: Annotated[BenchmarkService, Depends(get_benchmark_service)],
	test_archive: Annotated[
		UploadFile,
		File(description="ZIP-Archiv mit Testbildern (JPG, PNG)."),
	],
	label_archive: Annotated[
		UploadFile,
		File(description="ZIP-Archiv mit YOLO-Labels (.txt, eine Datei pro Bild)."),
	],
) -> BenchmarkResponse:
	test_bytes = await test_archive.read()
	label_bytes = await label_archive.read()

	max_bytes = settings.max_benchmark_archive_size_bytes

	if not test_bytes:
		raise BenchmarkBadRequestError("Das Testbilder-Archiv ist leer.")
	if not label_bytes:
		raise BenchmarkBadRequestError("Das Label-Archiv ist leer.")
	if len(test_bytes) > max_bytes:
		raise BenchmarkBadRequestError(
			f"Das Testbilder-Archiv ist zu groß (Max: {settings.max_benchmark_archive_size_mb} MB)."
		)
	if len(label_bytes) > max_bytes:
		raise BenchmarkBadRequestError(
			f"Das Label-Archiv ist zu groß (Max: {settings.max_benchmark_archive_size_mb} MB)."
		)

	benchmark_input = BenchmarkInput(
		test_archive_bytes=test_bytes,
		test_archive_filename=test_archive.filename or "test.zip",
		label_archive_bytes=label_bytes,
		label_archive_filename=label_archive.filename or "labels.zip",
	)

	try:
		result = service.benchmark(benchmark_input)
	except BenchmarkBadRequestError:
		raise
	except Exception as exc:
		raise BenchmarkExecutionError(
			"Der Benchmark konnte nicht erfolgreich ausgeführt werden."
		) from exc

	return to_benchmark_response(result, request_id=str(uuid4()))