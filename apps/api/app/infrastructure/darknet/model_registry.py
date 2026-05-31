"""Ermittelt verfügbare Darknet-Modelle aus dem Modellverzeichnis."""

import re
from dataclasses import dataclass
from pathlib import Path

MODEL_DIRECTORY_PATTERN = "darknet-cnn-v*"
REQUIRED_MODEL_FILES = (
    "Bilderkennung-Pilzwachstum.data",
    "Bilderkennung-Pilzwachstum.cfg",
    "Bilderkennung-Pilzwachstum_best.weights",
)


class ModelRegistryError(Exception):
    """Basisklasse für Fehler beim Zugriff auf Modellverzeichnisse."""


class NoModelsAvailableError(ModelRegistryError):
    """Es wurde kein lauffähiges Modell im Modellverzeichnis gefunden."""


class ModelVersionNotFoundError(ModelRegistryError):
    """Die angeforderte Modellversion ist nicht verfügbar."""


@dataclass(frozen=True, slots=True)
class AvailableModel:
    """Beschreibt ein verwendbares Modellverzeichnis."""

    version: str
    directory: Path


class DarknetModelRegistry:
    """Liest verfügbare Modelle aus dem Darknet-Modellwurzelverzeichnis."""

    def __init__(self, model_root_dir: str) -> None:
        self.model_root_dir = Path(model_root_dir)

    def list_models(self) -> list[AvailableModel]:
        if not self.model_root_dir.exists():
            return []

        models = [
            AvailableModel(version=candidate.name, directory=candidate)
            for candidate in self.model_root_dir.glob(MODEL_DIRECTORY_PATTERN)
            if candidate.is_dir() and self._is_valid_model_directory(candidate)
        ]

        return sorted(models, key=lambda model: _model_sort_key(model.version))

    def list_model_versions(self) -> list[str]:
        return [model.version for model in self.list_models()]

    def get_default_model_version(self, preferred_version: str | None = None) -> str:
        models = self.list_models()
        if not models:
            raise NoModelsAvailableError(self._no_models_message())

        if preferred_version and any(model.version == preferred_version for model in models):
            return preferred_version

        return models[-1].version

    def resolve_model_directory(
        self,
        model_version: str | None,
        preferred_default_version: str | None = None,
    ) -> tuple[str, Path]:
        models = {model.version: model.directory for model in self.list_models()}
        if not models:
            raise NoModelsAvailableError(self._no_models_message())

        if model_version is None:
            resolved_version = self.get_default_model_version(preferred_default_version)
            return resolved_version, models[resolved_version]

        try:
            return model_version, models[model_version]
        except KeyError as exc:
            available_versions = ", ".join(sorted(models))
            raise ModelVersionNotFoundError(
                f"Das Modell '{model_version}' ist nicht verfügbar. "
                f"Verfügbare Modelle: {available_versions}"
            ) from exc

    @staticmethod
    def _is_valid_model_directory(model_directory: Path) -> bool:
        return all((model_directory / required_file).is_file() for required_file in REQUIRED_MODEL_FILES)

    def _no_models_message(self) -> str:
        return (
            "Es ist kein lauffähiges Modell verfügbar. "
            f"Erwartet werden Unterordner nach dem Schema '{MODEL_DIRECTORY_PATTERN}' "
            f"unter '{self.model_root_dir}'."
        )


def _model_sort_key(version: str) -> tuple[object, ...]:
    parts = re.findall(r"\d+|\D+", version)
    return tuple(int(part) if part.isdigit() else part for part in parts)
