"""HTTP-Endpunkt zum Abrufen verfügbarer Modellversionen."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.schemas.models import AvailableModelsResponse
from app.core.config import Settings
from app.core.dependencies import (
    get_darknet_model_registry,
    get_settings_dependency,
)
from app.infrastructure.darknet.model_registry import (
    DarknetModelRegistry,
    NoModelsAvailableError,
)

router = APIRouter(tags=["models"])


@router.get("/models", response_model=AvailableModelsResponse)
def get_available_models(
    settings: Annotated[Settings, Depends(get_settings_dependency)],
    model_registry: Annotated[DarknetModelRegistry, Depends(get_darknet_model_registry)],
) -> AvailableModelsResponse:
    try:
        return AvailableModelsResponse(
            available_models=model_registry.list_model_versions(),
            default_model_version=model_registry.get_default_model_version(
                settings.model_version
            ),
        )
    except NoModelsAvailableError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
