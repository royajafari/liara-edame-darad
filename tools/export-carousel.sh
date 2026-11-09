#!/usr/bin/env bash
# Export all carousel slides to carousel/export/*.png
cd "$(dirname "$0")/.."
mkdir -p carousel/export
for i in $(seq 1 9); do tools/shot.sh "carousel/slides.html?s=$i" "carousel/export/slide-0$i.png" 1080 1350 >/dev/null; done
echo done
