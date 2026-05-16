#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/common.sh"

info "Frontend: vorbereiten"
ensure_web_env
install_web_deps default
build_web "$DEV_API_BASE_URL"

info "Frontend: lokalen Preview-Server auf http://127.0.0.1:$DEV_WEB_PORT starten"
cd "$WEB_DIR"
VITE_API_BASE_URL="$DEV_API_BASE_URL" exec "$PNPM" preview --host 127.0.0.1 --port "$DEV_WEB_PORT"
