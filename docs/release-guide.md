# Deployment and Release Guide

This project is currently released as an API-first backend.

The supported browser UI for the first release is the FastAPI documentation at
`/docs`. The `apps/web/` directory remains a scaffold for a later iteration and
is not part of the current release flow.

## What must be provided before a release

The release does not ship Darknet model artifacts automatically.

Before starting the API locally or in Docker, provide these files under
`models/darknet/`:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum.names`
- `Bilderkennung-Pilzwachstum_best.weights`

These files are expected from the operator or release user and are intentionally
not versioned in Git.

## Local release preparation

1. Create the backend env file from the example:

macOS / Linux:

```bash
cd apps/api
cp .env.example .env
```

Windows PowerShell:

```powershell
cd apps/api
Copy-Item .env.example .env
```

2. Adjust values in `.env` when needed, especially:

- `API_HOST`
- `API_PORT`
- `LOG_LEVEL`
- `CORS_ALLOW_ORIGINS`
- `MODEL_VERSION`
- `INFERENCE_SCRIPT_PATH` if the default script path is not correct

3. Install dependencies and run the checks:

macOS / Linux:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
.venv/bin/ruff check app
.venv/bin/pytest
```

Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
ruff check app
pytest
```

4. Start the API using the settings-driven entrypoint:

macOS / Linux and Windows PowerShell:

```bash
python -m app.run
```

5. Verify the release candidate manually:

- Open `http://127.0.0.1:8000/docs`
- Call `GET /api/v1/health`
- Upload a sample image to `POST /api/v1/predict`

## Docker release flow

1. Ensure the required model files are present under `models/darknet/`.

2. Build the image from the repository root:

```bash
docker build -f apps/api/Dockerfile -t waldpilz-api .
```

3. Start the container with an env file:

```bash
docker run --rm -p 8000:8000 waldpilz-api
```

The image already contains default runtime values from the Dockerfile.
If you need environment-specific overrides, pass them explicitly with
`docker run -e KEY=value ...`.

## Release checklist

- Required model files are present
- `apps/api/.env` is prepared for local validation when needed
- `ruff check app` passes
- `pytest` passes
- `/docs` loads
- `GET /api/v1/health` returns `{"status":"ok"}`
- `POST /api/v1/predict` works with a real test image
- Docker image builds successfully if Docker delivery is part of the release
