from fastapi.testclient import TestClient

from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import BoundingBox, Detection, PredictionResult
from app.infrastructure.darknet.parser import DarknetOutputParseError
from app.infrastructure.darknet.runner import InferenceScriptExecutionError
from app.main import app


class FakePredictionService:
    def predict(self, prediction_input):
        return PredictionResult(
            model_version="test-model-v1",
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
            inference_time_ms=123,
        )


class EmptyPredictionService:
    def predict(self, prediction_input):
        return PredictionResult(
            model_version="test-model-v1",
            detections=[],
            inference_time_ms=123,
        )


class FailingPredictionService:
    def predict(self, prediction_input):
        raise InferenceScriptExecutionError("script failed")


class ParseFailingPredictionService:
    def predict(self, prediction_input):
        raise DarknetOutputParseError("unreadable darknet output")


def test_predict_returns_prediction_response() -> None:
    app.dependency_overrides[get_prediction_service] = lambda: FakePredictionService()

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")},
        )

        assert response.status_code == 200
        assert response.json() == {
            "model_version": "test-model-v1",
            "detections": [
                {
                    "label": "fungus",
                    "score": 0.95,
                    "bbox": {
                        "x": 140,
                        "y": 25,
                        "width": 297,
                        "height": 281,
                    },
                }
            ],
            "inference_time_ms": 123,
        }
    finally:
        app.dependency_overrides.clear()


def test_predict_returns_empty_detections_when_nothing_is_found() -> None:
    app.dependency_overrides[get_prediction_service] = lambda: EmptyPredictionService()

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")},
        )

        assert response.status_code == 200
        assert response.json() == {
            "model_version": "test-model-v1",
            "detections": [],
            "inference_time_ms": 123,
        }
    finally:
        app.dependency_overrides.clear()


def test_predict_returns_400_for_invalid_content_type() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/predict",
        files={"file": ("test.txt", b"not-an-image", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "Ungültiger Dateityp: text/plain",
    }


def test_predict_returns_500_when_prediction_execution_fails() -> None:
    app.dependency_overrides[get_prediction_service] = lambda: FailingPredictionService()

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")},
        )

        assert response.status_code == 500
        assert response.json() == {
            "error": "internal_error",
            "message": "Die Bilderkennung konnte nicht erfolgreich ausgeführt werden.",
        }
    finally:
        app.dependency_overrides.clear()


def test_predict_returns_500_when_darknet_output_cannot_be_parsed() -> None:
    app.dependency_overrides[get_prediction_service] = (
        lambda: ParseFailingPredictionService()
    )

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/predict",
            files={"file": ("test.jpg", b"fake-image-bytes", "image/jpeg")},
        )

        assert response.status_code == 500
        assert response.json() == {
            "error": "internal_error",
            "message": "Die Bilderkennung konnte nicht erfolgreich ausgeführt werden.",
        }
    finally:
        app.dependency_overrides.clear()