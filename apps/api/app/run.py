"""Lokaler Startpunkt, der Uvicorn aus den Settings konfiguriert."""

import uvicorn

from app.core.config import get_settings


def main() -> None:
    """Startet die API mit Host- und Portwerten aus den Settings."""
    settings = get_settings()
    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
