from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

import app.api.routes.predict as predict_route
from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import PredictionResult
from app.infrastructure.darknet.runner import InferenceScriptExecutionError
from app.main import app


class FakePredictionService:
    def predict(self, prediction_input):
        return PredictionResult(
            model_version="test-model-v1",
            detections=[],
            inference_time_ms=123,
        )


def test_predict_returns_success_response(tmp_path: Path, monkeypatch) -> None:
    test_image = tmp_path / "testimage.jpg"
    test_image.write_bytes(b"fake-image-bytes")

    fake_settings = SimpleNamespace(
        prediction_test_image_path=str(test_image),
    )

    monkeypatch.setattr(predict_route, "get_settings", lambda: fake_settings)

    app.dependency_overrides[get_prediction_service] = lambda: FakePredictionService()

    client = TestClient(app)
    response = client.post("/api/v1/predict")

    assert response.status_code == 200
    assert response.json() == {
        "status": "success",
        "message": "Prediction executed successfully",
        "model_version": "test-model-v1",
        "inference_time_ms": 123,
    }

    app.dependency_overrides.clear()
    
class FailingPredictionService:
    def predict(self, prediction_input):
        raise InferenceScriptExecutionError("script failed")


def test_predict_returns_400_when_test_image_is_missing(monkeypatch) -> None:
    missing_image = Path("/tmp/this-file-does-not-exist.jpg")

    fake_settings = SimpleNamespace(
        prediction_test_image_path=str(missing_image),
    )

    monkeypatch.setattr(predict_route, "get_settings", lambda: fake_settings)

    client = TestClient(app)
    response = client.post("/api/v1/predict")

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": f"Configured test image was not found: {missing_image}",
    }


def test_predict_returns_500_when_prediction_execution_fails(
    tmp_path: Path,
    monkeypatch,
) -> None:
    test_image = tmp_path / "testimage.jpg"
    test_image.write_bytes(b"fake-image-bytes")

    fake_settings = SimpleNamespace(
        prediction_test_image_path=str(test_image),
    )

    monkeypatch.setattr(predict_route, "get_settings", lambda: fake_settings)
    app.dependency_overrides[get_prediction_service] = lambda: FailingPredictionService()

    try:
        client = TestClient(app)
        response = client.post("/api/v1/predict")

        assert response.status_code == 500
        assert response.json() == {
            "error": "internal_error",
            "message": "Prediction execution failed.",
        }
    finally:
        app.dependency_overrides.clear()