from app.domain.benchmark.entities import BoundingBox


def calculate_iou(first_box: BoundingBox, second_box: BoundingBox) -> float:
	"""Berechnet die Intersection over Union zweier Bounding Boxes.

	Die IoU beschreibt das Verhältnis der gemeinsamen Fläche zweier Boxen
	zur gesamten von beiden Boxen abgedeckten Fläche.

	Rückgabewert:
		- 0.0 bei keiner Überschneidung
		- 1.0 bei identischen Boxen
		- Wert zwischen 0.0 und 1.0 bei teilweiser Überschneidung
	"""
	if (
		first_box.width <= 0
		or first_box.height <= 0
		or second_box.width <= 0
		or second_box.height <= 0
	):
		return 0.0

	intersection_left = max(first_box.x, second_box.x)
	intersection_top = max(first_box.y, second_box.y)
	intersection_right = min(
		first_box.x + first_box.width,
		second_box.x + second_box.width,
	)
	intersection_bottom = min(
		first_box.y + first_box.height,
		second_box.y + second_box.height,
	)

	intersection_width = max(0.0, intersection_right - intersection_left)
	intersection_height = max(0.0, intersection_bottom - intersection_top)
	intersection_area = intersection_width * intersection_height

	if intersection_area == 0.0:
		return 0.0

	first_box_area = first_box.width * first_box.height
	second_box_area = second_box.width * second_box.height
	union_area = first_box_area + second_box_area - intersection_area

	if union_area <= 0.0:
		return 0.0

	iou = intersection_area / union_area

	return max(0.0, min(1.0, iou))