from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class ParsedBoundingBox:
    x: float
    y: float
    width: float
    height: float


@dataclass(frozen=True, slots=True)
class ParsedDetection:
    label: str
    confidence: float
    bounding_box: ParsedBoundingBox | None = None


@dataclass(frozen=True, slots=True)
class ParsedPredictionOutput:
    detections: list[ParsedDetection] = field(default_factory=list)
    raw_output: str = ""