from app.domain.prediction.entities import PredictionInput, PredictionResult
from app.domain.prediction.ports import PredictionPort
from app.domain.prediction.service import PredictionService


class FakePredictionPort(PredictionPort):
    def __init__(self, result: PredictionResult) -> None:
        self.result = result
        self.received_input: PredictionInput | None = None

    def predict(self, prediction_input: PredictionInput) -> PredictionResult:
        self.received_input = prediction_input
        return self.result


def test_prediction_service_delegates_to_prediction_port() -> None:
    prediction_input = PredictionInput(
        filename="test.jpg",
        content_type="image/jpeg",
        image_bytes=b"fake-image-bytes",
    )
    expected_result = PredictionResult(
        model_version="fake-model-v1",
        detections=[],
        inference_time_ms=42,
    )
    fake_port = FakePredictionPort(result=expected_result)
    service = PredictionService(prediction_port=fake_port)

    result = service.predict(prediction_input)

    assert fake_port.received_input == prediction_input
    assert result == expected_result