#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$SCRIPT_DIR/common.sh"

info "Deploy: Docker und Compose prüfen"
require_docker_compose
ensure_compose_env

info "Deploy: Modellartefakte prüfen"
ensure_model_artifacts

info "Deploy: Compose-Konfiguration validieren"
validate_compose_config

DEPLOY_WEB_PORT=$(read_env_value "$COMPOSE_ENV" WEB_PORT 8080)

info "Deploy: Docker-Stack bauen und starten"
compose_up_deploy

info "Deploy: Deployment läuft unter http://127.0.0.1:$DEPLOY_WEB_PORT"
