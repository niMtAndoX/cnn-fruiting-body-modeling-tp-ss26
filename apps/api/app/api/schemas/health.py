from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Antwort für den /health-Endpunkt."""

    status: str
