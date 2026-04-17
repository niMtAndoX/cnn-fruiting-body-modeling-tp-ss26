# Deployment and Release Guide

This guide focuses on release preparation and deployment of the complete
application.

For local backend setup, API usage, configuration, and tests, see
[`apps/api/README.md`](../apps/api/README.md).

For frontend setup, local development, and frontend build, see
[`apps/web/README.md`](../apps/web/README.md).

For required model files and their placement, see
[`models/README.md`](../models/README.md).

## Release prerequisites

Before building or running a release candidate:

- ensure the required model files are present under `models/darknet/`
- ensure the backend setup from [`apps/api/README.md`](../apps/api/README.md) is complete
- ensure the frontend setup from [`apps/web/README.md`](../apps/web/README.md) is complete
- ensure local validation can run successfully

## Release validation

Run the backend checks from `apps/api/`:

```bash
.venv/bin/ruff check app
.venv/bin/pytest
```

Run the frontend checks from `apps/web/`:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Then validate the release candidate manually:

- open `http://127.0.0.1:8080`
- open `http://127.0.0.1:8080/docs`
- call `GET /api/v1/health`
- upload a sample image to `POST /api/v1/predict`

## Docker release flow

The recommended release path for the full application is the shared Docker
deployment via `make` from the repository root:

```bash
make deploy
```

This starts frontend and backend together. The application is then available at:

- `http://127.0.0.1:8080`
- `http://127.0.0.1:8080/api/v1/health`
- `http://127.0.0.1:8080/docs`

Useful commands:

```bash
make ps
make logs
make health
make down
```

The deployment uses:

- a backend container built from `apps/api/Dockerfile`
- a frontend container built from `apps/web/Dockerfile`
- Docker Compose under `ops/docker/docker-compose.yaml`
- a root `Makefile` as the main operator entrypoint
- same-origin API routing via the frontend Nginx proxy

## Release checklist

- required model files are present
- backend validation passes with Ruff and pytest
- frontend validation passes with lint, TypeScript, tests and build
- `make deploy` starts the stack successfully
- `http://127.0.0.1:8080` loads successfully
- `http://127.0.0.1:8080/docs` loads successfully
- `GET /api/v1/health` returns `{"status":"ok"}` through the deployed frontend gateway
- `POST /api/v1/predict` works with a real test image
- frontend and backend communicate successfully inside Docker
