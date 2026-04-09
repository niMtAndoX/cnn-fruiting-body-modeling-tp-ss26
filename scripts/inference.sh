#!/usr/bin/env bash

set -euo pipefail

IMAGE_PATH="${1:-}"

if [[ -z "$IMAGE_PATH" ]]; then
  echo "Usage: $0 <image_path>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
MODEL_DIR="${MODEL_DIR:-$REPO_ROOT/models/darknet}"

if [[ -n "${DARKNET_DIR:-}" ]]; then
  RESOLVED_DARKNET_DIR="$DARKNET_DIR"
elif [[ -d "$REPO_ROOT/vendor/darknet/build" ]]; then
  RESOLVED_DARKNET_DIR="$REPO_ROOT/vendor/darknet/build"
else
  RESOLVED_DARKNET_DIR="$HOME/src/darknet/build"
fi

DARKNET_BIN="$RESOLVED_DARKNET_DIR/src-cli/darknet"
DATA_FILE="${DARKNET_DATA_FILE:-$MODEL_DIR/Bilderkennung-Pilzwachstum.data}"
CFG_FILE="${DARKNET_CFG_FILE:-$MODEL_DIR/Bilderkennung-Pilzwachstum.cfg}"
WEIGHTS_FILE="${DARKNET_WEIGHTS_FILE:-$MODEL_DIR/Bilderkennung-Pilzwachstum_best.weights}"

if [[ ! -f "$IMAGE_PATH" ]]; then
  echo "Image not found: $IMAGE_PATH" >&2
  exit 1
fi

if [[ ! -d "$MODEL_DIR" ]]; then
  echo "Model directory not found: $MODEL_DIR" >&2
  exit 1
fi

if [[ ! -x "$DARKNET_BIN" ]]; then
  echo "Darknet binary not found or not executable: $DARKNET_BIN" >&2
  exit 1
fi

for required_file in "$DATA_FILE" "$CFG_FILE" "$WEIGHTS_FILE"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Required model file not found: $required_file" >&2
    exit 1
  fi
done

cd "$MODEL_DIR"

"$DARKNET_BIN" detector test \
  "$(basename "$DATA_FILE")" \
  "$(basename "$CFG_FILE")" \
  "$(basename "$WEIGHTS_FILE")" \
  "$IMAGE_PATH" \
  -dont_show
