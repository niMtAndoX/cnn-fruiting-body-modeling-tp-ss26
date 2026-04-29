"""Domain-Entities für Benchmark-Ergebnisse."""

from dataclasses import dataclass, field
from typing import Literal


BenchmarkMatchStatus = Literal[
    "true_positive",
    "false_positive",
    "false_negative",
]


@dataclass(slots=True)
class BenchmarkBoundingBox:
    x: int
    y: int
    width: int
    height: int


@dataclass(slots=True)
class BenchmarkObject:
    label: str
    score: float | None = None
    bbox: BenchmarkBoundingBox | None = None


@dataclass(slots=True)
class BenchmarkMatch:
    status: BenchmarkMatchStatus
    label: str
    prediction_index: int | None = None
    ground_truth_index: int | None = None
    iou: float | None = None


@dataclass(slots=True)
class BenchmarkImageResult:
    filename: str
    predictions: list[BenchmarkObject] = field(default_factory=list)
    ground_truth: list[BenchmarkObject] = field(default_factory=list)
    matches: list[BenchmarkMatch] = field(default_factory=list)
    error: str | None = None


@dataclass(slots=True)
class BenchmarkSummary:
    total_images: int
    processed_images: int
    failed_images: int


@dataclass(slots=True)
class BenchmarkMetrics:
    true_positives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    accuracy: float
    mean_iou: float
    average_inference_time_ms: float | None = None
    total_processing_time_ms: float | None = None


@dataclass(slots=True)
class BenchmarkResult:
    request_id: str
    model_version: str
    summary: BenchmarkSummary
    metrics: BenchmarkMetrics
    images: list[BenchmarkImageResult] = field(default_factory=list)