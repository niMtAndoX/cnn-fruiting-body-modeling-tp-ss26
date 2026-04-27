"""HTTP-Endpunkt für Benchmark-Aufrufe."""

from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.schemas.benchmark import (
    BenchmarkDummyResponse,
    BenchmarkReceivedFilesResponse,
)

router = APIRouter(tags=["benchmark"])

ALLOWED_ZIP_CONTENT_TYPES = {
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
}


@router.post("/benchmark", response_model=BenchmarkDummyResponse)
async def benchmark(
    test_archive: Annotated[
        UploadFile | None,
        File(description="ZIP-Archiv mit unmarkierten Testbildern."),
    ] = None,
    label_archive: Annotated[
        UploadFile | None,
        File(description="ZIP-Archiv mit maschinenlesbaren Ground-Truth-Labels."),
    ] = None,
) -> BenchmarkDummyResponse:
    if test_archive is None and label_archive is None:
        raise HTTPException(
            status_code=400,
            detail="test_archive und label_archive fehlen.",
        )

    if test_archive is None:
        raise HTTPException(
            status_code=400,
            detail="test_archive fehlt.",
        )

    if label_archive is None:
        raise HTTPException(
            status_code=400,
            detail="label_archive fehlt.",
        )
        
    validate_zip_upload(test_archive, "test_archive")
    validate_zip_upload(label_archive, "label_archive")

    return BenchmarkDummyResponse(
        status="accepted",
        message="Benchmark endpoint is available.",
        received_files=BenchmarkReceivedFilesResponse(
            test_archive=test_archive.filename or "test_archive.zip",
            label_archive=label_archive.filename or "label_archive.zip",
        ),
    )
    
def validate_zip_upload(file: UploadFile, field_name: str) -> None:
    filename = file.filename or ""

    if not filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} muss eine ZIP-Datei sein.",
        )

    content_type = file.content_type or ""

    if content_type not in ALLOWED_ZIP_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} hat einen ungültigen Dateityp: {content_type}",
        )