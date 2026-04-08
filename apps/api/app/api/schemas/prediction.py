"""API-Schemas für Vorhersage-Ergebnisse."""

from pydantic import BaseModel


class BoundingBoxResponse(BaseModel):
    """Begrenzungsrahmen einer erkannten Struktur im Bild."""

    x: int
    y: int
    width: int
    height: int


class DetectionResponse(BaseModel):
    """Ein einzelnes Erkennungsergebnis."""

    label: str
    score: float
    bbox: BoundingBoxResponse | None = None


class PredictionResponse(BaseModel):
    """Antwortschema für eine Vorhersage."""

    model_version: str
    detections: list[DetectionResponse]
    inference_time_ms: int