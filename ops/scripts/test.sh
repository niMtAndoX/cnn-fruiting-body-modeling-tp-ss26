#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PYTHON=${PYTHON:-python3.12}
PNPM=${PNPM:-pnpm}

API_DIR="$REPO_ROOT/apps/api"
WEB_DIR="$REPO_ROOT/apps/web"
API_VENV="$API_DIR/.venv"
API_PIP="$API_VENV/bin/pip"
API_PYTHON="$API_VENV/bin/python"

echo "==> Test: vorbereiten"

if [ ! -f "$API_DIR/.env" ]; then
  echo "==> Test: apps/api/.env aus .env.example anlegen"
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

if [ ! -x "$API_PYTHON" ]; then
  echo "==> Test: Python-Venv fuer das Backend erstellen"
  "$PYTHON" -m venv "$API_VENV"
fi

echo "==> Test: Backend-Dependencies installieren"
(
  cd "$API_DIR"
  "$API_PIP" install -e ".[dev]"
)

if [ ! -f "$WEB_DIR/.env" ]; then
  echo "==> Test: apps/web/.env aus .env.example anlegen"
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env"
fi

echo "==> Test: Frontend-Dependencies installieren"
(
  cd "$WEB_DIR"
  "$PNPM" install
)

echo "==> Test: Backend-Lint ausfuehren"
(
  cd "$API_DIR"
  "$API_PYTHON" -m ruff check .
)

echo "==> Test: Backend-Tests ausfuehren"
(
  cd "$API_DIR"
  "$API_PYTHON" -m pytest
)

echo "==> Test: Frontend-Lint ausfuehren"
(
  cd "$WEB_DIR"
  "$PNPM" lint
)

echo "==> Test: Frontend-Tests ausfuehren"
(
  cd "$WEB_DIR"
  "$PNPM" test
)
