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

    def run(self, image_path: Path) -> InferenceRunResult:
        self.called_with = image_path
        return InferenceRunResult(
            stdout=self.stdout,
            stderr="",
            returncode=0,
        )


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


def test_to_domain_detections_maps_parsed_detections() -> None:
    adapter = DarknetPredictionAdapter(
        runner=FakeRunner(),
        model_version="test-model-v1",
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


def test_predict_returns_prediction_result_with_mapped_detections(monkeypatch) -> None:
    runner = FakeRunner(stdout="fungus: 98%")
    adapter = DarknetPredictionAdapter(
        runner=runner,
        model_version="test-model-v1",
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

    result = adapter.predict(prediction_input)

    assert runner.called_with == Path("/tmp/test-upload.jpg")
    assert result.model_version == "test-model-v1"
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


def test_predict_returns_empty_detections_when_parser_returns_no_hits(monkeypatch) -> None:
    runner = FakeRunner(stdout="(no detections)")
    adapter = DarknetPredictionAdapter(
        runner=runner,
        model_version="test-model-v1",
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