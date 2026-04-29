"""HTTP-Endpunkt für Benchmark-Aufrufe."""

from io import BytesIO
from typing import Annotated
from uuid import uuid4
from zipfile import is_zipfile

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.schemas.benchmark import (
    BenchmarkBoundingBoxResponse,
    BenchmarkImageResultResponse,
    BenchmarkMatchResponse,
    BenchmarkMetricsResponse,
    BenchmarkObjectResponse,
    BenchmarkResponse,
    BenchmarkSummaryResponse,
)
from app.core.config import Settings
from app.core.dependencies import get_settings_dependency
from app.domain.benchmark.entities import (
    BenchmarkMetrics,
    BenchmarkObject,
    BenchmarkResult,
    BenchmarkSummary,
)
from app.domain.benchmark.exceptions import BenchmarkBadRequestError

router = APIRouter(tags=["benchmark"])

ALLOWED_ZIP_CONTENT_TYPES = {
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
}


async def read_and_validate_zip_upload(
    file: UploadFile,
    field_name: str,
    settings: Settings,
) -> bytes:
    filename = file.filename or ""

    if not filename.lower().endswith(".zip"):
        raise BenchmarkBadRequestError(
            f"{field_name} muss eine ZIP-Datei sein."
        )

    content_type = file.content_type or ""

    if content_type not in ALLOWED_ZIP_CONTENT_TYPES:
        raise BenchmarkBadRequestError(
            f"{field_name} hat einen ungültigen Dateityp: {content_type}"
        )

    content = await file.read()

    if not content:
        raise BenchmarkBadRequestError(
            f"{field_name} ist leer."
        )

    if len(content) > settings.max_benchmark_zip_size_bytes:
        raise BenchmarkBadRequestError(
            f"{field_name} ist zu groß. "
            f"Maximal erlaubt: {settings.max_benchmark_zip_size_mb} MB."
        )

    if not is_zipfile(BytesIO(content)):
        raise BenchmarkBadRequestError(
            f"{field_name} ist keine gültige ZIP-Datei."
        )

    return content


def to_benchmark_object_response(
    benchmark_object: BenchmarkObject,
) -> BenchmarkObjectResponse:
    return BenchmarkObjectResponse(
        label=benchmark_object.label,
        score=benchmark_object.score,
        bbox=(
            BenchmarkBoundingBoxResponse(
                x=benchmark_object.bbox.x,
                y=benchmark_object.bbox.y,
                width=benchmark_object.bbox.width,
                height=benchmark_object.bbox.height,
            )
            if benchmark_object.bbox is not None
            else None
        ),
    )


def to_benchmark_response(result: BenchmarkResult) -> BenchmarkResponse:
    return BenchmarkResponse(
        request_id=result.request_id,
        model_version=result.model_version,
        summary=BenchmarkSummaryResponse(
            total_images=result.summary.total_images,
            processed_images=result.summary.processed_images,
            failed_images=result.summary.failed_images,
        ),
        metrics=BenchmarkMetricsResponse(
            true_positives=result.metrics.true_positives,
            false_positives=result.metrics.false_positives,
            false_negatives=result.metrics.false_negatives,
            precision=result.metrics.precision,
            recall=result.metrics.recall,
            f1_score=result.metrics.f1_score,
            accuracy=result.metrics.accuracy,
            mean_iou=result.metrics.mean_iou,
            average_inference_time_ms=result.metrics.average_inference_time_ms,
            total_processing_time_ms=result.metrics.total_processing_time_ms,
        ),
        images=[
            BenchmarkImageResultResponse(
                filename=image.filename,
                predictions=[
                    to_benchmark_object_response(prediction)
                    for prediction in image.predictions
                ],
                ground_truth=[
                    to_benchmark_object_response(ground_truth)
                    for ground_truth in image.ground_truth
                ],
                matches=[
                    BenchmarkMatchResponse(
                        prediction_index=match.prediction_index,
                        ground_truth_index=match.ground_truth_index,
                        label=match.label,
                        iou=match.iou,
                        status=match.status,
                    )
                    for match in image.matches
                ],
                error=image.error,
            )
            for image in result.images
        ],
    )


@router.post("/benchmark", response_model=BenchmarkResponse)
async def benchmark(
    settings: Annotated[Settings, Depends(get_settings_dependency)],
    test_archive: Annotated[
        UploadFile | None,
        File(description="ZIP-Archiv mit unmarkierten Testbildern."),
    ] = None,
    label_archive: Annotated[
        UploadFile | None,
        File(description="ZIP-Archiv mit maschinenlesbaren Ground-Truth-Labels."),
    ] = None,
) -> BenchmarkResponse:
    if test_archive is None and label_archive is None:
        raise BenchmarkBadRequestError(
            "test_archive und label_archive fehlen."
        )

    if test_archive is None:
        raise BenchmarkBadRequestError("test_archive fehlt.")

    if label_archive is None:
        raise BenchmarkBadRequestError("label_archive fehlt.")

    test_archive_bytes = await read_and_validate_zip_upload(
        file=test_archive,
        field_name="test_archive",
        settings=settings,
    )
    label_archive_bytes = await read_and_validate_zip_upload(
        file=label_archive,
        field_name="label_archive",
        settings=settings,
    )

    _ = test_archive_bytes
    _ = label_archive_bytes

    result = BenchmarkResult(
        request_id=str(uuid4()),
        model_version="benchmark-dummy-model",
        summary=BenchmarkSummary(
            total_images=0,
            processed_images=0,
            failed_images=0,
        ),
        metrics=BenchmarkMetrics(
            true_positives=0,
            false_positives=0,
            false_negatives=0,
            precision=0.0,
            recall=0.0,
            f1_score=0.0,
            accuracy=0.0,
            mean_iou=0.0,
            average_inference_time_ms=None,
            total_processing_time_ms=None,
        ),
        images=[],
    )

    return to_benchmark_response(result)