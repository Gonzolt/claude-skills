#!/usr/bin/env bash
# The gate. Build it and read it before reporting anything as done.
# Usage: bash sheet.sh ./work
set -euo pipefail

WORK="${1:-./work}"
MAG="$HOME/.claude/skills/imagemagick-skill/bin/magick.exe"
[ -x "$MAG" ] || { echo "ImageMagick not found at $MAG" >&2; exit 1; }

SHOTS="$WORK/shots"
[ -d "$SHOTS" ] || { echo "No $SHOTS — run prep.sh first." >&2; exit 1; }
REVIEW="$WORK/review"; mkdir -p "$REVIEW"

shopt -s nullglob
FILES=("$SHOTS"/*.jpg)
[ ${#FILES[@]} -gt 0 ] || { echo "No prepped frames in $SHOTS" >&2; exit 1; }

TMP="$REVIEW/.tiles"; rm -rf "$TMP"; mkdir -p "$TMP"
i=0
for f in "${FILES[@]}"; do
  i=$((i+1))
  "$MAG" "$f" -resize 260x462 -background '#111' -gravity center -extent 268x470 \
    -gravity south -fill '#ffd93d' -pointsize 20 \
    -annotate +0+6 "$(basename "${f%.*}")" \
    "$TMP/$(printf '%03d' $i).png"
done
"$MAG" montage "$TMP"/*.png -tile 5x -geometry +5+5 -background '#222' "$REVIEW/sheet.png"

# 100% crops where garments give themselves away: neckline, cuff, hem
rm -rf "$TMP"; mkdir -p "$TMP"
i=0
for f in "${FILES[@]}"; do
  case "$(basename "$f")" in *hero*) ;; *) continue;; esac
  i=$((i+1)); b="$(basename "${f%.*}")"
  "$MAG" "$f" -gravity north     -crop 60%x18%+0+12%  +repage -resize 300x -bordercolor '#111' -border 3 "$TMP/${i}a.png"
  "$MAG" "$f" -gravity northwest -crop 30%x18%+6%+40% +repage -resize 300x -bordercolor '#111' -border 3 "$TMP/${i}b.png"
  "$MAG" "$f" -gravity center    -crop 60%x18%+0+18%  +repage -resize 300x -bordercolor '#111' -border 3 "$TMP/${i}c.png"
done
if [ $i -gt 0 ]; then
  "$MAG" montage "$TMP"/*.png -tile 3x -geometry +5+5 -background '#222' "$REVIEW/crops.png"
  echo "crops  -> $REVIEW/crops.png   (neckline / cuff / hem at 100%)"
fi
rm -rf "$TMP"

echo "sheet  -> $REVIEW/sheet.png   (${#FILES[@]} frames)"
echo
echo "Read both before building. Look for:"
echo "  - frames that look like a different day (light direction, colour)"
echo "  - creases, twisted hems, sleeves pushed up"
echo "  - garment blown out to white, or crushed to black"
echo "  - the child's arms against the torso, hiding the silhouette"
echo "Anything wrong here is a shooting problem — see references/troubleshooting.md."
