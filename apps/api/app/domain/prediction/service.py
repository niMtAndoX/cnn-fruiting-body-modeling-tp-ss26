from app.domain.prediction.entities import PredictionInput, PredictionResult
from app.domain.prediction.ports import PredictionPort

"""Fachlicher Einstiegspunkt für den Ablauf der Bildvorhersage."""

class PredictionService:

    def __init__(self, prediction_port: PredictionPort) -> None:
        self.prediction_port = prediction_port

    def predict(
        self,
        prediction_input: PredictionInput,
        model_version: str | None = None,
    ) -> PredictionResult:
        return self.prediction_port.predict(
            prediction_input,
            model_version=model_version,
        )
