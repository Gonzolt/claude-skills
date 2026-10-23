#!/usr/bin/env bash
#
# onmodel stage 5 - the review sheet. This is the gate.
#
#   bash scripts/sheet.sh <workdir> [tier] [--final]
#
#     tier      draft | final   which try-on pass to review (default: draft)
#     --final   review <workdir>/final instead of the raw try-on output
#
# Never judge a try-on by looking at the whole image on a screen - it flatters,
# and every failure in references/realism.md hides at that zoom. This builds the
# five views that actually decide it, per garment:
#
#   1. reference | flat lay | result, at matched scale
#   2. neckline at 200%   where garment meets skin, and where transfer fails first
#   3. cuff at 200%       hands and sleeve ends, the second-highest yield
#   4. hem at 200%        does the garment end, or dissolve
#   5. the result at 25%  squint view - kills detail, leaves tonal structure.
#                         If the garment separates from the body as a distinct
#                         pasted shape here, it is pasted, and no detail work
#                         will save it.
#
# Writes <workdir>/review/<handle>.png per garment and review/sheet.png overall.
#
# READ THE SHEET BEFORE REPORTING ANYTHING AS GOOD. This is the successor to the
# mask-debug PNG that caught every problem in the predecessor project - including
# the two that shipped anyway, because nobody opened it.

set -euo pipefail

WORK="${1:-}"
TIER="${2:-draft}"
USE_FINAL=0
[ "${2:-}" = "--final" ] && { TIER="final"; USE_FINAL=1; }
[ "${3:-}" = "--final" ] && USE_FINAL=1

if [ -z "$WORK" ]; then
  echo "usage: bash scripts/sheet.sh <workdir> [draft|final] [--final]" >&2
  exit 2
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAGICK="$(cd "$HERE/../.." && pwd)/imagemagick-skill/bin/magick.exe"
[ -x "$MAGICK" ] || { echo "error: ImageMagick not at $MAGICK" >&2; exit 1; }

if [ "$USE_FINAL" = "1" ]; then
  SRC="$WORK/final"
else
  SRC="$WORK/tryon/$TIER"
fi

REVIEW="$WORK/review"
[ -d "$SRC" ] || { echo "error: no $SRC" >&2; exit 1; }
mkdir -p "$REVIEW"

# Inspection windows, as fractions of the result frame: x,y,w,h.
# These suit the head-to-mid-thigh framing that casting.ps1 produces. Override
# by editing here if the master is framed differently - a crop window that
# misses the neckline makes the whole sheet useless.
NECK="0.28,0.10,0.44,0.22"
CUFF="0.02,0.42,0.34,0.24"
HEM="0.22,0.58,0.56,0.26"

crop_at() {                       # crop_at <in> <x,y,w,h> <out> <label>
  local in="$1" box="$2" out="$3" label="$4"
  local W H x y w h
  W=$("$MAGICK" identify -format "%w" "$in")
  H=$("$MAGICK" identify -format "%h" "$in")
  IFS=',' read -r fx fy fw fh <<< "$box"
  x=$(awk "BEGIN{printf \"%d\", $fx * $W}")
  y=$(awk "BEGIN{printf \"%d\", $fy * $H}")
  w=$(awk "BEGIN{printf \"%d\", $fw * $W}")
  h=$(awk "BEGIN{printf \"%d\", $fh * $H}")

  # Every panel is forced to exactly 300x400 with -extent. Without it the crop
  # windows have different aspect ratios, the panels come out different heights,
  # and +append leaves the row misaligned with grey gaps - which makes the sheet
  # harder to read than the thing it is meant to be checking.
  "$MAGICK" "$in" -crop "${w}x${h}+${x}+${y}" +repage \
    -resize 200% -resize 300x400 \
    -background '#DDDDDD' -gravity center -extent 300x400 \
    -bordercolor '#BBBBBB' -border 1 \
    -background white -gravity south -splice 0x26 \
    -pointsize 15 -fill black -annotate +0+4 "$label" \
    "$out"
}

panel() {                         # panel <in> <size> <out> <label>
  "$MAGICK" "$1" -resize "$2" \
    -background '#DDDDDD' -gravity center -extent "$2" \
    -bordercolor '#BBBBBB' -border 1 \
    -background white -gravity south -splice 0x26 \
    -pointsize 15 -fill black -annotate +0+4 "$4" \
    "$3"
}

rows=()
count=0
noref=()

for res in "$SRC"/*.png; do
  [ -e "$res" ] || continue
  handle="$(basename "${res%.png}")"
  gdir="$WORK/garments/$handle"
  tmp="$REVIEW/.tmp-$handle"
  mkdir -p "$tmp"

  echo "  $handle"

  parts=()

  if [ -f "$gdir/reference.png" ]; then
    panel "$gdir/reference.png" "300x400" "$tmp/a.png" "reference (worn)"
    parts+=("$tmp/a.png")
  else
    "$MAGICK" -size 300x400 'xc:#EEEEEE' \
      -pointsize 17 -fill '#AA3333' -gravity center \
      -annotate 0 "NO\nREFERENCE" \
      -background white -gravity south -splice 0x26 \
      -pointsize 15 -fill black -annotate +0+4 "reference" "$tmp/a.png"
    parts+=("$tmp/a.png")
    noref+=("$handle")
  fi

  if [ -f "$gdir/cloth.png" ]; then
    panel "$gdir/cloth.png" "300x400" "$tmp/b.png" "flat lay"
    parts+=("$tmp/b.png")
  fi

  panel "$res" "300x400" "$tmp/c.png" "RESULT"
  parts+=("$tmp/c.png")

  crop_at "$res" "$NECK" "$tmp/d.png" "neckline 200%"
  crop_at "$res" "$CUFF" "$tmp/e.png" "cuff 200%"
  crop_at "$res" "$HEM"  "$tmp/f.png" "hem 200%"
  parts+=("$tmp/d.png" "$tmp/e.png" "$tmp/f.png")

  # The squint view. Downsample hard, then blow it back up without smoothing so
  # only tonal structure survives - a pasted garment separates from the body
  # here even when it looks convincing at full size.
  # -filter must be set BEFORE the resize it affects; setting it afterwards is
  # a silent no-op and the blocky enlargement never happens.
  "$MAGICK" "$res" -resize 25% -filter Point -resize 300x400 \
    -background '#DDDDDD' -gravity center -extent 300x400 \
    -bordercolor '#BBBBBB' -border 1 \
    -background white -gravity south -splice 0x26 \
    -pointsize 15 -fill black -annotate +0+4 "squint (25%)" "$tmp/g.png"
  parts+=("$tmp/g.png")

  row="$REVIEW/$handle.png"
  "$MAGICK" "${parts[@]}" -background '#DDDDDD' -gravity south +append \
    -bordercolor '#DDDDDD' -border 8 \
    -background white -gravity north -splice 0x30 \
    -gravity northwest -pointsize 18 -fill black -annotate +10+7 "$handle" \
    "$row"

  rows+=("$row")
  rm -rf "$tmp"
  count=$((count + 1))
done

if [ "$count" = "0" ]; then
  echo "error: no result PNGs in $SRC" >&2
  exit 1
fi

"$MAGICK" "${rows[@]}" -background '#DDDDDD' -gravity west -append "$REVIEW/sheet.png"

echo
echo "$count garment(s) -> $REVIEW/sheet.png"
echo

if [ ${#noref[@]} -gt 0 ]; then
  echo "Ran without a reference: ${noref[*]}"
  echo "  Drape and print scale in these are invented. Say so when reporting them."
  echo
fi

cat <<'EOF'
Judge in this order, and reject on any one of them:

  1. Neckline at 200%   - is the garment-to-skin transition continuous, or is
                          there a halo, a smear, or a jaw that dissolves?
  2. Cuff at 200%       - are the hands hands, and does the sleeve end as cloth?
  3. Hem at 200%        - does the garment end, or fade out?
  4. Print vs reference - at equal body width, is the motif the same size?
                          Not versus the flat lay. Versus the reference.
  5. Squint at 25%      - does the garment separate from the body as a shape?

Anything wrong here is an INPUT problem with a name. Look it up in
references/realism.md and fix the input. Do not re-roll the seed, raise the
steps, or change the guidance - none of them repair a bad crop, and each costs
four minutes to learn nothing.

If three attempts with corrected inputs have not landed it, the honest answer
is that this garment does not transfer. Say so and propose real photography for
that slot rather than shipping a fourth mediocre attempt.
EOF
