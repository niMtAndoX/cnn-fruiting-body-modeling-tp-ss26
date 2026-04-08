import pytest

from app.infrastructure.darknet.models import (
    ParsedBoundingBox,
    ParsedDetection,
    ParsedPredictionOutput,
)
from app.infrastructure.darknet.parser import (
    DarknetOutputParseError,
    parse_darknet_output,
)


def test_parse_darknet_output_returns_empty_result_for_blank_stdout() -> None:
    result = parse_darknet_output("   \n\t  ")

    assert result == ParsedPredictionOutput(
        detections=[],
        raw_output="",
    )


def test_parse_darknet_output_normalizes_raw_output_for_no_hit_output() -> None:
    stdout = "\n\npredictions:\n(no detections)\n\n"

    result = parse_darknet_output(stdout)

    assert result == ParsedPredictionOutput(
        detections=[],
        raw_output="predictions:\n(no detections)",
    )


def test_parse_darknet_output_parses_detection_with_bounding_box() -> None:
    stdout = """
    fungus: 98%
    left_x: 120
    top_y: 84
    width: 210
    height: 160
    """

    result = parse_darknet_output(stdout)

    assert result == ParsedPredictionOutput(
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
        raw_output=(
            "fungus: 98%\n"
            "left_x: 120\n"
            "top_y: 84\n"
            "width: 210\n"
            "height: 160"
        ),
    )


def test_parse_darknet_output_raises_for_unreadable_detection_output() -> None:
    stdout = """
    fungus: not-a-percent
    left_x: abc
    top_y: 84
    width: 210
    height: 160
    """

    with pytest.raises(DarknetOutputParseError):
        parse_darknet_output(stdout)