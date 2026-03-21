#!/bin/bash
# Build the optimized ggwave.js with emscripten
#
# Prerequisites:
#   git clone https://github.com/emscripten-core/emsdk.git
#   cd emsdk && ./emsdk install latest && ./emsdk activate latest
#   source emsdk_env.sh
#
# Then run this script from the test-web/ directory:
#   ./build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Building optimized ggwave.js ==="
echo "Source: $ROOT_DIR"
echo "Output: $SCRIPT_DIR/ggwave.js"

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
  -o "$SCRIPT_DIR/ggwave.js"

echo "=== Done! ==="
echo "File: $SCRIPT_DIR/ggwave.js ($(wc -c < "$SCRIPT_DIR/ggwave.js") bytes)"
echo ""
echo "Serve with:  cd $SCRIPT_DIR && python3 -m http.server 8080"
echo "Open:        http://localhost:8080"
