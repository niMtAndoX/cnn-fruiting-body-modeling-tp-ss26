#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PNPM=${PNPM:-pnpm}
DEV_API_PORT=${DEV_API_PORT:-8000}
DEV_WEB_PORT=${DEV_WEB_PORT:-4173}
DEV_API_BASE_URL="http://127.0.0.1:$DEV_API_PORT/api/v1"

WEB_DIR="$REPO_ROOT/apps/web"

echo "==> Frontend: vorbereiten"

if [ ! -f "$WEB_DIR/.env" ]; then
  echo "==> Frontend: apps/web/.env aus .env.example anlegen"
  cp "$WEB_DIR/.env.example" "$WEB_DIR/.env"
fi

echo "==> Frontend: Dependencies installieren"
(
  cd "$WEB_DIR"
  "$PNPM" install
)

echo "==> Frontend: lokalen Build erstellen"
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$DEV_API_BASE_URL" "$PNPM" build
)

echo "==> Frontend: lokalen Preview-Server auf http://127.0.0.1:$DEV_WEB_PORT starten"

cd "$WEB_DIR"
VITE_API_BASE_URL="$DEV_API_BASE_URL" exec "$PNPM" preview --host 127.0.0.1 --port "$DEV_WEB_PORT"
