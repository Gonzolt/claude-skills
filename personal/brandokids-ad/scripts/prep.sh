#!/usr/bin/env bash
# Normalise phone frames into a cut that hangs together.
#
# Matching is done on the BACKGROUND WALL, never the whole frame: the wall was
# lit by one light and should read identically everywhere, while the garments
# are legitimately different colours. Matching whole-frame means would drag a
# black cardigan and a blue jumper towards each other and wash out the very
# thing the ad is selling.
#
# Usage: bash prep.sh ./work [--ref <file>]
set -euo pipefail

WORK="${1:-./work}"
MAG="$HOME/.claude/skills/imagemagick-skill/bin/magick.exe"
[ -x "$MAG" ] || { echo "ImageMagick not found at $MAG" >&2; exit 1; }

RAW="$WORK/raw"
OUT="$WORK/shots"
[ -d "$RAW" ] || { echo "No $RAW — put the shoot's photographs there first." >&2; exit 1; }

shopt -s nullglob nocaseglob
FILES=("$RAW"/*.jpg "$RAW"/*.jpeg "$RAW"/*.png)
shopt -u nocaseglob
[ ${#FILES[@]} -gt 0 ] || { echo "No images in $RAW" >&2; exit 1; }

mkdir -p "$OUT"

# Neutral patch: the two top corners, which are wall above the child's
# shoulders in the framing shooting.md specifies.
patch() {
  "$MAG" "$1" -auto-orient -gravity north -crop 100%x16%+0+0 +repage \
    -gravity west  -crop 28%x100%+0+0 +repage -resize 1x1! -colorspace sRGB \
    -format "%[fx:mean.r*255] %[fx:mean.g*255] %[fx:mean.b*255]" info:
}

declare -A PR PG PB
for f in "${FILES[@]}"; do
  read -r r g b <<< "$(patch "$f")"
  PR["$f"]=$r; PG["$f"]=$g; PB["$f"]=$b
done

# --- reference frame ----------------------------------------------------------
REF=""
if [ "${2:-}" = "--ref" ] && [ -n "${3:-}" ]; then
  REF="$3"
  [ -f "$REF" ] || { echo "reference not found: $REF" >&2; exit 1; }
else
  # median wall luminance — a frame in the middle of the spread, so no single
  # badly-exposed shot drags the whole cut with it
  REF=$(for f in "${FILES[@]}"; do
          awk -v r="${PR[$f]}" -v g="${PG[$f]}" -v b="${PB[$f]}" -v n="$f" \
              'BEGIN{printf "%.3f\t%s\n", (r+g+b)/3, n}'
        done | sort -n | awk -v n="${#FILES[@]}" 'NR==int((n+1)/2){print $2}')
fi
echo "reference frame: $(basename "$REF")"
printf '  wall neutral   R=%.0f G=%.0f B=%.0f\n' "${PR[$REF]}" "${PG[$REF]}" "${PB[$REF]}"
echo

# gain to bring a channel onto the reference, clamped so a frame with a
# non-wall corner (a curtain, a door) cannot blow the whole image out
gain() { awk -v a="$1" -v b="$2" 'BEGIN{
  if (b <= 2) { print "1.0000"; exit }
  g = a / b; if (g < 0.70) g = 0.70; if (g > 1.45) g = 1.45; printf "%.4f", g }'; }

n=0; clamped=0
for f in "${FILES[@]}"; do
  base="$(basename "${f%.*}")"
  dest="$OUT/$base.jpg"

  GR=$(gain "${PR[$REF]}" "${PR[$f]}")
  GG=$(gain "${PG[$REF]}" "${PG[$f]}")
  GB=$(gain "${PB[$REF]}" "${PB[$f]}")

  hit=""
  for g in "$GR" "$GG" "$GB"; do
    case "$g" in 0.7000|1.4500) hit=" <- CLAMPED";; esac
  done
  [ -n "$hit" ] && clamped=$((clamped+1))

  "$MAG" "$f" \
    -auto-orient \
    -channel R -evaluate multiply "$GR" \
    -channel G -evaluate multiply "$GG" \
    -channel B -evaluate multiply "$GB" +channel \
    -resize "1080x1920^" -gravity north -extent 1080x1920 \
    -attenuate 0.35 +noise Gaussian \
    -quality 95 "$dest"

  n=$((n+1))
  printf '  %-40s  x%s / x%s / x%s%s\n' "$base" "$GR" "$GG" "$GB" "$hit"
done

echo
echo "$n frame(s) -> $OUT"
if [ "$clamped" -gt 0 ]; then
  echo
  echo "! $clamped frame(s) hit the gain clamp. Either the top corners are not"
  echo "  wall in those frames, or they were shot in different light. Check the"
  echo "  sheet — if they look wrong, that is a reshoot, not a grade."
fi
echo "Next: bash scripts/sheet.sh $WORK   <- read it before building"
