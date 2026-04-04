"""API-Schemas für den Vorhersage-Endpunkt."""

from pydantic import BaseModel


class PredictionSuccessResponse(BaseModel):
    """Einfache Erfolgsantwort für den ersten /predict-Endpunkt."""

    status: str
    message: str
    model_version: str
    inference_time_ms: int