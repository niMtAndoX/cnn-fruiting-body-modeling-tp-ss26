"""HTTP-Endpunkt zum Auslösen einer Vorhersage."""

from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.schemas.prediction import (
    BoundingBoxResponse,
    DetectionResponse,
    PredictionResponse,
)
from app.core.config import Settings
from app.core.dependencies import get_prediction_service, get_settings_dependency
from app.domain.prediction.entities import PredictionInput, PredictionResult
from app.domain.prediction.exceptions import (
    PredictionBadRequestError,
    PredictionExecutionError,
)
from app.domain.prediction.service import PredictionService
from app.infrastructure.darknet.parser import DarknetOutputParseError
from app.infrastructure.darknet.runner import InferenceRunnerError

router = APIRouter(tags=["prediction"])


def to_prediction_response(
    result: PredictionResult,
    request_id: str,
) -> PredictionResponse:
    return PredictionResponse(
        request_id=request_id,
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
    settings: Annotated[Settings, Depends(get_settings_dependency)],
    service: Annotated[PredictionService, Depends(get_prediction_service)],
    file: Annotated[
        UploadFile,
        File(
            description=(
                "Upload eines Bildes (JPG, PNG). "
                "Erlaubte Dateitypen und Maximalgröße werden über die API-Konfiguration gesteuert."
            )
        ),
    ],
) -> PredictionResponse:
    content_type = file.content_type or ""
    if content_type not in settings.allowed_upload_content_types:
        raise PredictionBadRequestError(f"Ungültiger Dateityp: {content_type}")

    image_bytes = await file.read()

    if len(image_bytes) > settings.max_upload_size_bytes:
        raise PredictionBadRequestError(
            f"Die Datei ist zu groß (Max: {settings.max_upload_size_mb} MB)"
        )

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

    request_id = str(uuid4())
    return to_prediction_response(result, request_id=request_id)

