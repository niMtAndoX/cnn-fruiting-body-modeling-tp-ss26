from fastapi.testclient import TestClient

from app.main import app


def test_benchmark_returns_dummy_response_for_two_zip_files() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"fake-zip-bytes", "application/zip"),
            "label_archive": ("labels.zip", b"fake-zip-bytes", "application/zip"),
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "accepted",
        "message": "Benchmark endpoint is available.",
        "received_files": {
            "test_archive": "test-images.zip",
            "label_archive": "labels.zip",
        },
    }


def test_benchmark_returns_400_when_test_archive_is_missing() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "label_archive": ("labels.zip", b"fake-zip-bytes", "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "test_archive fehlt.",
    }


def test_benchmark_returns_400_when_label_archive_is_missing() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"fake-zip-bytes", "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "label_archive fehlt.",
    }


def test_benchmark_returns_400_when_both_archives_are_missing() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "test_archive und label_archive fehlen.",
    }


def test_benchmark_returns_400_when_test_archive_is_not_zip() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.txt", b"not-a-zip", "text/plain"),
            "label_archive": ("labels.zip", b"fake-zip-bytes", "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "test_archive muss eine ZIP-Datei sein.",
    }


def test_benchmark_returns_400_when_label_archive_is_not_zip() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"fake-zip-bytes", "application/zip"),
            "label_archive": ("labels.txt", b"not-a-zip", "text/plain"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "label_archive muss eine ZIP-Datei sein.",
    }


def test_benchmark_returns_400_for_invalid_zip_content_type() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/benchmark",
        files={
            "test_archive": ("test-images.zip", b"fake-zip-bytes", "text/plain"),
            "label_archive": ("labels.zip", b"fake-zip-bytes", "application/zip"),
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "test_archive hat einen ungültigen Dateityp: text/plain",
    }