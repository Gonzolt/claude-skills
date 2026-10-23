# When a frame looks wrong

**Fix inputs, not settings.** Almost every problem here is a shooting or
sourcing problem with a name. Grading never repairs a bad crop.

## Symptom → cause

| Symptom | Actual cause | Fix |
|---|---|---|
| Four scenes look like four different days | Shot across sessions, or mixed light sources | Reshoot in one sitting. Prep can match colour, never shadow direction. |
| Garment looks short and wide | Camera above the child's chest height | Crouch to chest height. |
| Every white garment reads grey-green | Overhead room lights | Window light only, flash off. |
| Child pops but background is distractingly sharp | Child stood too close to the wall | 1.5 m of separation. |
| Silhouette unreadable | Arms hanging against the torso | Arms slightly out, hands clear of the body. |
| Fabric looks flat and plasticky | Phone HDR on, or a filter baked in | HDR off, hand over unedited originals. |
| Face blown out or garment blown out | Auto-exposure metered on the wrong thing | Tap-hold to lock exposure on the garment. |
| Cut feels like a slideshow | Stills held still, or linear pans | Handheld drift + an internal cut per look. |
| Nobody watches past 1 s | Opening on a static hero | Lead with the motion frame. |

## ImageMagick traps

The binary is **not on PATH**: `~/.claude/skills/imagemagick-skill/bin/magick.exe`.
Every script here resolves it explicitly; never assume bare `magick` works.

It is a **Q16-HDRI** build, which changes two things:

- `-level 140,255` is read against 0–65535, not 0–255 — both numbers land in
  the bottom half-percent and the image blows to white. **Use percentages.**
- `%[fx:mean]` over a masked image counts transparent pixels as black, so a
  reading taken that way comes out far too low and sends you tuning the wrong
  direction. Measure on a solid patch.

A `colors.xml` configure warning on stderr is harmless; output is still
correct.

## PowerShell traps

Both of these cost an hour each in the predecessor project:

- `$mask[$x - 1, $y]` does **not** index at `x-1, y`. The comma binds first, so
  it evaluates `$x - @(1, $y)` and fails with *"does not contain a method named
  'op_Subtraction'"*. Write `$mask[($x - 1), $y]`.
- **Variables are case-insensitive.** `foreach ($h in $HANDS)` silently
  destroys `$H` set a hundred lines earlier, and it fails much later and
  nowhere near the mistake.

## Node / fetch

`products.json` on a collection is paginated at 250 max; pass `page=2,3,…`.
An empty `products` array usually means a wrong collection handle, not an
empty collection — check `collections.json` for the real handle.
