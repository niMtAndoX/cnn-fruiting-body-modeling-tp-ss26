#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PYTHON=${PYTHON:-python3.12}
PNPM=${PNPM:-pnpm}
DEV_API_PORT=${DEV_API_PORT:-8000}
DEV_WEB_PORT=${DEV_WEB_PORT:-4173}
DEV_API_BASE_URL="http://127.0.0.1:$DEV_API_PORT/api/v1"
DEV_API_HEALTH_URL="$DEV_API_BASE_URL/health"
DEV_WEB_HEALTH_URL="http://127.0.0.1:$DEV_WEB_PORT/health"

API_DIR="$REPO_ROOT/apps/api"
WEB_DIR="$REPO_ROOT/apps/web"
API_VENV="$API_DIR/.venv"
API_PIP="$API_VENV/bin/pip"
API_PYTHON="$API_VENV/bin/python"

echo "==> Dev: lokale Umgebung vorbereiten"

if [ ! -f "$API_DIR/.env" ]; then
  echo "==> Dev: apps/api/.env aus .env.example anlegen"
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

if [ ! -x "$API_PYTHON" ]; then
  echo "==> Dev: Python-Venv fuer das Backend erstellen"
  "$PYTHON" -m venv "$API_VENV"
fi

echo "==> Dev: Backend-Dependencies installieren"
(
  cd "$API_DIR"
  "$API_PIP" install -e ".[dev]"
)

if [ ! -f "$WEB_DIR/.env" ]; then
  echo "==> Dev: apps/web/.env aus .env.example anlegen"
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env"
fi

echo "==> Dev: Frontend-Dependencies installieren"
(
  cd "$WEB_DIR"
  "$PNPM" install
)

echo "==> Dev: Frontend lokal bauen"
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$DEV_API_BASE_URL" "$PNPM" build
)

wait_for_url() {
  url=$1
  pid=$2
  label=$3
  attempt=1

  while [ "$attempt" -le 30 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
      echo "$label konnte lokal nicht gestartet werden." >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 1
  done

  echo "$label-Healthcheck unter $url hat nicht rechtzeitig geantwortet." >&2
  exit 1
}

echo "==> Dev: Backend lokal auf http://127.0.0.1:$DEV_API_PORT starten"
(
  cd "$API_DIR"
  API_HOST="127.0.0.1" API_PORT="$DEV_API_PORT" "$API_PYTHON" -m app.run
) &
api_pid=$!

cleanup() {
  kill "$api_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true

  if [ -n "${web_pid:-}" ]; then
    kill "$web_pid" 2>/dev/null || true
    wait "$web_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "==> Dev: Backend-Healthcheck pruefen"
wait_for_url "$DEV_API_HEALTH_URL" "$api_pid" "Backend"

echo "==> Dev: Frontend lokal auf http://127.0.0.1:$DEV_WEB_PORT starten"
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$DEV_API_BASE_URL" "$PNPM" preview --host 127.0.0.1 --port "$DEV_WEB_PORT"
) &
web_pid=$!

echo "==> Dev: Frontend-Healthcheck pruefen"
wait_for_url "$DEV_WEB_HEALTH_URL" "$web_pid" "Frontend"

echo "Backend laeuft unter http://127.0.0.1:$DEV_API_PORT"
echo "Frontend laeuft unter http://127.0.0.1:$DEV_WEB_PORT"

status=0

while kill -0 "$api_pid" 2>/dev/null && kill -0 "$web_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$api_pid" 2>/dev/null; then
  wait "$api_pid" || status=$?
fi

if ! kill -0 "$web_pid" 2>/dev/null; then
  wait "$web_pid" || status=$?
fi

exit "$status"
