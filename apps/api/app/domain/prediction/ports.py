from abc import ABC, abstractmethod

from app.domain.prediction.entities import PredictionInput, PredictionResult

"""Abstrakte Schnittstellen zwischen Vorhersage-Logik und technischer Implementierung."""
class PredictionPort(ABC):
    @abstractmethod
    def predict(self, prediction_input: PredictionInput) -> PredictionResult:
        ...