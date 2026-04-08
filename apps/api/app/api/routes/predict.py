"""HTTP-Endpunkt zum Auslösen einer Vorhersage."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile, File

from app.api.schemas.prediction import PredictionSuccessResponse
from app.core.config import Settings, get_settings
from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import PredictionInput
from app.domain.prediction.exceptions import (
    PredictionBadRequestError,
    PredictionExecutionError,
)
from app.domain.prediction.service import PredictionService
from app.infrastructure.darknet.runner import InferenceRunnerError

router = APIRouter(tags=["prediction"])

ALLOWED_TYPES = ["image/png", "image/jpeg"]

@router.post("/predict", response_model=PredictionSuccessResponse)
async def predict(
    service: Annotated[PredictionService, Depends(get_prediction_service)], file: UploadFile = File(None, description="Upload eines Bildes (JPG, PNG, WEBP) <br>Maximale Größe: 20 MB")
) -> PredictionSuccessResponse:
    settings: Settings = get_settings()

    MAX_SIZE = 20*1024*1024

    if file is None:
        raise PredictionBadRequestError("Keine Datei gesendet")

    if file.content_type not in ALLOWED_TYPES:
        raise PredictionBadRequestError(f"Ungültiger Dateityp: {file.content_type}")

    image_bytes = await file.read()
    size = len(image_bytes)

    if size > MAX_SIZE:
        raise PredictionBadRequestError("Die Datei ist zu groß (Max: 20 MB)")

    if not image_bytes:
        raise PredictionBadRequestError("Leere Datei gesendet")

    prediction_input = PredictionInput(
        filename=file.filename,
        content_type=file.content_type,
        image_bytes=image_bytes,
    )

    try:
        result = service.predict(prediction_input)
    except InferenceRunnerError as exc:
        raise PredictionExecutionError("Prediction execution failed.") from exc
    except Exception as exc:
        raise PredictionExecutionError("Prediction failed unexpectedly.") from exc

    return PredictionSuccessResponse(
        status="success",
        message="Prediction executed successfully",
        model_version=result.model_version,
        inference_time_ms=result.inference_time_ms,
    )