import re
import textwrap

from app.infrastructure.darknet.models import (
    ParsedBoundingBox,
    ParsedDetection,
    ParsedPredictionOutput,
)

_DETECTION_LINE_RE = re.compile(
    r"^(?P<label>[^:]+?)\s*:\s*(?P<confidence>\d+(?:[.,]\d+)?)\s*%$"
)

_BBOX_FIELD_MAPPING = {
    "left_x": "x",
    "top_y": "y",
    "width": "width",
    "height": "height",
}


class DarknetOutputParseError(ValueError):
    """Die Darknet-Skriptausgabe konnte nicht in strukturierte Daten übersetzt werden."""


def parse_darknet_output(stdout: str) -> ParsedPredictionOutput:
    """
    Parst die rohe stdout-Ausgabe des Darknet-Skripts in ein technisches,
    weiterverarbeitbares Ergebnis.

    Regeln im aktuellen Schritt:
    - Leere Ausgabe -> leeres Ergebnis
    - Bekannte "kein Treffer"-Hinweise -> leeres Ergebnis
    - Detection-Zeilen wie "<label>: 98%" werden erkannt
    - Bounding-Box-Zeilen werden optional direkt danach gelesen
    - Unlesbare Detection-/BBox-Blöcke führen zu DarknetOutputParseError
    """
    normalized_output = _normalize_output(stdout)

    if not normalized_output:
        return ParsedPredictionOutput(
            detections=[],
            raw_output="",
        )

    lines = [line.strip() for line in normalized_output.splitlines() if line.strip()]
    detections: list[ParsedDetection] = []

    index = 0
    while index < len(lines):
        line = lines[index]

        if _is_ignorable_line(line):
            index += 1
            continue

        detection_match = _DETECTION_LINE_RE.match(line)
        if detection_match:
            detection, consumed_lines = _parse_detection_block(
                lines=lines,
                start_index=index,
                detection_match=detection_match,
            )
            detections.append(detection)
            index += consumed_lines
            continue

        if _looks_like_broken_detection_block(lines, index):
            raise DarknetOutputParseError(
                f"Unlesbarer Detection-Block ab Zeile: {line!r}"
            )

        if _is_bbox_line(line):
            raise DarknetOutputParseError(
                f"Bounding-Box-Zeile ohne gültige Detection: {line!r}"
            )

        index += 1

    return ParsedPredictionOutput(
        detections=detections,
        raw_output=normalized_output,
    )


def _normalize_output(stdout: str) -> str:
    return textwrap.dedent(stdout).strip()


def _is_ignorable_line(line: str) -> bool:
    normalized = line.strip().lower()
    return normalized in {
        "predictions:",
        "(no detections)",
        "no detections",
    }


def _looks_like_broken_detection_block(lines: list[str], index: int) -> bool:
    line = lines[index]

    if ":" not in line or _is_bbox_line(line):
        return False

    next_index = index + 1
    if next_index < len(lines) and _is_bbox_line(lines[next_index]):
        return True

    return False


def _is_bbox_line(line: str) -> bool:
    normalized = line.strip().lower()
    return any(normalized.startswith(f"{field}:") for field in _BBOX_FIELD_MAPPING)


def _parse_detection_block(
    *,
    lines: list[str],
    start_index: int,
    detection_match: re.Match[str],
) -> tuple[ParsedDetection, int]:
    label = detection_match.group("label").strip()
    confidence = _parse_confidence(detection_match.group("confidence"))

    bbox_values: dict[str, float] = {}
    index = start_index + 1

    while index < len(lines) and _is_bbox_line(lines[index]):
        raw_field, raw_value = _split_key_value(lines[index])
        bbox_field = _BBOX_FIELD_MAPPING.get(raw_field.lower())

        if bbox_field is None:
            raise DarknetOutputParseError(
                f"Unbekanntes Bounding-Box-Feld: {raw_field!r}"
            )

        if bbox_field in bbox_values:
            raise DarknetOutputParseError(
                f"Doppeltes Bounding-Box-Feld: {raw_field!r}"
            )

        bbox_values[bbox_field] = _parse_float(raw_value, context=raw_field)
        index += 1

    bounding_box = _build_bounding_box_if_present(bbox_values)

    detection = ParsedDetection(
        label=label,
        confidence=confidence,
        bounding_box=bounding_box,
    )

    consumed_lines = index - start_index
    return detection, consumed_lines


def _build_bounding_box_if_present(
    bbox_values: dict[str, float],
) -> ParsedBoundingBox | None:
    if not bbox_values:
        return None

    required_fields = {"x", "y", "width", "height"}
    missing_fields = required_fields - bbox_values.keys()
    if missing_fields:
        missing_fields_text = ", ".join(sorted(missing_fields))
        raise DarknetOutputParseError(
            f"Bounding-Box unvollständig, fehlende Felder: {missing_fields_text}"
        )

    return ParsedBoundingBox(
        x=bbox_values["x"],
        y=bbox_values["y"],
        width=bbox_values["width"],
        height=bbox_values["height"],
    )


def _parse_confidence(raw_value: str) -> float:
    confidence_percent = _parse_float(raw_value, context="confidence")

    if confidence_percent < 0 or confidence_percent > 100:
        raise DarknetOutputParseError(
            f"Confidence außerhalb des gültigen Bereichs: {raw_value!r}"
        )

    return confidence_percent / 100.0


def _parse_float(raw_value: str, *, context: str) -> float:
    normalized = raw_value.strip().replace(",", ".")

    try:
        return float(normalized)
    except ValueError as exc:
        raise DarknetOutputParseError(
            f"Wert für {context!r} ist keine Zahl: {raw_value!r}"
        ) from exc


def _split_key_value(line: str) -> tuple[str, str]:
    if ":" not in line:
        raise DarknetOutputParseError(
            f"Zeile enthält kein erwartetes Schlüssel/Wert-Format: {line!r}"
        )

    key, value = line.split(":", 1)
    return key.strip(), value.strip()