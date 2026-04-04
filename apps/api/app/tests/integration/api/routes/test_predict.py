from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

import app.api.routes.predict as predict_route
from app.core.dependencies import get_prediction_service
from app.domain.prediction.entities import PredictionResult
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