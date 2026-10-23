# Why not just generate or composite it

Read this before proposing a cleverer route. All three alternatives were tried
on this brand and each failed in a specific, reproducible way.

## 1. Compositing a flat lay onto a body

**Fails on pose, not on quality.** Flat lays are shot straight-on with the
sleeves held out wide; a standing child's arms hang at their sides. Scale the
garment so its torso matches hers and the sleeves splay into empty background.
Scale it so the sleeves match and the torso is far too small. **No single scale
satisfies both**, because the garment and the body are in different poses.

The collar also lands across the chin, and any opacity below 1 lets the
original garment read through.

## 2. Retexturing a garment she already wears

Mask the jumper she's wearing, paint the product's print into that shape. This
genuinely works better than compositing, and it is still a dead end: it can
only ever produce **her original garment in a new colour**. Wrong silhouette,
no placket, no collar, no real sleeves, no correct hem. A crew-neck knit cannot
become a zip hoodie by changing its pixels.

It also costs an enormous amount of fiddly work — two skin thresholds, hand-
tuned hand boxes, feathered edges, life-size print scaling — for a result that
is structurally capped.

## 3. AI virtual try-on

Technically the right answer, and ruled out here by cost and constraints: it
needs ~55 GB of model weights on the machine, and the only model that does
reference-assisted try-on well is a LoRA on FLUX.1-Kontext-dev, whose licence
is non-commercial. Shipping a campaign on it requires a paid BFL licence.

If those constraints ever lift, the `onmodel` skill already implements this
route properly, and `~/.claude/skills/onmodel/references/realism.md` carries its
failure taxonomy.

## What actually works

Photograph the child in the clothes. It is faster than all three, free, higher
quality than any of them, and the drape is correct because it is real drape.

The instinct to solve this in software is strong and it is wrong. Thirty
minutes with a phone beats thirty hours of masking.
