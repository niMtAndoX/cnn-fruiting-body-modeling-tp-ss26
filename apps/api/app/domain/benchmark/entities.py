from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class BoundingBox:
	"""Achsparallele Bounding Box in Bildkoordinaten."""

	x: float
	y: float
	width: float
	height: float


@dataclass(frozen=True, slots=True)
class BenchmarkObject:
	"""Fachliches Objekt für Ground Truth oder Prediction im Benchmark."""

	label: str
	bounding_box: BoundingBox


@dataclass(frozen=True, slots=True)
class LabelMatchingResult:
	"""Match-Ergebnis für ein einzelnes Label innerhalb eines Bildes."""

	label: str
	true_positives: int
	false_positives: int
	false_negatives: int
	matched_ious: tuple[float, ...] = ()


@dataclass(frozen=True, slots=True)
class ObjectMatchingResult:
	"""Ergebnis des Objekt-Matchings für ein einzelnes Bild."""

	true_positives: int
	false_positives: int
	false_negatives: int
	matched_ious: tuple[float, ...] = ()
	label_results: tuple[LabelMatchingResult, ...] = ()


@dataclass(frozen=True, slots=True)
class LabelBenchmarkMetrics:
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


@dataclass
class BenchmarkInput:
	"""Eingabedaten für einen Benchmark-Lauf."""

	test_archive_bytes: bytes
	test_archive_filename: str
	label_archive_bytes: bytes
	label_archive_filename: str


@dataclass(slots=True)
class ImageLabelData:
	image: Path
	image_data: dict[str, Any]


@dataclass(slots=True)
class BenchmarkImageContainer:
	images: list[ImageLabelData]
	total_images: int


@dataclass
class ImageBenchmarkResult:
	"""Ergebnis der Benchmark-Auswertung für ein einzelnes Bild."""

	image_id: str
	ground_truth_count: int
	predicted_count: int
	true_positives: int
	false_positives: int
	false_negatives: int
	error: str | None = None
	inference_time_ms: int | None = None
	matched_ious: list[float] = field(default_factory=list)
	label_results: list[LabelMatchingResult] = field(default_factory=list)


@dataclass
class BenchmarkResult:
	"""Ergebnis eines Benchmark-Laufs."""

	model_version: str
	precision: float
	recall: float
	f1_score: float
	map_score: float
	total_images: int
	failed_images: int
	processing_time_ms: int
	true_positives: int = 0
	false_positives: int = 0
	false_negatives: int = 0
	accuracy: float = 0.0
	mean_iou: float = 0.0
	average_inference_time_ms: float = 0.0
	label_metrics: list[LabelBenchmarkMetrics] = field(default_factory=list)
	image_results: list[ImageBenchmarkResult] = field(default_factory=list)