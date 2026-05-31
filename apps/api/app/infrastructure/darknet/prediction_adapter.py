from pathlib import Path
from time import perf_counter

from app.domain.prediction.entities import (
    BoundingBox,
    Detection,
    PredictionInput,
    PredictionResult,
)
from app.domain.prediction.ports import PredictionPort
from app.infrastructure.darknet.model_registry import DarknetModelRegistry
from app.infrastructure.darknet.models import ParsedBoundingBox, ParsedDetection
from app.infrastructure.darknet.parser import parse_darknet_output
from app.infrastructure.darknet.runner import DarknetRunner
from app.infrastructure.darknet.tempfiles import temporary_image_file


class DarknetPredictionAdapter(PredictionPort):
    """Technische PredictionPort-Implementierung auf Basis des Darknet-Runners."""

    def __init__(
        self,
        runner: DarknetRunner,
        model_registry: DarknetModelRegistry,
        default_model_version: str,
        temp_dir: str | None = None,
    ) -> None:
        """
        Initialisiert den Adapter mit Runner und technischer Konfiguration.

        Args:
            runner: Runner für den Aufruf des Inferenz-Skripts.
            model_registry: Registry zum Auflösen verfügbarer Modellverzeichnisse.
            default_model_version: Bevorzugte Modellversion für Requests ohne Auswahl.
            temp_dir: Optionales Verzeichnis für temporäre Bilddateien.
        """
        self.runner = runner
        self.model_registry = model_registry
        self.default_model_version = default_model_version
        self.temp_dir = temp_dir

    def predict(
        self,
        prediction_input: PredictionInput,
        model_version: str | None = None,
    ) -> PredictionResult:
        """
        Führt eine Vorhersage für die übergebenen Bilddaten aus.

        Die Bilddaten werden zunächst temporär als Datei abgelegt, damit der
        Darknet-Runner sie an das Inferenz-Skript übergeben kann.

        Args:
            prediction_input: Interne Eingabedaten für die Vorhersage.

        Returns:
            Ein strukturiertes PredictionResult.
        """
        suffix = self._get_file_suffix(prediction_input.content_type)
        resolved_model_version, model_directory = self.model_registry.resolve_model_directory(
            model_version=model_version,
            preferred_default_version=self.default_model_version,
        )

        started_at = perf_counter()

        with temporary_image_file(
            image_bytes=prediction_input.image_bytes,
            suffix=suffix,
            temp_dir=self.temp_dir,
        ) as image_path:
            runner_result = self.runner.run(
                image_path=image_path,
                model_dir=model_directory,
            )

        parsed_output = parse_darknet_output(runner_result.stdout)
        inference_time_ms = int((perf_counter() - started_at) * 1000)

        return PredictionResult(
            model_version=resolved_model_version,
            detections=self._to_domain_detections(parsed_output.detections),
            inference_time_ms=inference_time_ms,
            annotated_image_bytes=self._read_annotated_image_bytes(model_directory),
        )

    @staticmethod
    def _get_file_suffix(content_type: str) -> str:
        """
        Leitet aus dem MIME-Type eine passende Dateiendung ab.

        Args:
            content_type: MIME-Type des Bildes, z. B. 'image/jpeg'.

        Returns:
            Eine passende Dateiendung für die temporäre Datei.
        """
        mapping = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
        }
        return mapping.get(content_type, ".jpg")

    @staticmethod
    def _read_annotated_image_bytes(model_directory: Path) -> bytes | None:
        output_path = model_directory / "predictions.jpg"
        if not output_path.is_file():
            return None

        try:
            return output_path.read_bytes()
        except OSError:
            return None

    def _to_domain_detections(
        self,
        parsed_detections: list[ParsedDetection],
    ) -> list[Detection]:
        return [
            self._to_domain_detection(parsed_detection)
            for parsed_detection in parsed_detections
        ]

    def _to_domain_detection(self, parsed_detection: ParsedDetection) -> Detection:
        return Detection(
            label=parsed_detection.label,
            score=parsed_detection.confidence,
            bbox=self._to_domain_bounding_box(parsed_detection.bounding_box),
        )

    @staticmethod
    def _to_domain_bounding_box(
        parsed_bounding_box: ParsedBoundingBox | None,
    ) -> BoundingBox | None:
        if parsed_bounding_box is None:
            return None

        return BoundingBox(
            x=parsed_bounding_box.x,
            y=parsed_bounding_box.y,
            width=parsed_bounding_box.width,
            height=parsed_bounding_box.height,
        )
