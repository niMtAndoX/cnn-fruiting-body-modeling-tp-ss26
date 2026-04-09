import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

API_ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = API_ROOT_DIR / ".env"


def default_inference_script_path() -> str:
    try:
        return str(API_ROOT_DIR.parents[1] / "scripts" / "inference.sh")
    except IndexError:
        return str(API_ROOT_DIR / "scripts" / "inference.sh")


class Settings(BaseSettings):
	# Anzeigename der Anwendung
	app_name: str = "waldpilz-api"

	# Aktuelle Laufzeitumgebung: dev, test oder prod
	app_env: Literal["dev", "test", "prod"] = "dev"

	# Aktiviert oder deaktiviert Debug-Verhalten
	debug: bool = True

	# Host, auf dem die API lauscht
	api_host: str = "127.0.0.1"

	# Port, auf dem die API erreichbar ist
	api_port: int = 8000

	# Gemeinsamer Prefix für alle API-Endpunkte
	api_prefix: str = "/api/v1"

	# Log-Level für die Anwendung
	log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

	# Liste erlaubter Frontend-Origins für CORS
	cors_allow_origins: Annotated[list[str], NoDecode] = [
		"http://localhost:3000",
		"http://127.0.0.1:3000",
	]

	# Maximale Upload-Größe in Megabyte
	max_upload_size_mb: int = 20

	# Erlaubte MIME-Types für Uploads
	allowed_upload_content_types: Annotated[list[str], NoDecode] = [
		"image/jpeg",
		"image/png",
	]

	# Versionsbezeichnung des aktuell verwendeten Modells
	model_version: str = "darknet-cnn-v1"
 
	# Pfad zum Shell-Skript, das die Inferenz startet
	inference_script_path: str = default_inference_script_path()

	# Maximales Zeitlimit für den Aufruf des Inferenz-Skripts in Sekunden
	inference_timeout_seconds: int = 30

	# Optionales Verzeichnis für temporär abgelegte Bilddateien
	inference_temp_dir: str | None = None
 
	# Konfiguration für das Laden der Settings aus der Umgebung
	model_config = SettingsConfigDict(
		env_file=ENV_FILE,
		env_file_encoding="utf-8",
		case_sensitive=False,
		extra="ignore",
	)

	@field_validator("debug", mode="before")
	@classmethod
	def parse_debug(cls, value: Any) -> bool:
		"""
		Parst verschiedene Debug-Notation in einen booleschen Wert.

		Unterstützt klassische Bool-Strings wie "true"/"false" sowie
		betriebsnahe Bezeichner wie "release" oder "production".
		"""
		if isinstance(value, bool):
			return value

		if isinstance(value, int):
			return bool(value)

		if isinstance(value, str):
			normalized = value.strip().lower()
			truthy_values = {"1", "true", "yes", "on", "debug", "development", "dev"}
			falsy_values = {"0", "false", "no", "off", "release", "prod", "production"}

			if normalized in truthy_values:
				return True
			if normalized in falsy_values:
				return False

		raise ValueError(
			"debug must be a boolean-like value such as true/false or debug/release"
		)

	@field_validator("api_prefix")
	@classmethod
	def validate_api_prefix(cls, value: str) -> str:
		"""
		Validiert und normalisiert den API-Prefix.

		Die Methode stellt sicher, dass der Prefix mit "/" beginnt.
		Außerdem entfernt sie ein abschließendes "/", damit z. B.
		"/api/v1/" zu "/api/v1" wird.

		Args:
			cls: Klassenreferenz der Settings-Klasse.
			value: Der zu validierende API-Prefix als String.

		Returns:
			Der validierte und normalisierte API-Prefix als String.

		Raises:
			ValueError: Falls der Prefix nicht mit "/" beginnt.
		"""
		if not value.startswith("/"):
			raise ValueError("api_prefix must start with '/'")
		return value.rstrip("/") or "/"

	@field_validator("max_upload_size_mb")
	@classmethod
	def validate_max_upload_size_mb(cls, value: int) -> int:
		"""
		Validiert die maximale Upload-Größe in Megabyte.

		Die Methode stellt sicher, dass nur positive Werte erlaubt sind.

		Args:
			cls: Klassenreferenz der Settings-Klasse.
			value: Die maximale Upload-Größe in Megabyte.

		Returns:
			Die validierte Upload-Größe in Megabyte.

		Raises:
			ValueError: Falls der Wert kleiner oder gleich 0 ist.
		"""
		if value <= 0:
			raise ValueError("max_upload_size_mb must be greater than 0")
		return value

	@field_validator("inference_timeout_seconds")
	@classmethod
	def validate_inference_timeout_seconds(cls, value: int) -> int:
		"""
		Validiert das Zeitlimit für den Inferenz-Aufruf in Sekunden.

		Die Methode stellt sicher, dass nur positive Werte erlaubt sind.

		Args:
			cls: Klassenreferenz der Settings-Klasse.
			value: Das konfigurierte Zeitlimit für den Inferenz-Aufruf in Sekunden.

		Returns:
			Das validierte Zeitlimit in Sekunden.

		Raises:
			ValueError: Falls der Wert kleiner oder gleich 0 ist.
		"""
		if value <= 0:
			raise ValueError("inference_timeout_seconds must be greater than 0")
		return value


	@field_validator("cors_allow_origins", mode="before")
	@classmethod
	def parse_cors_allow_origins(cls, value: str | list[str]) -> list[str]:
		"""
		Parst die erlaubten CORS-Origins in eine Liste.

		Die Methode akzeptiert entweder bereits eine Liste von Strings
		oder einen einzelnen String-Wert aus der Konfiguration.

		Args:
			cls: Klassenreferenz der Settings-Klasse.
			value: Die CORS-Origins entweder als Liste von Strings
				oder als einzelner String.

		Returns:
			Eine Liste erlaubter CORS-Origins.

		Raises:
			ValueError: Falls der Wert weder String noch Liste ist.
		"""
		if isinstance(value, list):
			return value
		if isinstance(value, str):
			return cls._parse_list_setting(value)
		raise ValueError("cors_allow_origins must be a comma-separated string or a list")

	@field_validator("allowed_upload_content_types", mode="before")
	@classmethod
	def parse_allowed_upload_content_types(cls, value: str | list[str]) -> list[str]:
		"""
		Parst die erlaubten Upload-Content-Types in eine Liste.

		Die Methode akzeptiert entweder bereits eine Liste von Strings
		oder einen einzelnen String-Wert aus der Konfiguration.

		Args:
			cls: Klassenreferenz der Settings-Klasse.
			value: Die erlaubten Content-Types entweder als Liste von Strings
				oder als einzelner String.

		Returns:
			Eine Liste erlaubter Upload-Content-Types.

		Raises:
			ValueError: Falls der Wert weder String noch Liste ist.
		"""
		if isinstance(value, list):
			return value
		if isinstance(value, str):
			return cls._parse_list_setting(value)
		raise ValueError("allowed_upload_content_types must be a comma-separated string or a list")

	@staticmethod
	def _parse_list_setting(value: str) -> list[str]:
		normalized_value = value.strip()
		if not normalized_value:
			return []

		if normalized_value.startswith("["):
			parsed_value = json.loads(normalized_value)
			if not isinstance(parsed_value, list) or not all(
				isinstance(item, str) for item in parsed_value
			):
				raise ValueError("list setting must be a JSON array of strings")
			return parsed_value

		return [item.strip() for item in normalized_value.split(",") if item.strip()]

	@property
	def max_upload_size_bytes(self) -> int:
		"""
		Gibt die maximale Upload-Größe in Bytes zurück.

		Die Methode rechnet den in Megabyte konfigurierten Wert in Bytes um,
		damit er später technisch einfacher verwendet werden kann.

		Args:
			self: Die aktuelle Instanz der Settings-Klasse.

		Returns:
			Die maximale Upload-Größe in Bytes als Integer.
		"""
		return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
	"""
	Gibt eine gecachte Instanz der Anwendungseinstellungen zurück.

	Die Methode erzeugt die Settings nur einmal und liefert bei
	weiteren Aufrufen dieselbe Instanz zurück.

	Returns:
		Eine Instanz der Settings-Klasse mit den geladenen Konfigurationswerten.
	"""
	return Settings()
