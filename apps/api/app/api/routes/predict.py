"""HTTP-Endpunkt zum Auslösen einer Vorhersage."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.schemas.prediction import PredictionSuccessResponse
from app.core.config import Settings, get_settings
from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import PredictionInput
from app.domain.prediction.service import PredictionService


router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionSuccessResponse)
def predict(
    service: Annotated[PredictionService, Depends(get_prediction_service)],
) -> PredictionSuccessResponse:
    settings: Settings = get_settings()

    image_path = Path(settings.prediction_test_image_path)
    image_bytes = image_path.read_bytes()

    prediction_input = PredictionInput(
        filename=image_path.name,
        content_type="image/jpeg",
        image_bytes=image_bytes,
    )

    result = service.predict(prediction_input)

    return PredictionSuccessResponse(
        status="success",
        message="Prediction executed successfully",
        model_version=result.model_version,
        inference_time_ms=result.inference_time_ms,
    )