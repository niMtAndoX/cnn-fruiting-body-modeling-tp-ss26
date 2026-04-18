#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PYTHON=${PYTHON:-python3.12}
DEV_API_PORT=${DEV_API_PORT:-8000}

API_DIR="$REPO_ROOT/apps/api"
API_VENV="$API_DIR/.venv"
API_PIP="$API_VENV/bin/pip"
API_PYTHON="$API_VENV/bin/python"

echo "==> Backend: vorbereiten"

if [ ! -f "$API_DIR/.env" ]; then
  echo "==> Backend: apps/api/.env aus .env.example anlegen"
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

if [ ! -x "$API_PYTHON" ]; then
  echo "==> Backend: Python-Venv erstellen"
  "$PYTHON" -m venv "$API_VENV"
fi

echo "==> Backend: Dependencies installieren"
(
  cd "$API_DIR"
  "$API_PIP" install -e ".[dev]"
)

echo "==> Backend: lokalen Server auf http://127.0.0.1:$DEV_API_PORT starten"

cd "$API_DIR"
API_HOST="127.0.0.1" API_PORT="$DEV_API_PORT" exec "$API_PYTHON" -m app.run
