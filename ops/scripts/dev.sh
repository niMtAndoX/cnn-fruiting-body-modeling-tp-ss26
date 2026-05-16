#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/common.sh"

api_pid=""
web_pid=""

cleanup() {
  stop_process "$web_pid"
  stop_process "$api_pid"
}

trap cleanup EXIT INT TERM

info "Dev: lokale Umgebung vorbereiten"
ensure_api_env
ensure_web_env
install_api_deps
install_web_deps default
build_web "$DEV_API_BASE_URL"

info "Dev: Backend lokal auf http://127.0.0.1:$DEV_API_PORT starten"
(
  cd "$API_DIR"
  API_HOST="127.0.0.1" API_PORT="$DEV_API_PORT" "$API_PYTHON" -m app.run
) &
api_pid=$!

info "Dev: Backend-Healthcheck prüfen"
wait_for_url "$DEV_API_HEALTH_URL" "Backend" "$api_pid"

info "Dev: Frontend lokal auf http://127.0.0.1:$DEV_WEB_PORT starten"
(
  cd "$WEB_DIR"
  VITE_API_BASE_URL="$DEV_API_BASE_URL" "$PNPM" preview --host 127.0.0.1 --port "$DEV_WEB_PORT"
) &
web_pid=$!

info "Dev: Frontend-Erreichbarkeit prüfen"
wait_for_url "$DEV_WEB_READY_URL" "Frontend" "$web_pid"

printf '%s\n' \
  "Backend läuft unter http://127.0.0.1:$DEV_API_PORT" \
  "Frontend läuft unter http://127.0.0.1:$DEV_WEB_PORT"

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
