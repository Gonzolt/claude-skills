#!/usr/bin/env bash
#
# onmodel - prepare inputs to RefTon's aspect ratio.
#
#   bash scripts/prep.sh <workdir> [--crop]
#
# RefTon resizes every input to exactly 384x512 or 768x1024 (3:4 width:height)
# WITHOUT preserving aspect ratio. A square flat lay therefore arrives visibly
# stretched, and a stretched garment transfers as a stretched garment - one of
# the quieter reasons a result looks wrong for no nameable reason.
#
# Default is to PAD to 3:4, not crop, because padding cannot destroy part of a
# garment and a flat lay's background is already flat. Pass --crop to centre-
# crop instead, which is the better choice when padding leaves the garment too
# small in frame to read.
#
# Reads  <workdir>/garments/picks.json
# Writes <workdir>/garments/<handle>/cloth.png
#        <workdir>/garments/<handle>/reference.png
#        <workdir>/model/master-prepped.png

set -euo pipefail

WORK="${1:-}"
MODE="pad"
[ "${2:-}" = "--crop" ] && MODE="crop"

if [ -z "$WORK" ]; then
  echo "usage: bash scripts/prep.sh <workdir> [--crop]" >&2
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAGICK="$(cd "$HERE/../.." && pwd)/imagemagick-skill/bin/magick.exe"
PICKS="$WORK/garments/picks.json"

[ -x "$MAGICK" ] || { echo "error: ImageMagick not at $MAGICK" >&2; exit 1; }
[ -f "$PICKS" ]  || { echo "error: no $PICKS - run fetch-garments.mjs first" >&2; exit 1; }

# Work at the 1024x768 tier; the 512 draft pass downsamples from this cleanly.
TARGET_W=768
TARGET_H=1024

# ---------------------------------------------------------------------------
# fit <in> <out>
#
# Pad (or crop) to 3:4, then resize to the target. The pad colour is sampled
# from the top-left pixel, so a flat lay on white pads with that same white and
# leaves no visible seam for the model to interpret as a garment edge.
# ---------------------------------------------------------------------------
fit() {
  local in="$1" out="$2"

  local w h
  w=$("$MAGICK" identify -format "%w" "$in")
  h=$("$MAGICK" identify -format "%h" "$in")

  # 3:4 means w*4 vs h*3 - integer maths, no bc dependency.
  local tw th
  if [ $((w * 4)) -gt $((h * 3)) ]; then
    tw=$w; th=$(( (w * 4 + 2) / 3 ))       # too wide -> grow height
  else
    th=$h; tw=$(( (h * 3 + 3) / 4 ))       # too tall -> grow width
  fi

  if [ "$MODE" = "crop" ]; then
    "$MAGICK" "$in" -gravity center \
      -resize "${TARGET_W}x${TARGET_H}^" \
      -extent "${TARGET_W}x${TARGET_H}" \
      -strip "$out"
  else
    local bg
    bg=$("$MAGICK" "$in" -format "%[pixel:p{0,0}]" info:)
    "$MAGICK" "$in" -background "$bg" -gravity center \
      -extent "${tw}x${th}" \
      -resize "${TARGET_W}x${TARGET_H}!" \
      -strip "$out"
  fi

  printf '    %-11s %sx%s -> %sx%s  (%s)\n' \
    "$(basename "$out")" "$w" "$h" "$TARGET_W" "$TARGET_H" "$MODE"
}

echo
echo "Preparing inputs to ${TARGET_W}x${TARGET_H} (3:4), mode: $MODE"
echo

# --- garments ---------------------------------------------------------------

handles=$(node -e '
  const p = require("'"$PICKS"'".replace(/\\/g,"/"));
  console.log(Object.keys(p).join("\n"));
')

missing_ref=()

for handle in $handles; do
  echo "  $handle"

  cloth=$(node -e '
    const p = require("'"$PICKS"'".replace(/\\/g,"/"));
    process.stdout.write(p["'"$handle"'"].cloth || "");
  ')
  ref=$(node -e '
    const p = require("'"$PICKS"'".replace(/\\/g,"/"));
    process.stdout.write(p["'"$handle"'"].reference || "");
  ')

  dir="$WORK/garments/$handle"

  if [ -n "$cloth" ] && [ -f "$WORK/$cloth" ]; then
    fit "$WORK/$cloth" "$dir/cloth.png"
  else
    echo "    cloth MISSING ($cloth)" >&2
  fi

  if [ -n "$ref" ] && [ -f "$WORK/$ref" ]; then
    fit "$WORK/$ref" "$dir/reference.png"
  else
    echo "    reference: none"
    missing_ref+=("$handle")
  fi
done

# --- the master -------------------------------------------------------------

MASTER="$WORK/model/master.png"
if [ -f "$MASTER" ]; then
  echo
  echo "  master"
  fit "$MASTER" "$WORK/model/master-prepped.png"
else
  echo
  echo "  master: not cast yet ($MASTER)" >&2
fi

echo
if [ ${#missing_ref[@]} -gt 0 ]; then
  cat >&2 <<EOF
WARNING - running without a reference for: ${missing_ref[*]}
  Without --reference this is a plain Kontext try-on: the model has to invent
  drape and print scale, which is precisely what reads as pasted on. Confirm
  from the contact sheet that the store really has no worn shot before
  accepting this. references/garments.md lists the fallbacks.

EOF
fi

echo "Next: powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work $WORK"
echo
