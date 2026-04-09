"""API-Schema für einheitliche Fehlerantworten."""

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Einheitliche Fehlerantwort der API."""

    error: str
    message: str