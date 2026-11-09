#!/usr/bin/env bash
# Export highlight covers and story frames to highlights/export/*.png
cd "$(dirname "$0")/.."
mkdir -p highlights/export
for f in c1 c2 c3 c4 c5 s1-1 s1-2 s2-1 s2-2 s2-3 s3-1 s3-2 s4-1 s4-2 s5-1 s5-2; do
  case $f in c*) name="cover-${f#c}";; *) name="story-$f";; esac
  tools/shot.sh "highlights/highlights.html?f=$f" "highlights/export/$name.png" 1080 1920 >/dev/null
done
echo done
