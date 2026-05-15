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
class ObjectMatchingResult:
	"""Ergebnis des Objekt-Matchings für ein einzelnes Bild."""

	true_positives: int
	false_positives: int
	false_negatives: int


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
	image_results: list[ImageBenchmarkResult] = field(default_factory=list)