from dataclasses import dataclass

"""Interne Domain-Modelle für den Use Case der Bilderkennung."""
@dataclass
class PredictionInput:
    filename: str
    content_type: str
    image_bytes: bytes


@dataclass
class BoundingBox:
    x: int
    y: int
    width: int
    height: int


@dataclass
class Detection:
    label: str
    score: float
    bbox: BoundingBox | None = None


@dataclass
class PredictionResult:
    model_version: str
    detections: list[Detection]
    inference_time_ms: int