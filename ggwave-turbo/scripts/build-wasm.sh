#!/bin/bash
# Build the optimized ggwave WASM module for the ggwave-turbo package
#
# Prerequisites: emscripten SDK installed and sourced
#   source /path/to/emsdk/emsdk_env.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$PKG_DIR/.." && pwd)"

echo "=== Building ggwave-turbo WASM module ==="

mkdir -p "$PKG_DIR/dist"

em++ \
  -std=c++17 \
  -O3 \
  --bind \
  -s MODULARIZE=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s "EXPORT_NAME='ggwave_factory'" \
  -s SINGLE_FILE=1 \
  -I "$ROOT_DIR/include" \
  "$ROOT_DIR/src/ggwave.cpp" \
  "$ROOT_DIR/bindings/javascript/emscripten.cpp" \
  -o "$PKG_DIR/dist/ggwave.js"

echo "=== Done: $PKG_DIR/dist/ggwave.js ==="
