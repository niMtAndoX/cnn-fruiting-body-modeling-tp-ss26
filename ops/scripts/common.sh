#!/bin/sh

set -eu

: "${SCRIPT_DIR:=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)}"
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

PYTHON=${PYTHON:-python3.12}
PNPM=${PNPM:-pnpm}
DOCKER=${DOCKER:-docker}
CURL=${CURL:-curl}

DEV_API_PORT=${DEV_API_PORT:-8000}
DEV_WEB_PORT=${DEV_WEB_PORT:-4173}
CHECK_API_PORT=${CHECK_API_PORT:-18000}
CHECK_WEB_PORT=${CHECK_WEB_PORT:-14173}

DEV_API_BASE_URL=${DEV_API_BASE_URL:-http://127.0.0.1:$DEV_API_PORT/api/v1}
DEV_API_HEALTH_URL=${DEV_API_HEALTH_URL:-$DEV_API_BASE_URL/health}
DEV_WEB_READY_URL=${DEV_WEB_READY_URL:-http://127.0.0.1:$DEV_WEB_PORT/}

CHECK_API_BASE_URL=${CHECK_API_BASE_URL:-http://127.0.0.1:$CHECK_API_PORT/api/v1}
CHECK_API_HEALTH_URL=${CHECK_API_HEALTH_URL:-$CHECK_API_BASE_URL/health}
CHECK_WEB_READY_URL=${CHECK_WEB_READY_URL:-http://127.0.0.1:$CHECK_WEB_PORT/}

WAIT_ATTEMPTS=${WAIT_ATTEMPTS:-30}
WAIT_SLEEP_SECONDS=${WAIT_SLEEP_SECONDS:-1}
COMPOSE_WAIT_TIMEOUT=${COMPOSE_WAIT_TIMEOUT:-90}

API_DIR="$REPO_ROOT/apps/api"
WEB_DIR="$REPO_ROOT/apps/web"
API_VENV="$API_DIR/.venv"
API_PYTHON="$API_VENV/bin/python"
API_PIP="$API_VENV/bin/pip"

COMPOSE_FILE="$REPO_ROOT/ops/docker/docker-compose.yaml"
COMPOSE_ENV="$REPO_ROOT/ops/docker/.env"
COMPOSE_ENV_EXAMPLE="$REPO_ROOT/ops/docker/.env.example"
MODEL_DIR_PATH="$REPO_ROOT/models/darknet"
MODEL_DATA_FILE="$MODEL_DIR_PATH/Bilderkennung-Pilzwachstum.data"
MODEL_CFG_FILE="$MODEL_DIR_PATH/Bilderkennung-Pilzwachstum.cfg"
MODEL_WEIGHTS_FILE="$MODEL_DIR_PATH/Bilderkennung-Pilzwachstum_best.weights"

info() {
  printf '==> %s\n' "$*"
}

warn() {
  printf 'WARN: %s\n' "$*" >&2
}

die() {
  printf 'FEHLER: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command_name=$1
  command -v "$command_name" >/dev/null 2>&1 || die "Benötigter Befehl nicht gefunden: $command_name"
}

require_file() {
  file_path=$1
  [ -f "$file_path" ] || die "Benötigte Datei fehlt: $file_path"
}

ensure_env_from_example() {
  target_file=$1
  example_file=$2
  label=$3

  if [ ! -f "$target_file" ]; then
    require_file "$example_file"
    info "$label: $(relative_path "$target_file") aus $(relative_path "$example_file") anlegen"
    cp "$example_file" "$target_file"
  fi
}

ensure_api_env() {
  ensure_env_from_example "$API_DIR/.env" "$API_DIR/.env.example" "Backend"
}

ensure_web_env() {
  ensure_env_from_example "$WEB_DIR/.env" "$WEB_DIR/.env.example" "Frontend"
}

ensure_compose_env() {
  if [ ! -f "$COMPOSE_ENV" ]; then
    require_file "$COMPOSE_ENV_EXAMPLE"
    cp "$COMPOSE_ENV_EXAMPLE" "$COMPOSE_ENV"
    info "$(relative_path "$COMPOSE_ENV") wurde neu angelegt. Werte bei Bedarf prüfen."
  fi
}

ensure_model_artifacts() {
  [ -d "$MODEL_DIR_PATH" ] || die "Modellordner fehlt: $(relative_path "$MODEL_DIR_PATH")"
  require_file "$MODEL_DATA_FILE"
  require_file "$MODEL_CFG_FILE"
  require_file "$MODEL_WEIGHTS_FILE"
}

relative_path() {
  path=$1
  case "$path" in
    "$REPO_ROOT"/*) printf '%s\n' "${path#"$REPO_ROOT"/}" ;;
    *) printf '%s\n' "$path" ;;
  esac
}

ensure_api_venv() {
  require_cmd "$PYTHON"

  if [ ! -x "$API_PYTHON" ]; then
    info "Backend: Python-Venv erstellen"
    "$PYTHON" -m venv "$API_VENV"
  fi
}

install_api_deps() {
  ensure_api_venv
  info "Backend: Dependencies installieren"

  (
    cd "$API_DIR"
    "$API_PYTHON" -m pip install -e ".[dev]"
  )
}

install_web_deps() {
  mode=${1:-default}
  require_cmd "$PNPM"
  info "Frontend: Dependencies installieren"

  (
    cd "$WEB_DIR"
    case "$mode" in
      default)
        PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true "$PNPM" install
        ;;
      frozen)
        PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true "$PNPM" install --frozen-lockfile
        ;;
      *)
        die "Unbekannter pnpm-Installationsmodus: $mode"
        ;;
    esac
  )
}

build_web() {
  api_base_url=$1
  require_cmd "$PNPM"
  info "Frontend: lokalen Build erstellen"

  (
    cd "$WEB_DIR"
    VITE_API_BASE_URL="$api_base_url" "$PNPM" build
  )
}

print_log_if_present() {
  log_file=${1:-}

  if [ -n "$log_file" ] && [ -f "$log_file" ]; then
    printf '%s\n' '----- Log-Auszug -----' >&2
    cat "$log_file" >&2
    printf '%s\n' '----------------------' >&2
  fi
}

wait_for_url() {
  url=$1
  label=$2
  pid=${3:-}
  log_file=${4:-}
  attempt=1

  require_cmd "$CURL"

  while [ "$attempt" -le "$WAIT_ATTEMPTS" ]; do
    if "$CURL" -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      warn "$label wurde beendet, bevor $url erreichbar war."
      print_log_if_present "$log_file"
      return 1
    fi

    attempt=$((attempt + 1))
    sleep "$WAIT_SLEEP_SECONDS"
  done

  warn "$label-Check unter $url hat nicht rechtzeitig geantwortet."
  print_log_if_present "$log_file"
  return 1
}

stop_process() {
  pid=${1:-}

  if [ -z "$pid" ]; then
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
  fi

  wait "$pid" 2>/dev/null || true
}

read_env_value() {
  file_path=$1
  key=$2
  fallback=${3:-}
  value=""

  if [ -f "$file_path" ]; then
    value=$(sed -n "s/^${key}=//p" "$file_path" | tail -n 1)
    value=${value#\"}
    value=${value%\"}
    value=${value#\'}
    value=${value%\'}
  fi

  if [ -n "$value" ]; then
    printf '%s\n' "$value"
  else
    printf '%s\n' "$fallback"
  fi
}

require_docker_compose() {
  require_cmd "$DOCKER"
  "$DOCKER" compose version >/dev/null 2>&1 || die "Docker Compose V2 ist nicht verfügbar."
}

compose() {
  "$DOCKER" compose --env-file "$COMPOSE_ENV" -f "$COMPOSE_FILE" "$@"
}

validate_compose_config() {
  require_docker_compose
  ensure_compose_env
  require_file "$COMPOSE_FILE"
  info "Docker: Compose-Konfiguration validieren"
  compose config -q
}

compose_up_deploy() {
  if ! "$DOCKER" compose up --help 2>/dev/null | grep -q -- '--wait'; then
    die "Docker Compose unterstützt 'up --wait' nicht. Bitte Compose V2 mit Wait-Support verwenden."
  fi

  if "$DOCKER" compose up --help 2>/dev/null | grep -q -- '--wait-timeout'; then
    compose up -d --build --remove-orphans --wait --wait-timeout "$COMPOSE_WAIT_TIMEOUT"
  else
    compose up -d --build --remove-orphans --wait
  fi
}
