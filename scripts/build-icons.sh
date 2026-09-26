#!/usr/bin/env bash
# Regenerates every app icon from build/icon.svg.
# Requires rsvg-convert (brew install librsvg) and iconutil (ships with macOS).
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=build/icon.svg
ICONSET=$(mktemp -d)/icon.iconset
mkdir -p "$ICONSET"

for size in 16 32 128 256 512; do
  rsvg-convert -w "$size" -h "$size" "$SRC" -o "$ICONSET/icon_${size}x${size}.png"
  rsvg-convert -w $((size * 2)) -h $((size * 2)) "$SRC" -o "$ICONSET/icon_${size}x${size}@2x.png"
done

# macOS app bundle icon
iconutil -c icns "$ICONSET" -o build/icon.icns
# Windows/Linux: electron-builder derives .ico and hicolor sizes from this
rsvg-convert -w 1024 -h 1024 "$SRC" -o build/icon.png
# Runtime window icon + renderer favicon
rsvg-convert -w 512 -h 512 "$SRC" -o public/icon.png
cp "$SRC" public/icon.svg

rm -rf "$(dirname "$ICONSET")"
echo "Icons written to build/ and public/"
