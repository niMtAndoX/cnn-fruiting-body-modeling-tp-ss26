"""Zentrale Exception-Handler für einheitliche API-Fehlerantworten."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.schemas.error import ErrorResponse
from app.domain.prediction.exceptions import (
    PredictionBadRequestError,
    PredictionExecutionError,
)


def register_exception_handlers(app: FastAPI) -> None:
    """Registriert zentrale Exception-Handler für die API."""

    @app.exception_handler(PredictionBadRequestError)
    async def handle_prediction_bad_request(
        request: Request,
        exc: PredictionBadRequestError,
    ) -> JSONResponse:
        error_response = ErrorResponse(
            error="bad_request",
            message=str(exc),
        )
        return JSONResponse(
            status_code=400,
            content=error_response.model_dump(),
        )

    @app.exception_handler(PredictionExecutionError)
    async def handle_prediction_execution_error(
        request: Request,
        exc: PredictionExecutionError,
    ) -> JSONResponse:
        error_response = ErrorResponse(
            error="internal_error",
            message=str(exc),
        )
        return JSONResponse(
            status_code=500,
            content=error_response.model_dump(),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        error_response = ErrorResponse(
            error="internal_error",
            message="An unexpected internal error occurred.",
        )
        return JSONResponse(
            status_code=500,
            content=error_response.model_dump(),
        )