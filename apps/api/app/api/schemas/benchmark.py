"""API-Schema für Benchmark-Ergebnisse."""

from pydantic import BaseModel, Field


class ImageBenchmarkResultSchema(BaseModel):
	"""Ergebnis der Benchmark-Auswertung für ein einzelnes Bild."""

	image_id: str
	ground_truth_count: int
	predicted_count: int
	true_positives: int
	false_positives: int
	false_negatives: int
	inference_time_ms: int | None = None
	error: str | None = None
	score: float


class LabelBenchmarkMetricsSchema(BaseModel):
	"""Aggregierte Benchmark-Metriken für ein einzelnes Label."""

	label: str
	true_positives: int
	false_positives: int
	false_negatives: int
	precision: float
	recall: float
	f1_score: float
	accuracy: float
	mean_iou: float


class BenchmarkResponse(BaseModel):
	"""Antwortschema für einen Benchmark-Lauf."""

	request_id: str
	model_version: str
	processing_time_ms: int
	average_inference_time_ms: float

	true_positives: int
	false_positives: int
	false_negatives: int

	precision: float
	recall: float
	f1_score: float
	accuracy: float
	mean_iou: float
	map: float = Field(description="Mean Average Precision (mAP) bei IoU=0.5")

	total_images: int
	failed_images: int
	per_label: list[LabelBenchmarkMetricsSchema] = Field(default_factory=list)
	image_results: list[ImageBenchmarkResultSchema]