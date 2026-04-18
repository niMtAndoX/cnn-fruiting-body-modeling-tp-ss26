# Deployment and Release Guide

This guide focuses on release preparation and deployment of the complete
application.

For local backend setup, API usage, configuration, and tests, see
[`apps/api/README.md`](../apps/api/README.md).

For frontend setup, local development, and frontend build, see
[`apps/web/README.md`](../apps/web/README.md).

For required model files and their placement, see
[`models/README.md`](../models/README.md).
The steps in that document must be followed exactly before any release or deployment.

## Release prerequisites

Before building or running a release candidate:

- ensure the required model files are present under `models/darknet/`
- ensure all preparation steps from [`models/README.md`](../models/README.md) have been completed exactly as documented
- ensure the backend setup from [`apps/api/README.md`](../apps/api/README.md) is complete
- ensure the frontend setup from [`apps/web/README.md`](../apps/web/README.md) is complete
- ensure the repository root `Makefile` can be used locally
- ensure local validation can run successfully

## Release validation

Run the shared validation from the repository root:

```bash
make test
```

This performs the following checks locally before a release:

- backend dependency installation with `pip install -e ".[dev]"`
- backend lint with Ruff
- backend tests with pytest
- frontend dependency installation with `pnpm install`
- frontend lint with ESLint
- frontend tests with Vitest

Then validate the release candidate manually after deployment:

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

`make deploy` now performs these steps automatically:

- installs local backend dependencies
- installs local frontend dependencies
- builds backend and frontend locally
- starts both services locally for a short pre-deployment validation
- checks the backend and frontend health endpoints locally
- deploys both services together with Docker only if the local checks succeed

This starts frontend and backend together in Docker. By default the application is then available at:

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

For local non-Docker workflows, the repository root also provides:

```bash
make backend
make frontend
make dev
```

The deployment uses:

- a backend container built from `apps/api/Dockerfile`
- a frontend container built from `apps/web/Dockerfile`
- Docker Compose under `ops/docker/docker-compose.yaml`
- a root `Makefile` as the main operator entrypoint
- same-origin API routing via the frontend Nginx proxy

## Release checklist

- required model files are present
- `make test` passes successfully
- `make deploy` starts the stack successfully
- `http://127.0.0.1:8080` loads successfully
- `http://127.0.0.1:8080/docs` loads successfully
- `GET /api/v1/health` returns `{"status":"ok"}` through the deployed frontend gateway
- `POST /api/v1/predict` works with a real test image
- frontend and backend communicate successfully inside Docker
- `make down` removes the deployment cleanly after verification
