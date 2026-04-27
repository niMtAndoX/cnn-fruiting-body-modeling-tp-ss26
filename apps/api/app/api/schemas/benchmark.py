from typing import Literal

from pydantic import BaseModel, Field


class BenchmarkBoundingBoxResponse(BaseModel):
    x: int
    y: int
    width: int
    height: int


class BenchmarkObjectResponse(BaseModel):
    label: str
    score: float | None = None
    bbox: BenchmarkBoundingBoxResponse | None = None


class BenchmarkMatchResponse(BaseModel):
    prediction_index: int | None = None
    ground_truth_index: int | None = None
    label: str
    iou: float | None = None
    status: Literal["true_positive", "false_positive", "false_negative"]


class BenchmarkImageResultResponse(BaseModel):
    filename: str
    predictions: list[BenchmarkObjectResponse] = Field(default_factory=list)
    ground_truth: list[BenchmarkObjectResponse] = Field(default_factory=list)
    matches: list[BenchmarkMatchResponse] = Field(default_factory=list)
    error: str | None = None


class BenchmarkSummaryResponse(BaseModel):
    total_images: int
    processed_images: int
    failed_images: int


class BenchmarkMetricsResponse(BaseModel):
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


class BenchmarkResponse(BaseModel):
    request_id: str
    model_version: str
    summary: BenchmarkSummaryResponse
    metrics: BenchmarkMetricsResponse
    images: list[BenchmarkImageResultResponse] = Field(default_factory=list)