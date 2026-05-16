#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/common.sh"

info "Test: vorbereiten"
ensure_api_env
ensure_web_env
install_api_deps
install_web_deps frozen

info "Test: Backend-Lint ausführen"
(
  cd "$API_DIR"
  "$API_PYTHON" -m ruff check .
)

info "Test: Backend-Tests ausführen"
(
  cd "$API_DIR"
  "$API_PYTHON" -m pytest
)

info "Test: Frontend-Lint ausführen"
(
  cd "$WEB_DIR"
  "$PNPM" lint
)

info "Test: Frontend-Tests ausführen"
(
  cd "$WEB_DIR"
  "$PNPM" test
)
