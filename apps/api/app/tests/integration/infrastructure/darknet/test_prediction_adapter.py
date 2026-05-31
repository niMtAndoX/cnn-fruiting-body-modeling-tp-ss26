from contextlib import contextmanager
from pathlib import Path

from app.domain.prediction.entities import BoundingBox, Detection, PredictionInput
from app.infrastructure.darknet.models import (
    ParsedBoundingBox,
    ParsedDetection,
    ParsedPredictionOutput,
)
from app.infrastructure.darknet.prediction_adapter import DarknetPredictionAdapter
from app.infrastructure.darknet.runner import InferenceRunResult


class FakeRunner:
    def __init__(self, stdout: str = "fake-stdout") -> None:
        self.stdout = stdout
        self.called_with: Path | None = None
        self.received_model_dir: Path | None = None

    def run(
        self,
        image_path: Path,
        model_dir: Path | None = None,
    ) -> InferenceRunResult:
        self.called_with = image_path
        self.received_model_dir = model_dir
        return InferenceRunResult(
            stdout=self.stdout,
            stderr="",
            returncode=0,
        )


class FakeModelRegistry:
    def __init__(self, model_directory: Path, resolved_version: str = "test-model-v1") -> None:
        self.model_directory = model_directory
        self.resolved_version = resolved_version
        self.received_model_version: str | None = None
        self.received_preferred_default_version: str | None = None

    def resolve_model_directory(
        self,
        model_version: str | None,
        preferred_default_version: str | None = None,
    ) -> tuple[str, Path]:
        self.received_model_version = model_version
        self.received_preferred_default_version = preferred_default_version
        return self.resolved_version, self.model_directory


@contextmanager
def fake_temporary_image_file(*, image_bytes: bytes, suffix: str, temp_dir: str | None):
    yield Path(f"/tmp/test-upload{suffix}")


def test_get_file_suffix_returns_expected_suffixes() -> None:
    assert DarknetPredictionAdapter._get_file_suffix("image/jpeg") == ".jpg"
    assert DarknetPredictionAdapter._get_file_suffix("image/jpg") == ".jpg"
    assert DarknetPredictionAdapter._get_file_suffix("image/png") == ".png"
    assert DarknetPredictionAdapter._get_file_suffix("application/octet-stream") == ".jpg"


def test_to_domain_bounding_box_returns_none_when_missing() -> None:
    assert DarknetPredictionAdapter._to_domain_bounding_box(None) is None


def test_to_domain_bounding_box_maps_values() -> None:
    parsed_bbox = ParsedBoundingBox(
        x=120,
        y=84,
        width=210,
        height=160,
    )

    result = DarknetPredictionAdapter._to_domain_bounding_box(parsed_bbox)

    assert result == BoundingBox(
        x=120,
        y=84,
        width=210,
        height=160,
    )


def test_to_domain_detections_maps_parsed_detections(tmp_path: Path) -> None:
    adapter = DarknetPredictionAdapter(
        runner=FakeRunner(),
        model_registry=FakeModelRegistry(tmp_path),
        default_model_version="test-model-v1",
    )

    parsed_detections = [
        ParsedDetection(
            label="fungus",
            confidence=0.98,
            bounding_box=ParsedBoundingBox(
                x=120,
                y=84,
                width=210,
                height=160,
            ),
        )
    ]

    result = adapter._to_domain_detections(parsed_detections)

    assert result == [
        Detection(
            label="fungus",
            score=0.98,
            bbox=BoundingBox(
                x=120,
                y=84,
                width=210,
                height=160,
            ),
        )
    ]


def test_predict_returns_prediction_result_with_mapped_detections(
    monkeypatch,
    tmp_path: Path,
) -> None:
    runner = FakeRunner(stdout="fungus: 98%")
    model_directory = tmp_path / "darknet-cnn-v1.2"
    model_directory.mkdir()
    expected_image_bytes = b"annotated-image"
    (model_directory / "predictions.jpg").write_bytes(expected_image_bytes)
    model_registry = FakeModelRegistry(
        model_directory=model_directory,
        resolved_version="darknet-cnn-v1.2",
    )
    adapter = DarknetPredictionAdapter(
        runner=runner,
        model_registry=model_registry,
        default_model_version="darknet-cnn-v1",
        temp_dir="/tmp",
    )

    monkeypatch.setattr(
        "app.infrastructure.darknet.prediction_adapter.temporary_image_file",
        fake_temporary_image_file,
    )
    monkeypatch.setattr(
        "app.infrastructure.darknet.prediction_adapter.parse_darknet_output",
        lambda stdout: ParsedPredictionOutput(
            detections=[
                ParsedDetection(
                    label="fungus",
                    confidence=0.98,
                    bounding_box=ParsedBoundingBox(
                        x=120,
                        y=84,
                        width=210,
                        height=160,
                    ),
                )
            ],
            raw_output=stdout,
        ),
    )

    prediction_input = PredictionInput(
        filename="test.jpg",
        content_type="image/jpeg",
        image_bytes=b"fake-image-bytes",
    )

    result = adapter.predict(prediction_input, model_version="darknet-cnn-v1.2")

    assert model_registry.received_model_version == "darknet-cnn-v1.2"
    assert model_registry.received_preferred_default_version == "darknet-cnn-v1"
    assert runner.called_with == Path("/tmp/test-upload.jpg")
    assert runner.received_model_dir == model_directory
    assert result.model_version == "darknet-cnn-v1.2"
    assert result.annotated_image_bytes == expected_image_bytes
    assert result.detections == [
        Detection(
            label="fungus",
            score=0.98,
            bbox=BoundingBox(
                x=120,
                y=84,
                width=210,
                height=160,
            ),
        )
    ]
    assert isinstance(result.inference_time_ms, int)
    assert result.inference_time_ms >= 0


def test_predict_returns_empty_detections_when_parser_returns_no_hits(
    monkeypatch,
    tmp_path: Path,
) -> None:
    runner = FakeRunner(stdout="(no detections)")
    adapter = DarknetPredictionAdapter(
        runner=runner,
        model_registry=FakeModelRegistry(tmp_path),
        default_model_version="test-model-v1",
    )

    monkeypatch.setattr(
        "app.infrastructure.darknet.prediction_adapter.temporary_image_file",
        fake_temporary_image_file,
    )
    monkeypatch.setattr(
        "app.infrastructure.darknet.prediction_adapter.parse_darknet_output",
        lambda stdout: ParsedPredictionOutput(
            detections=[],
            raw_output=stdout,
        ),
    )

    prediction_input = PredictionInput(
        filename="test.png",
        content_type="image/png",
        image_bytes=b"fake-image-bytes",
    )

    result = adapter.predict(prediction_input)

    assert result.model_version == "test-model-v1"
    assert result.detections == []
    assert isinstance(result.inference_time_ms, int)
    assert result.inference_time_ms >= 0
