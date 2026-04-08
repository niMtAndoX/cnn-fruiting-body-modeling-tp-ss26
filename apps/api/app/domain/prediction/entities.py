from dataclasses import dataclass


@dataclass
class BoundingBox:
    """Begrenzungsrahmen einer Erkennung im Bild."""

    x: int
    y: int
    width: int
    height: int


@dataclass
class Detection:
    """Ein einzelnes internes Erkennungsergebnis."""

    label: str
    score: float
    bbox: BoundingBox | None = None


@dataclass
class PredictionInput:
    """Interne Eingabedaten für eine Vorhersage."""

    filename: str
    content_type: str
    image_bytes: bytes


@dataclass
class PredictionResult:
    """Internes Gesamtergebnis einer Vorhersage."""

    model_version: str
    detections: list[Detection]
    inference_time_ms: int