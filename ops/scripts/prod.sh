#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PYTHON=${PYTHON:-python3.12}
PNPM=${PNPM:-pnpm}
CHECK_API_PORT=${CHECK_API_PORT:-18000}
CHECK_WEB_PORT=${CHECK_WEB_PORT:-14173}
CHECK_API_BASE_URL="http://127.0.0.1:$CHECK_API_PORT/api/v1"
CHECK_API_HEALTH_URL="$CHECK_API_BASE_URL/health"
CHECK_WEB_HEALTH_URL="http://127.0.0.1:$CHECK_WEB_PORT/health"

API_DIR="$REPO_ROOT/apps/api"
WEB_DIR="$REPO_ROOT/apps/web"
API_VENV="$API_DIR/.venv"
API_PIP="$API_VENV/bin/pip"
API_PYTHON="$API_VENV/bin/python"
COMPOSE_FILE="$REPO_ROOT/ops/docker/docker-compose.yaml"
COMPOSE_ENV="$REPO_ROOT/ops/docker/.env"
DEPLOY_WEB_PORT=$(sed -n 's/^WEB_PORT=//p' "$COMPOSE_ENV" | tail -n 1)
DEPLOY_WEB_PORT=${DEPLOY_WEB_PORT:-8080}

echo "==> Deploy: lokalen Pre-Deploy-Check vorbereiten"

if [ ! -f "$API_DIR/.env" ]; then
  echo "==> Deploy: apps/api/.env aus .env.example anlegen"
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

if [ ! -x "$API_PYTHON" ]; then
  echo "==> Deploy: Python-Venv fuer das Backend erstellen"
  "$PYTHON" -m venv "$API_VENV"
fi

echo "==> Deploy: Backend-Dependencies installieren"
(
  cd "$API_DIR"
  "$API_PIP" install -e ".[dev]"
)

if [ ! -f "$WEB_DIR/.env" ]; then
  echo "==> Deploy: apps/web/.env aus .env.example anlegen"
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env"
fi

echo "==> Deploy: Frontend-Dependencies installieren"
(
  cd "$WEB_DIR"
  "$PNPM" install
)

echo "==> Deploy: Frontend lokal bauen"
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$CHECK_API_BASE_URL" "$PNPM" build
)

wait_for_url() {
  url=$1
  pid=$2
  label=$3
  log_file=$4
  attempt=1

  while [ "$attempt" -le 30 ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
      echo "$label konnte fuer den lokalen Deploy-Check nicht gestartet werden." >&2
      cat "$log_file" >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 1
  done

  echo "$label-Healthcheck unter $url hat nicht rechtzeitig geantwortet." >&2
  cat "$log_file" >&2
  exit 1
}

echo "==> Deploy: lokales Backend fuer Healthcheck starten"
api_log=$(mktemp "/tmp/waldpilz-api-deploy-check.XXXXXX.log")
(
  cd "$API_DIR"
  API_HOST="127.0.0.1" API_PORT="$CHECK_API_PORT" DEBUG="false" "$API_PYTHON" -m app.run
) >"$api_log" 2>&1 &
api_pid=$!

cleanup() {
  kill "$api_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true

  if [ -n "${web_pid:-}" ]; then
    kill "$web_pid" 2>/dev/null || true
    wait "$web_pid" 2>/dev/null || true
  fi

  rm -f "$api_log"

  if [ -n "${web_log:-}" ]; then
    rm -f "$web_log"
  fi
}

trap cleanup EXIT INT TERM

echo "==> Deploy: Backend-Healthcheck pruefen"
wait_for_url "$CHECK_API_HEALTH_URL" "$api_pid" "Backend" "$api_log"
curl -fsS "$CHECK_API_HEALTH_URL"

echo "==> Deploy: lokales Frontend fuer Healthcheck starten"
web_log=$(mktemp "/tmp/waldpilz-web-deploy-check.XXXXXX.log")
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$CHECK_API_BASE_URL" "$PNPM" preview --host 127.0.0.1 --port "$CHECK_WEB_PORT"
) >"$web_log" 2>&1 &
web_pid=$!

echo "==> Deploy: Frontend-Healthcheck pruefen"
wait_for_url "$CHECK_WEB_HEALTH_URL" "$web_pid" "Frontend" "$web_log"
curl -fsS "$CHECK_WEB_HEALTH_URL"

echo "==> Deploy: Docker-Deployment starten"
docker compose --env-file "$COMPOSE_ENV" -f "$COMPOSE_FILE" up -d --build
echo "==> Deploy: Deployment laeuft jetzt unter http://127.0.0.1:$DEPLOY_WEB_PORT"
