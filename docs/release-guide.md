# Deployment and Release Guide

This guide focuses on release preparation and deployment only.

For local backend setup, API usage, configuration, and tests, see
[`apps/api/README.md`](../apps/api/README.md).

For required model files and their placement, see
[`models/README.md`](../models/README.md).

## Release prerequisites

Before building or running a release candidate:

- ensure the required model files are present under `models/darknet/`
- ensure the backend setup from [`apps/api/README.md`](../apps/api/README.md) is complete
- ensure local validation can run successfully

## Release validation

Run the backend checks from `apps/api/`:

```bash
.venv/bin/ruff check app
.venv/bin/pytest
```

Then validate the release candidate manually:

- open `http://127.0.0.1:8000/docs`
- call `GET /api/v1/health`
- upload a sample image to `POST /api/v1/predict`

## Docker release flow

Build the image from the repository root:

```bash
docker build -f apps/api/Dockerfile -t waldpilz-api .
```

Start the container:

```bash
docker run --rm -p 8000:8000 waldpilz-api
```

The image already contains default runtime values from the Dockerfile.
If you need environment-specific overrides, pass them explicitly with
`docker run -e KEY=value ...`.

## Release checklist

- required model files are present
- backend validation passes with Ruff and pytest
- `/docs` loads successfully
- `GET /api/v1/health` returns `{"status":"ok"}`
- `POST /api/v1/predict` works with a real test image
- the Docker image builds successfully if Docker delivery is part of the release
