from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.dependencies import (
    get_darknet_model_registry,
    get_settings_dependency,
)
from app.infrastructure.darknet.model_registry import DarknetModelRegistry
from app.main import app


def create_model_directory(root_dir: Path, version: str) -> None:
    model_directory = root_dir / version
    model_directory.mkdir(parents=True)
    (model_directory / "Bilderkennung-Pilzwachstum.data").write_text("names=Bilderkennung-Pilzwachstum.names\n")
    (model_directory / "Bilderkennung-Pilzwachstum.cfg").write_text("cfg")
    (model_directory / "Bilderkennung-Pilzwachstum_best.weights").write_bytes(b"weights")


def test_models_route_returns_available_models(tmp_path: Path) -> None:
    create_model_directory(tmp_path, "darknet-cnn-v1")
    create_model_directory(tmp_path, "darknet-cnn-v1.2")

    settings = Settings(
        _env_file=None,
        model_root_dir=str(tmp_path),
        model_version="darknet-cnn-v1",
    )

    app.dependency_overrides[get_settings_dependency] = lambda: settings
    app.dependency_overrides[get_darknet_model_registry] = (
        lambda: DarknetModelRegistry(model_root_dir=str(tmp_path))
    )

    try:
        client = TestClient(app)
        response = client.get("/api/v1/models")

        assert response.status_code == 200
        assert response.json() == {
            "available_models": ["darknet-cnn-v1", "darknet-cnn-v1.2"],
            "default_model_version": "darknet-cnn-v1",
        }
    finally:
        app.dependency_overrides.clear()
