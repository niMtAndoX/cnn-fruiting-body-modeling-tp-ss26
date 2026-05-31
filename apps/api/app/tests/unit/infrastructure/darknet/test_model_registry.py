from pathlib import Path

import pytest

from app.infrastructure.darknet.model_registry import (
    DarknetModelRegistry,
    ModelVersionNotFoundError,
    NoModelsAvailableError,
)


def create_model_directory(root_dir: Path, version: str) -> Path:
    model_directory = root_dir / version
    model_directory.mkdir(parents=True)
    (model_directory / "Bilderkennung-Pilzwachstum.data").write_text("names=Bilderkennung-Pilzwachstum.names\n")
    (model_directory / "Bilderkennung-Pilzwachstum.cfg").write_text("cfg")
    (model_directory / "Bilderkennung-Pilzwachstum_best.weights").write_bytes(b"weights")
    return model_directory


def test_list_model_versions_returns_sorted_versions(tmp_path: Path) -> None:
    create_model_directory(tmp_path, "darknet-cnn-v1.2")
    create_model_directory(tmp_path, "darknet-cnn-v1")
    create_model_directory(tmp_path, "darknet-cnn-v1.10")

    registry = DarknetModelRegistry(model_root_dir=str(tmp_path))

    assert registry.list_model_versions() == [
        "darknet-cnn-v1",
        "darknet-cnn-v1.2",
        "darknet-cnn-v1.10",
    ]


def test_get_default_model_version_uses_preferred_version_when_available(
    tmp_path: Path,
) -> None:
    create_model_directory(tmp_path, "darknet-cnn-v1")
    create_model_directory(tmp_path, "darknet-cnn-v1.2")

    registry = DarknetModelRegistry(model_root_dir=str(tmp_path))

    assert registry.get_default_model_version("darknet-cnn-v1") == "darknet-cnn-v1"
    assert registry.get_default_model_version("missing-version") == "darknet-cnn-v1.2"


def test_resolve_model_directory_raises_for_unknown_model_version(tmp_path: Path) -> None:
    create_model_directory(tmp_path, "darknet-cnn-v1")
    registry = DarknetModelRegistry(model_root_dir=str(tmp_path))

    with pytest.raises(ModelVersionNotFoundError):
        registry.resolve_model_directory("darknet-cnn-v9")


def test_get_default_model_version_raises_when_no_models_are_available(tmp_path: Path) -> None:
    registry = DarknetModelRegistry(model_root_dir=str(tmp_path))

    with pytest.raises(NoModelsAvailableError):
        registry.get_default_model_version()
