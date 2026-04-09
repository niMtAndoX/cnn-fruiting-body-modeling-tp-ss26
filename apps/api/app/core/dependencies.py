"""Stellt zentrale FastAPI-Dependencies für Services und technische Adapter bereit."""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.domain.prediction.service import PredictionService
from app.infrastructure.darknet.prediction_adapter import DarknetPredictionAdapter
from app.infrastructure.darknet.runner import DarknetRunner


def get_settings_dependency() -> Settings:
    """Liefert die zentralen Anwendungseinstellungen."""
    return get_settings()


def get_darknet_runner(
    settings: Annotated[Settings, Depends(get_settings_dependency)],
) -> DarknetRunner:
    """Erzeugt einen DarknetRunner aus der Konfiguration."""
    return DarknetRunner(
        inference_script_path=settings.inference_script_path,
        inference_timeout_seconds=settings.inference_timeout_seconds,
    )


def get_prediction_service(
    settings: Annotated[Settings, Depends(get_settings_dependency)],
    runner: Annotated[DarknetRunner, Depends(get_darknet_runner)],
) -> PredictionService:
    """Erzeugt den PredictionService mit einem Darknet-basierten Adapter."""
    prediction_adapter = DarknetPredictionAdapter(
        runner=runner,
        model_version=settings.model_version,
        temp_dir=settings.inference_temp_dir,
    )
    return PredictionService(prediction_port=prediction_adapter)