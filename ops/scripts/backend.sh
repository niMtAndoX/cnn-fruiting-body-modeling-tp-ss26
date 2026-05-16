#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/common.sh"

info "Backend: vorbereiten"
ensure_api_env
install_api_deps

info "Backend: lokalen Server auf http://127.0.0.1:$DEV_API_PORT starten"
cd "$API_DIR"
API_HOST="127.0.0.1" API_PORT="$DEV_API_PORT" exec "$API_PYTHON" -m app.run
