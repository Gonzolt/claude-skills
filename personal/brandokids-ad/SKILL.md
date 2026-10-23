---
name: brandokids-ad
description: "Build a social-native vertical clothing ad for Brando Kids from photographs the user shoots themselves — one real child, in the real garments, on a phone. Handles brando.no product sourcing (Shopify JSON: titles, real prices, imagery), shot-listing and lighting for a UGC register, normalising phone frames into a consistent cut, and Remotion assembly with handheld motion and sticker captions. Use for kidswear advertising, Brando Kids spots, UGC/social ad cuts, product-video from stills, and any request phrased as 'make it look like the model is actually wearing it, not an overlay'."
argument-hint: "[products <url...> | shotlist | prep | sheet | build]"
metadata:
  version: "1.0.0"
  builds-on: ["imagemagick-skill", "color-skill"]
---

# brandokids-ad — a real child, in the real clothes

Produces a **vertical social ad** whose every worn-garment frame is a genuine
photograph: one real child, wearing the actual product, shot on a phone.

## The one idea

> **Don't fake the wearing. Photograph it.**

Every previous attempt at this failed the same way. Compositing a flat lay onto
a body fails because the garment and the body are in different *poses* — scale
the torso to fit and the sleeves splay into empty background; scale the sleeves
and the torso is far too small. Retexturing a garment the child already wears
can only ever produce *her original garment in a new colour*: wrong silhouette,
no placket, no collar, no real sleeves. Both roads end in "overlay".

Thirty minutes with a phone and the actual clothes beats every one of them, and
it is the only route that also gives one consistent child, true drape, and
clean rights. See `references/why-not-synthesis.md` before proposing anything
cleverer.

## Read before doing anything

| Situation | Read first |
|---|---|
| Planning or briefing the shoot | `references/shooting.md` — **the highest-leverage file here** |
| Sourcing products, prices, garment-only imagery | `references/sourcing.md` |
| Cutting, timing, captions, motion | `references/edit.md` |
| Tempted to generate or composite a garment | `references/why-not-synthesis.md` |
| A frame looks wrong and you're reaching for settings | `references/troubleshooting.md` |

## The register

The user chose **UGC / social-native**, not polished Scandinavian-minimal. This
is a deliberate constraint, not a fallback, and it changes every decision:

- Phone-shot look is **correct**. Slight handheld drift, natural window light,
  a real room. Do not grade it into a studio campaign — that lands in the
  uncanny middle where it reads as neither.
- Jump cuts, not crossfades. Sticker-style captions, not kinetic typography.
- Vertical 1080×1920, sound-off legible, hook inside the first second.

The one thing that must *not* look casual is the garment: it has to be clean,
uncreased, and correctly lit. The clothes are the product; the film is not.

## Rights — settle this once, then proceed

- **The child you photograph:** you need the parent's written consent to use
  the images in advertising. If that is your own child, write it down anyway —
  Norwegian åndsverkloven §104 requires consent to publish identifiable
  photographs, and GDPR adds to it for minors.
- **brando.no imagery of other people's children** (notably 27 KIDS, whose
  product photography is customer-submitted): **do not use in an ad.** Those
  families gave no model release. Garment-only frames — hanger shots, flat
  lays, fabric details — carry no such problem and are fair game.
- **27 KIDS imagery is partly AI-generated**, stamped `GENERATED WITH AI BY
  REAL HUMANS` in a corner badge. `scripts/check-images.mjs` flags it. Crop or
  avoid; never present it as photography.
- Prices and product names come from the storefront and must be **real**. A
  previous cut shipped invented prices; don't repeat that.

## The pipeline

Five stages. Each writes files the next one reads.

```text
brando.no ──▶ products.json + garment-only imagery      (1. source)
                       │
       shot list ──────┴──▶ shoot the child on a phone  (2. shoot)
                                     │
                 raw/*.jpg ──────────┘
                       │
              prep ────┴──▶ shots/<slug>-{hero,detail}.jpg   (3. prep)
                                     │
              review sheet ──────────┴──▶ judge         (4. sheet)
                                     │
              Remotion ──────────────┴──▶ out/*.mp4     (5. build)
```

### 1. Source

```bash
node scripts/fetch-products.mjs <product-url> [more...] --out ./work
```

Pulls `<store>/products/<handle>.json` — real title, real variant price, every
image. Sorts images into `people/` and `garment-only/` and writes
`products.json`. Read `references/sourcing.md`; the Shopify JSON endpoint beats
scraping the page, and the `Jente`/`Gutt` tags carry gender.

```bash
node scripts/check-images.mjs ./work      # flags AI watermarks + people
```

### 2. Shoot

```bash
node scripts/shotlist.mjs ./work          # writes work/SHOTLIST.md
```

Generates a printable shot list from the sourced products: per garment, a hero
and a detail, plus the frames the edit needs. **Hand this to whoever is
shooting.** `references/shooting.md` carries the lighting and styling rules —
one location, one time of day, one outfit change at a time, and why shooting
all four garments in a single session is not optional.

### 3. Prep

```bash
bash scripts/prep.sh ./work
```

Normalises phone frames into a cut that hangs together: 9:16 crop at a
consistent framing, white-balance match across garments, exposure match, and a
shared grain. Skipping this is what makes four real photos still look like four
different photos.

### 4. Judge

```bash
bash scripts/sheet.sh ./work
```

Builds `work/review/sheet.png` — every prepped frame at matched scale, plus
100% crops of neckline, cuff and hem. **This is the gate. Read it before
reporting anything as done.** Every problem in the predecessor project showed
up in its debug sheet first, including the two that shipped anyway because
nobody looked.

### 5. Build

```bash
node scripts/scaffold.mjs ./work --name brandokids
cd work/video && npm i && npm run render
```

Scaffolds a Remotion project wired to `products.json` and the prepped frames.
`references/edit.md` carries the timing, the caption grammar and the motion —
including why a transition is spent inside the *outgoing* sequence and how that
shifts every cut point.

## Rules that decide whether it works

- **Fix inputs, not settings.** A frame that reads wrong is nearly always a
  shooting problem with a name in `references/troubleshooting.md`. Grading
  never repairs a bad crop or a creased garment.
- **One session, one location, one light.** Four garments shot across two days
  will not cut together, and no amount of matching in prep recovers it.
- **Never invent a price or a product name.** Pull both from the JSON.
- **Never composite a garment onto a body.** If a garment wasn't photographed
  on the child, it doesn't get a worn frame — use a garment-only shot instead.
- **Sound-off legible.** Every claim that matters must survive muted playback.

## Honesty rules

- Report the real output path and wall-clock render time; confirm files exist.
- Say which frames are photographs of the child and which are garment-only
  catalogue imagery. Never blur that line.
- If a garment never got a usable worn frame, say so plainly rather than
  quietly substituting a flat lay and calling the scene done.
- Never claim a cut looks good without having built and read the review sheet.
