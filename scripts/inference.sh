#!/usr/bin/env bash

set -euo pipefail

IMAGE_PATH="${1:-}"

if [[ -z "$IMAGE_PATH" ]]; then
  echo "Usage: $0 <image_path>" >&2
  exit 1
fi

cd ~/src/darknet/build

./src-cli/darknet detector test \
  /Users/max/workspace/darknet-cnn/Bilderkennung-Pilzwachstum.data \
  /Users/max/workspace/darknet-cnn/Bilderkennung-Pilzwachstum.cfg \
  /Users/max/workspace/darknet-cnn/Bilderkennung-Pilzwachstum_best.weights \
  "$IMAGE_PATH" \
  -dont_show