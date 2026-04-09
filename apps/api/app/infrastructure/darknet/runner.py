"""Startet das Inferenz-Skript und erkennt technische Fehler beim Aufruf."""

import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class InferenceRunResult:
    """Rohes Ergebnis eines Inferenz-Skriptaufrufs."""

    stdout: str
    stderr: str
    returncode: int


class InferenceRunnerError(Exception):
    """Basisklasse für technische Fehler beim Start der Inferenz."""


class InferenceScriptNotFoundError(InferenceRunnerError):
    """Das konfigurierte Inferenz-Skript wurde nicht gefunden."""


class InferenceScriptExecutionError(InferenceRunnerError):
    """Das Inferenz-Skript konnte nicht erfolgreich ausgeführt werden."""


class InferenceTimeoutError(InferenceRunnerError):
    """Der Inferenz-Aufruf hat das konfigurierte Zeitlimit überschritten."""


class DarknetRunner:
    """Kapselt den technischen Aufruf des Inferenz-Skripts."""

    def __init__(
        self,
        inference_script_path: str,
        inference_timeout_seconds: int,
    ) -> None:
        """
        Initialisiert den Runner mit Skriptpfad und Timeout.

        Args:
            inference_script_path: Pfad zum Shell-Skript für die Inferenz.
            inference_timeout_seconds: Maximale Laufzeit des Skriptaufrufs in Sekunden.
        """
        self.inference_script_path = Path(inference_script_path)
        self.inference_timeout_seconds = inference_timeout_seconds

    def run(self, image_path: Path) -> InferenceRunResult:
        """
        Startet das Inferenz-Skript mit dem Bildpfad als Argument.

        Wichtig:
            Diese Methode geht davon aus, dass `inference.sh` den Bildpfad
            als erstes Kommandozeilenargument akzeptiert.

        Args:
            image_path: Pfad zur Bilddatei, die verarbeitet werden soll.

        Returns:
            Das rohe Ergebnis des Prozessaufrufs mit stdout, stderr und returncode.

        Raises:
            InferenceScriptNotFoundError: Falls das Skript nicht existiert.
            InferenceTimeoutError: Falls der Prozess das Zeitlimit überschreitet.
            InferenceScriptExecutionError: Falls der Prozess nicht erfolgreich endet
                oder technisch nicht gestartet werden kann.
        """
        if not self.inference_script_path.exists():
            raise InferenceScriptNotFoundError(
                f"Inference script not found: {self.inference_script_path}"
            )

        command = [str(self.inference_script_path), str(image_path)]

        try:
            completed_process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=self.inference_timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise InferenceTimeoutError(
                f"Inference script timed out after {self.inference_timeout_seconds} seconds"
            ) from exc
        except OSError as exc:
            raise InferenceScriptExecutionError(
                f"Failed to start inference script: {self.inference_script_path}"
            ) from exc

        if completed_process.returncode != 0:
            raise InferenceScriptExecutionError(
                "Inference script exited with a non-zero return code. "
                f"returncode={completed_process.returncode}, stderr={completed_process.stderr}"
            )

        return InferenceRunResult(
            stdout=completed_process.stdout,
            stderr=completed_process.stderr,
            returncode=completed_process.returncode,
        )