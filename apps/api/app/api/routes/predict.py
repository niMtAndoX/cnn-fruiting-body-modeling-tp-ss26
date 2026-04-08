"""HTTP-Endpunkt zum Auslösen einer Vorhersage."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.schemas.prediction import (
    BoundingBoxResponse,
    DetectionResponse,
    PredictionResponse,
)
from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import PredictionInput, PredictionResult
from app.domain.prediction.exceptions import (
    PredictionBadRequestError,
    PredictionExecutionError,
)
from app.domain.prediction.service import PredictionService
from app.infrastructure.darknet.parser import DarknetOutputParseError
from app.infrastructure.darknet.runner import InferenceRunnerError

router = APIRouter(tags=["prediction"])

ALLOWED_TYPES = ["image/png", "image/jpeg"]
MAX_SIZE = 20 * 1024 * 1024


def to_prediction_response(result: PredictionResult) -> PredictionResponse:
    return PredictionResponse(
        model_version=result.model_version,
        detections=[
            DetectionResponse(
                label=detection.label,
                score=detection.score,
                bbox=(
                    BoundingBoxResponse(
                        x=detection.bbox.x,
                        y=detection.bbox.y,
                        width=detection.bbox.width,
                        height=detection.bbox.height,
                    )
                    if detection.bbox is not None
                    else None
                ),
            )
            for detection in result.detections
        ],
        inference_time_ms=result.inference_time_ms,
    )


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    service: Annotated[PredictionService, Depends(get_prediction_service)],
    file: Annotated[
        UploadFile,
        File(description="Upload eines Bildes (JPG, PNG) <br>Maximale Größe: 20 MB"),
    ],
) -> PredictionResponse:
    if file.content_type not in ALLOWED_TYPES:
        raise PredictionBadRequestError(f"Ungültiger Dateityp: {file.content_type}")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE:
        raise PredictionBadRequestError("Die Datei ist zu groß (Max: 20 MB)")

    if not image_bytes:
        raise PredictionBadRequestError("Leere Datei gesendet")

    prediction_input = PredictionInput(
        filename=file.filename or "upload.jpg",
        content_type=file.content_type or "image/jpeg",
        image_bytes=image_bytes,
    )

    try:
        result = service.predict(prediction_input)
    except PredictionBadRequestError:
        raise
    except (InferenceRunnerError, DarknetOutputParseError) as exc:
        raise PredictionExecutionError(
            "Die Bilderkennung konnte nicht erfolgreich ausgeführt werden."
        ) from exc

    return to_prediction_response(result)