"""API-Schemas für verfügbare Modellversionen."""

from pydantic import BaseModel, Field


class AvailableModelsResponse(BaseModel):
    """Antwortschema für verfügbare Darknet-Modelle."""

    available_models: list[str] = Field(default_factory=list)
    default_model_version: str
