from io import BytesIO
from uuid import UUID
from zipfile import ZipFile

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.dependencies import get_settings_dependency
from app.main import app


def create_zip_bytes(filename: str = "dummy.txt", content: bytes = b"dummy") -> bytes:
    buffer = BytesIO()

    with ZipFile(buffer, "w") as zip_file:
        zip_file.writestr(filename, content)

    return buffer.getvalue()


def test_benchmark_returns_benchmark_response_for_two_zip_files() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", zip_bytes, "application/zip"),
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 200

    body = response.json()
    request_id = body.pop("request_id")
    UUID(request_id)

    assert body == {
        "model_version": "benchmark-dummy-model",
        "summary": {
            "total_images": 0,
            "processed_images": 0,
            "failed_images": 0,
        },
        "metrics": {
            "true_positives": 0,
            "false_positives": 0,
            "false_negatives": 0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "accuracy": 0.0,
            "mean_iou": 0.0,
            "average_inference_time_ms": None,
            "total_processing_time_ms": None,
        },
        "images": [],
    }


def test_benchmark_returns_400_when_test_archive_is_missing() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive fehlt.",
    }


def test_benchmark_returns_400_when_label_archive_is_missing() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "label_archive fehlt.",
    }


def test_benchmark_returns_400_when_both_archives_are_missing() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={},
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive und label_archive fehlen.",
    }


def test_benchmark_returns_400_when_test_archive_is_not_zip() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.txt", zip_bytes, "application/zip"),
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive muss eine ZIP-Datei sein.",
    }


def test_benchmark_returns_400_when_label_archive_is_not_zip() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", zip_bytes, "application/zip"),
            "label_archive": ("labels.txt", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "label_archive muss eine ZIP-Datei sein.",
    }


def test_benchmark_returns_400_for_invalid_zip_content_type() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", zip_bytes, "text/plain"),
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive hat einen ungültigen Dateityp: text/plain",
    }


def test_benchmark_returns_400_when_test_archive_is_empty() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"", "application/zip"),
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive ist leer.",
    }


def test_benchmark_returns_400_when_label_archive_is_empty() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", zip_bytes, "application/zip"),
            "label_archive": ("labels.zip", b"", "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "label_archive ist leer.",
    }


def test_benchmark_returns_400_when_test_archive_is_not_valid_zip_content() -> None:
    client = TestClient(app)
    zip_bytes = create_zip_bytes()

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"not-a-real-zip", "application/zip"),
            "label_archive": ("labels.zip", zip_bytes, "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "error": "bad_request",
        "message": "test_archive ist keine gültige ZIP-Datei.",
    }


def test_benchmark_returns_400_when_test_archive_is_too_large() -> None:
    app.dependency_overrides[get_settings_dependency] = lambda: Settings(
        max_benchmark_zip_size_mb=1
    )

    try:
        client = TestClient(app)
        oversized_content = b"x" * (1024 * 1024 + 1)
        zip_bytes = create_zip_bytes()

        response = client.post(
            "/api/v1/benchmark",
            files={
                "test_archive": (
                    "test-images.zip",
                    oversized_content,
                    "application/zip",
                ),
                "label_archive": ("labels.zip", zip_bytes, "application/zip"),
            },
        )

        assert response.status_code == 400
        assert response.json() == {
            "error": "bad_request",
            "message": "test_archive ist zu groß. Maximal erlaubt: 1 MB.",
        }
    finally:
        app.dependency_overrides.clear()