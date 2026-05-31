"""Startet das Inferenz-Skript und erkennt technische Fehler beim Aufruf."""

import os
import subprocess
import sys
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
        darknet_bin_path: str | None = None,
        bash_executable: str | None = None,
    ) -> None:
        """
        Initialisiert den Runner mit Skriptpfad und Timeout.

        Args:
            inference_script_path: Pfad zum Shell-Skript für die Inferenz.
            inference_timeout_seconds: Maximale Laufzeit des Skriptaufrufs in Sekunden.
            darknet_bin_path: Optionaler Pfad zum Darknet-Binary; wird als DARKNET_BIN
                an das Skript weitergegeben und überschreibt die interne Suche.
            bash_executable: Pfad zur bash-Executable (nur Windows). Standard: Git Bash.
        """
        self.inference_script_path = Path(inference_script_path)
        self.inference_timeout_seconds = inference_timeout_seconds
        self.darknet_bin_path = darknet_bin_path
        self.bash_executable = bash_executable or r"C:\Program Files\Git\bin\bash.exe"

    def run(
        self,
        image_path: Path,
        model_dir: Path | None = None,
    ) -> InferenceRunResult:
        """
        Startet das Inferenz-Skript mit dem Bildpfad als Argument.

        Wichtig:
            Diese Methode geht davon aus, dass `inference.sh` den Bildpfad
            als erstes Kommandozeilenargument akzeptiert.

        Args:
            image_path: Pfad zur Bilddatei, die verarbeitet werden soll.
            model_dir: Optionales Modellverzeichnis; wird als MODEL_DIR an das Skript
                weitergegeben und überschreibt dort den Standardpfad.

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

        # On Windows .sh scripts need an explicit bash interpreter.
        # Use the configured Git Bash path to avoid resolving to WSL bash.
        if sys.platform == "win32":
            command = [self.bash_executable, str(self.inference_script_path), str(image_path)]
        else:
            command = [str(self.inference_script_path), str(image_path)]

        env: dict[str, str] | None = None
        if self.darknet_bin_path or model_dir is not None:
            env = os.environ.copy()
        if self.darknet_bin_path:
            env["DARKNET_BIN"] = self.darknet_bin_path
        if model_dir is not None:
            env["MODEL_DIR"] = str(model_dir)

        try:
            completed_process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=self.inference_timeout_seconds,
                check=False,
                env=env,
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
