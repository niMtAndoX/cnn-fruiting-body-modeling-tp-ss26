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
	error: str | None = None


class BenchmarkResponse(BaseModel):
	"""Antwortschema für einen Benchmark-Lauf."""

	request_id: str
	model_version: str
	processing_time_ms: int
	precision: float
	recall: float
	f1_score: float
	map: float = Field(description="Mean Average Precision (mAP) bei IoU=0.5")
	total_images: int
	failed_images: int
	image_results: list[ImageBenchmarkResultSchema]
