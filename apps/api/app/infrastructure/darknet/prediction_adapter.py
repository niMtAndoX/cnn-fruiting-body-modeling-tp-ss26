from time import perf_counter

from app.domain.prediction.entities import (
    BoundingBox,
    Detection,
    PredictionInput,
    PredictionResult,
)
from app.domain.prediction.ports import PredictionPort
from app.infrastructure.darknet.models import ParsedBoundingBox, ParsedDetection
from app.infrastructure.darknet.parser import parse_darknet_output
from app.infrastructure.darknet.runner import DarknetRunner
from app.infrastructure.darknet.tempfiles import temporary_image_file


class DarknetPredictionAdapter(PredictionPort):
    """Technische PredictionPort-Implementierung auf Basis des Darknet-Runners."""

    def __init__(
        self,
        runner: DarknetRunner,
        model_version: str,
        temp_dir: str | None = None,
    ) -> None:
        """
        Initialisiert den Adapter mit Runner und technischer Konfiguration.

        Args:
            runner: Runner für den Aufruf des Inferenz-Skripts.
            model_version: Versionsbezeichnung des verwendeten Modells.
            temp_dir: Optionales Verzeichnis für temporäre Bilddateien.
        """
        self.runner = runner
        self.model_version = model_version
        self.temp_dir = temp_dir

    def predict(self, prediction_input: PredictionInput) -> PredictionResult:
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

        started_at = perf_counter()

        with temporary_image_file(
            image_bytes=prediction_input.image_bytes,
            suffix=suffix,
            temp_dir=self.temp_dir,
        ) as image_path:
            runner_result = self.runner.run(image_path=image_path)

        parsed_output = parse_darknet_output(runner_result.stdout)
        inference_time_ms = int((perf_counter() - started_at) * 1000)

        return PredictionResult(
            model_version=self.model_version,
            detections=self._to_domain_detections(parsed_output.detections),
            inference_time_ms=inference_time_ms,
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