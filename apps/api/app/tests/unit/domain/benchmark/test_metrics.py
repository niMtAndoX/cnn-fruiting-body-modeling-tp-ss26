import pytest

from app.domain.benchmark.entities import BoundingBox
from app.domain.benchmark.metrics import calculate_iou


def test_calculate_iou_returns_one_for_identical_boxes() -> None:
	first_box = BoundingBox(x=10, y=20, width=30, height=40)
	second_box = BoundingBox(x=10, y=20, width=30, height=40)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(1.0)


def test_calculate_iou_returns_zero_for_non_overlapping_boxes() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=20, y=20, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)


def test_calculate_iou_returns_expected_value_for_partially_overlapping_boxes() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=5, y=5, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(25 / 175)


def test_calculate_iou_returns_expected_value_when_one_box_is_contained_in_another() -> None:
	outer_box = BoundingBox(x=0, y=0, width=10, height=10)
	inner_box = BoundingBox(x=2, y=2, width=4, height=4)

	result = calculate_iou(outer_box, inner_box)

	assert result == pytest.approx(16 / 100)


def test_calculate_iou_returns_zero_when_boxes_only_touch_at_edge() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=10, y=0, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)


def test_calculate_iou_is_symmetric() -> None:
	first_box = BoundingBox(x=0, y=0, width=10, height=10)
	second_box = BoundingBox(x=5, y=5, width=10, height=10)

	forward_result = calculate_iou(first_box, second_box)
	reverse_result = calculate_iou(second_box, first_box)

	assert forward_result == pytest.approx(reverse_result)


def test_calculate_iou_returns_zero_for_box_with_zero_area() -> None:
	first_box = BoundingBox(x=0, y=0, width=0, height=10)
	second_box = BoundingBox(x=0, y=0, width=10, height=10)

	result = calculate_iou(first_box, second_box)

	assert result == pytest.approx(0.0)