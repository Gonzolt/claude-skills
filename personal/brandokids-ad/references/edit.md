# Cutting the ad

Vertical 1080×1920, 30 fps. Default 12 s (360 frames) for four products;
15 s if the products need room to breathe.

## The register, concretely

Social-native, not broadcast. The difference is specific:

| Do | Don't |
|---|---|
| Jump cuts on the beat | Crossfades and dissolves |
| Sticker captions that pop on in 3 frames | Kinetic typography that animates for a second |
| Slight handheld drift (0.3–0.8% scale, slow) | Locked-off frames or smooth Ken Burns pushes |
| Hard cut to the next garment | Morphs, wipes, "magic" outfit changes |
| Price as a plain tag | An animated price reveal |

The handheld drift matters more than it sounds. A perfectly still photograph
reads as a photograph; the same frame with a slow irregular drift reads as
video. Use a low-frequency noise offset, not a linear pan — linear reads as a
slideshow.

## Structure

```text
0.0–1.0s   HOOK      strongest motion frame, caption lands by frame 15
1.0–3.5s   LOOK 1    hero, cut to detail at ~2.4s
3.5–6.0s   LOOK 2
6.0–8.5s   LOOK 3
8.5–11.0s  LOOK 4
11.0–12.0s END CARD  wordmark, "Find your style", products + real prices
```

**The first second decides everything.** Sound-off, thumb-scrolling: if the
hook frame isn't moving and legible by frame 15, the rest never plays. Lead
with the motion frame, never the hero.

Each look gets two frames — hero, then detail — because a single still held
2.5 s dies. The internal cut is the difference between a film and a carousel.

## Captions

Sound-off legible is the whole requirement.

- Short. Three or four words. "Myk. Varm. Klar for skolen."
- Norwegian, matching the storefront's own voice.
- High contrast against the frame behind them, checked properly — use the
  **color-skill** for contrast ratios. A previous cut shipped a kicker at
  2.03:1 against white when 4.5:1 was needed; `#A2632F` cleared it at 4.81:1
  in the same warm family.
- Position in the middle third. The top is covered by platform UI and the
  bottom by captions and the CTA.
- Pop on in 3 frames with a small overshoot. No fades.

## Timing traps

**A transition is spent inside the outgoing sequence.** If you use Remotion's
`TransitionSeries`, a cut does not land where the arithmetic suggests: give the
first and last scenes `T/2` extra frames and every middle scene `T`. The
padding adds `(N−1)·T` and the overlaps remove the same, so total duration is
unchanged and each cut lands on the second it belongs to.

For this register, prefer plain hard cuts — no transition, no arithmetic.

## Product data on screen

Real title, real price, from `products.json`. Norwegian format: `359,95 kr`.
Truncate long titles at the colour name — `NAEL WAFFLE GENSER`, not
`NAEL WAFFLE LANGERMET GENSER - SESAME`.

## Rendering

```bash
cd work/video && npm run render
```

Check the output plays and is the right duration before reporting done. State
the real path and the wall-clock time.
