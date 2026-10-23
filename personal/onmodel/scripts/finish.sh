#!/usr/bin/env bash
#
# onmodel stage 4 - close the remaining realism tells.
#
#   bash scripts/finish.sh <workdir> [options]
#
#     --tier draft|final     which try-on pass to finish   (default: final if
#                            it exists, else draft)
#     --brand '#F5F0EB'      layout background to grade towards
#     --plate 1152x1536      output size
#     --head x,y,w,h         head box as fractions of frame (default .30,.01,.40,.30)
#     --grain 0.30           grain strength, 0 disables
#     --no-identity          skip the identity restore
#
# Four repairs, in order, each closing a specific tell from references/realism.md:
#
#   1. IDENTITY   The master's head is composited back through a feathered
#                 mask. The person never moved between outfits, so this is
#                 exact. It makes the face pixel-identical across every garment
#                 AND keeps it at master resolution rather than upscaled-
#                 diffusion resolution.
#
#   2. UPSCALE    RefTon renders at 384x512 or 768x1024. Everything it touched
#                 is soft relative to a graphic layer sitting next to it.
#
#   3. GRADE      Multiply by the brand colour so the white studio sweep maps
#                 exactly onto the layout background instead of seaming
#                 against it.
#
#   4. GRAIN      A real photograph has sensor noise; a diffusion output has
#                 none. Applying matched grain across the WHOLE plate is what
#                 makes the layers read as one exposure. Highest ratio of
#                 effect to effort in the pipeline, and almost nobody does it.
#
# Note on the grain composite: it is Overlay against a mid-grey noise layer,
# which is neutral at gray50 and swings both ways. That is the same reason the
# predecessor project used Overlay rather than Multiply - grain can lighten as
# well as darken, which is what real grain does.

set -euo pipefail

WORK="${1:-}"
shift || true

if [ -z "$WORK" ]; then
  echo "usage: bash scripts/finish.sh <workdir> [--tier draft|final] [--brand '#F5F0EB'] [--plate 1152x1536] [--head x,y,w,h] [--grain 0.30] [--no-identity]" >&2
  exit 2
fi

TIER=""
BRAND="#F5F0EB"
PLATE="1152x1536"
HEAD="0.30,0.01,0.40,0.30"
GRAIN="0.30"
IDENTITY=1

while [ $# -gt 0 ]; do
  case "$1" in
    --tier)        TIER="$2"; shift 2 ;;
    --brand)       BRAND="$2"; shift 2 ;;
    --plate)       PLATE="$2"; shift 2 ;;
    --head)        HEAD="$2"; shift 2 ;;
    --grain)       GRAIN="$2"; shift 2 ;;
    --no-identity) IDENTITY=0; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAGICK="$(cd "$HERE/../.." && pwd)/imagemagick-skill/bin/magick.exe"
[ -x "$MAGICK" ] || { echo "error: ImageMagick not at $MAGICK" >&2; exit 1; }

if [ -z "$TIER" ]; then
  if [ -d "$WORK/tryon/final" ] && [ -n "$(ls -A "$WORK/tryon/final"/*.png 2>/dev/null || true)" ]; then
    TIER="final"
  else
    TIER="draft"
  fi
fi

SRC="$WORK/tryon/$TIER"
OUT="$WORK/final"
TMP="$WORK/.tmp-finish"
MASTER="$WORK/model/master.png"

[ -d "$SRC" ] || { echo "error: no $SRC - run tryon-batch.ps1 first" >&2; exit 1; }
mkdir -p "$OUT" "$TMP"

PW="${PLATE%x*}"
PH="${PLATE#*x}"

IFS=',' read -r HX HY HW HH <<< "$HEAD"

echo
echo "Finishing  tier=$TIER  plate=$PLATE  brand=$BRAND  grain=$GRAIN"
if [ "$IDENTITY" = "1" ]; then
  if [ -f "$MASTER" ]; then
    echo "           identity restore ON  (head box $HEAD)"
  else
    echo "           identity restore SKIPPED - no $MASTER" >&2
    IDENTITY=0
  fi
else
  echo "           identity restore OFF"
fi
echo

# --- the head mask, built once ---------------------------------------------
# A soft-edged ellipse. The feather matters: a hard edge shows as a visible
# oval seam across the jaw, which is a worse tell than the soft face it was
# meant to fix.

MASK="$TMP/head-mask.png"
if [ "$IDENTITY" = "1" ]; then
  CX=$(awk "BEGIN{printf \"%d\", ($HX + $HW/2) * $PW}")
  CY=$(awk "BEGIN{printf \"%d\", ($HY + $HH/2) * $PH}")
  RX=$(awk "BEGIN{printf \"%d\", ($HW/2) * $PW}")
  RY=$(awk "BEGIN{printf \"%d\", ($HH/2) * $PH}")
  FEATHER=$(awk "BEGIN{printf \"%d\", $RX * 0.18}")

  "$MAGICK" -size "${PW}x${PH}" xc:black \
    -fill white -draw "ellipse $CX,$CY $RX,$RY 0,360" \
    -blur "0x${FEATHER}" \
    "$MASK"

  "$MAGICK" "$MASTER" -resize "${PW}x${PH}!" -strip "$TMP/master-plate.png"
fi

# --- brand swatch, built once ----------------------------------------------
"$MAGICK" -size "${PW}x${PH}" "xc:$BRAND" "$TMP/brand.png"

count=0

for src in "$SRC"/*.png; do
  [ -e "$src" ] || continue
  name="$(basename "$src")"
  echo "  $name"

  step="$TMP/${name%.png}"

  # 2. upscale to plate -------------------------------------------------------
  "$MAGICK" "$src" -resize "${PW}x${PH}!" -filter Lanczos -strip "${step}-up.png"
  cur="${step}-up.png"

  # 1. identity restore -------------------------------------------------------
  # Applied after the upscale so the master's head lands at full plate
  # resolution rather than being upscaled along with everything else.
  if [ "$IDENTITY" = "1" ]; then
    "$MAGICK" "$cur" "$TMP/master-plate.png" "$MASK" -compose over -composite "${step}-id.png"
    cur="${step}-id.png"
  fi

  # 3. grade ------------------------------------------------------------------
  # Multiply by the brand colour: white maps to exactly the brand background and
  # everything else picks up the same warm grade, so the plate cannot seam
  # against the layout.
  "$MAGICK" "$cur" "$TMP/brand.png" -compose multiply -composite "${step}-graded.png"
  cur="${step}-graded.png"

  # 4. grain ------------------------------------------------------------------
  # Overlay against a mid-grey Gaussian noise layer. Neutral at gray50, swings
  # both ways, applied across the whole plate so the garment cannot be the only
  # noiseless region in the frame.
  if [ "$GRAIN" != "0" ]; then
    "$MAGICK" "$cur" \
      \( -size "${PW}x${PH}" xc:gray50 -attenuate "$GRAIN" +noise Gaussian -colorspace Gray \) \
      -compose overlay -composite \
      -strip "$OUT/$name"
  else
    cp "$cur" "$OUT/$name"
  fi

  dims=$("$MAGICK" identify -format "%wx%h" "$OUT/$name")
  echo "    -> $OUT/$name  ($dims)"
  count=$((count + 1))
done

rm -rf "$TMP"

echo
echo "$count finished to $OUT"
echo
if [ "$IDENTITY" = "1" ]; then
  cat <<'EOF'
Check the identity restore at 200% along the jaw and hairline. If a soft oval
seam is visible, the head box is too small or the feather too tight - widen
--head rather than reducing the feather. If the face sits at a different angle
to the body, the try-on moved the head, which no compositing can fix: that is a
re-run, not a retouch.

EOF
fi
echo "Now build the review sheet and READ IT:"
echo
echo "  bash scripts/sheet.sh $WORK $TIER"
echo
