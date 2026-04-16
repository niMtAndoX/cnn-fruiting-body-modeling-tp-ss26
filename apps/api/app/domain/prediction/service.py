from app.domain.prediction.entities import (
    BoundingBox,
    Detection,
    PredictionInput,
    PredictionResult,
)
from app.domain.prediction.ports import PredictionPort

"""Fachlicher Einstiegspunkt für den Ablauf der Bildvorhersage."""


class PredictionService:
    def __init__(self, prediction_port: PredictionPort) -> None:
        self.prediction_port = prediction_port

    def predict(self, prediction_input: PredictionInput) -> PredictionResult:
        return PredictionResult(
            model_version="darknet-cnn-v1",
            detections=[
                Detection(
                    label="fungus",
                    score=0.95,
                    bbox=BoundingBox(
                        x=140,
                        y=25,
                        width=297,
                        height=281,
                    ),
                )
            ],
            inference_time_ms=120,
        )