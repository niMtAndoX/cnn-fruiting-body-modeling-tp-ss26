"""Logging-Konfiguration für die API."""

import logging


def configure_logging(log_level: str) -> None:
    """Initialisiert ein einfaches, konsistentes Logging für die API."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        force=True,
    )
