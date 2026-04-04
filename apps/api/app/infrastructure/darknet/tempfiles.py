"""Hilfsfunktionen für temporäre Bilddateien beim Inferenz-Aufruf."""

import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def temporary_image_file(
    image_bytes: bytes,
    suffix: str = ".jpg",
    temp_dir: str | None = None,
) -> Iterator[Path]:
    """
    Schreibt Bilddaten in eine temporäre Datei und liefert deren Pfad zurück.

    Die Datei wird nach der Nutzung automatisch wieder gelöscht.

    Args:
        image_bytes: Die Bilddaten als Bytes.
        suffix: Dateiendung der temporären Datei, z. B. ".jpg" oder ".png".
        temp_dir: Optionales Verzeichnis für die temporäre Datei.

    Yields:
        Der Pfad zur temporären Bilddatei.

    Raises:
        OSError: Falls die Datei nicht erstellt oder gelöscht werden kann.
    """
    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
            dir=temp_dir,
        ) as temp_file:
            temp_file.write(image_bytes)
            temp_path = Path(temp_file.name)

        yield temp_path

    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()