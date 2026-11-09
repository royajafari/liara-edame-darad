#!/usr/bin/env bash
# Render an HTML file to PNG with headless Chrome.
# Usage: tools/shot.sh <input.html> <output.png> <width> <height>
set -euo pipefail
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
IN="$(cd "$(dirname "$1")" && pwd -W 2>/dev/null || pwd)/$(basename "$1")"
OUT="$(cd "$(dirname "$2")" && pwd -W 2>/dev/null || pwd)/$(basename "$2")"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size="$3,$4" --virtual-time-budget=3000 \
  --screenshot="$OUT" "file:///$IN" >/dev/null 2>&1
echo "$OUT"
