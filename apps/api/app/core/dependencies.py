"""Stellt zentrale FastAPI-Dependencies für Services und technische Adapter bereit."""

from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.domain.benchmark.service import BenchmarkService
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
        darknet_bin_path=settings.darknet_bin_path,
        bash_executable=settings.bash_executable,
    )


def get_prediction_adapter(
    settings: Annotated[Settings, Depends(get_settings_dependency)],
    runner: Annotated[DarknetRunner, Depends(get_darknet_runner)],
) -> DarknetPredictionAdapter:
    """Erzeugt den gemeinsamen Darknet-Prediction-Adapter."""
    return DarknetPredictionAdapter(
        runner=runner,
        model_version=settings.model_version,
        temp_dir=settings.inference_temp_dir,
    )


def get_prediction_service(
    adapter: Annotated[DarknetPredictionAdapter, Depends(get_prediction_adapter)],
) -> PredictionService:
    """Erzeugt den PredictionService mit dem gemeinsamen Darknet-Adapter."""
    return PredictionService(prediction_port=adapter)


def get_benchmark_service(
    adapter: Annotated[DarknetPredictionAdapter, Depends(get_prediction_adapter)],
) -> BenchmarkService:
    """Erzeugt den BenchmarkService; nutzt denselben Prediction-Adapter wie der PredictionService."""
    return BenchmarkService(prediction_port=adapter)
