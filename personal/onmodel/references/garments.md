# Sourcing garments

The garment inputs decide more of the outcome than the model does. Two files
per product, and the second one is the whole reason this pipeline works.

| File | What it is | Required |
|---|---|---|
| `cloth.png` | flat lay or ghost mannequin, garment alone, plain background | yes |
| `reference.png` | **a real person wearing this exact garment** | in practice, yes |

## Pulling from a Shopify storefront

Nearly every Nordic clothing brand runs Shopify, including brando.no. Append
`.json` to any product URL:

```
https://brando.no/products/<handle>          →  the page
https://brando.no/products/<handle>.json     →  title, vendor, variants, images
```

That endpoint gives real titles, real prices, real article numbers and every
image at full resolution. Use it rather than scraping the page — it is faster,
stable, and nothing in the output is invented.

`scripts/fetch-garments.mjs` does this for a list of URLs, downloads every
image, and writes a `picks.json` proposal plus a candidate contact sheet.

Prices come back as decimal strings (`"429.95"`) and Norwegian storefronts
display them as `429,95 kr`. Format at presentation time; store what the API
said.

## Which image is the reference?

The fetch script scores every image by **skin-pixel fraction** — the proportion
of pixels falling in a broad skin hue and saturation band. It is a good
proposal and a bad decision-maker:

| Score | Usually | But also |
|---|---|---|
| Near zero | flat lay | a garment in a skin-adjacent beige, scored low but genuinely on-model |
| Moderate | on-model, full outfit | a wooden hanger or a tan backdrop |
| High | on-model, close crop | a close-up of a hand or a face |

**Always look at the contact sheet before accepting.** The script writes its
guess into `picks.json` precisely so you can correct it by editing one line
rather than re-running anything.

### The bias you have to correct for

Skin fraction ranks the **closest crop** highest, because a tight shot is
mostly face and arms. Close crops are often the *worst* references, because
they are the ones with arms folded across the garment.

A real case, from `brando.no/products/13264769-308427-barn` (Name It Teagan
sweat cardigan), which the fetcher was tested against:

| Image | Skin | What it is | Verdict |
|---|---|---|---|
| 1 | 0% | front flat lay | correct `cloth` |
| 2 | 15% | chest crop, **arms folded across the cardigan** | proposed — but wrong |
| 3 | 0% | back flat lay | no |
| 4–5 | 0% | collar and cuff details | no |
| 6 | 6% | full length, standing, arms clear | **the right reference** |

The tool proposed image 2 on score and image 6 was the better input on every
rule that matters. Scoring 6% and being usable beats scoring 15% and hiding
the garment behind a forearm.

`picks.json` lists the runners-up under `other_on_body_candidates` for exactly
this reason. Switching is a one-line edit.

### Products with no reference at all

Also real, from the same store: `name-it-jok-topp-box-bright-white-barn` has
four images and all four are flat lays — front, back, front again, and a print
detail. There is no worn shot to find, and the fetcher correctly says so rather
than nominating a flat lay as the reference.

When that happens, in order of preference: check whether another colourway of
the same style has a worn shot (the fabric behaves identically); check the
brand's own site rather than the reseller's; or accept a flat-lay-only run and
crop the flat lay so the garment fills roughly the proportion of frame that a
torso would, which at least hints at scale. Say in the result which of these
happened.

That same product also carries a large `BRAWL STARS` chest print — the
gibberish-text failure in `realism.md`. Between no reference and unspellable
chest text, it is a product to shoot rather than transfer.

## What makes a reference good

In descending order of importance:

1. **The target garment is unambiguous.** Nothing worn over it. If the model
   wears the cardigan open over a shirt and you want the shirt, the transfer
   may take the cardigan. Crop it out.
2. **The garment is worn, not floating.** A real body beats a ghost mannequin
   beats a flat lay. Drape is the entire point.
3. **Framing resembles the master.** Head-to-thigh against head-to-thigh. A
   full-length reference against a chest-crop master confuses garment scale.
4. **Front-facing, upright, arms not crossing the garment.** The same rules the
   master obeys.
5. **Even lighting from a direction that matches the master.**
6. **Print fully visible.** A motif half hidden by an arm gives the model half a
   print to reason from.

A reference that violates 1 is worse than no reference. Everything else is a
matter of degree.

## Cropping

Both `cloth.png` and `reference.png` are resized to exactly 3:4 (width:height)
without aspect preservation, so **crop them yourself or they arrive stretched**.
`scripts/prep.sh` does this, but the framing decision is yours:

- **Flat lay:** garment filling most of the frame, small even margin, nothing
  else in shot. Crop out hangers, size tags and shadow pools.
- **Reference:** match the master's crop as closely as the source allows.
  Head-to-thigh if available; chest-to-thigh is acceptable; full-length with the
  garment occupying a fifth of the frame is not.

## Category matters more than you expect

**Check what each product actually is before planning anything around it.** A
list of four "products" from a kidswear site is very often not four tops. The
predecessor project was designed for four tops, received two tops and two pairs
of joggers, and had to be restructured late.

Sort products by body region first:

| Region | Notes |
|---|---|
| Tops | The easy case. One master, one transfer per product. |
| Bottoms | Work, but the master's crop must include mid-thigh or there is nowhere to paint. |
| Full outfits / dresses | Need the master framed to the hem, or the garment is cut off. |
| Outerwear | Hardest. Structured shoulders and closures transfer poorly. Expect to reject some. |
| Accessories, footwear | Out of scope for garment transfer. Composite or shoot them. |

If tops and bottoms are mixed, the natural structure is **building an outfit**
rather than dressing and undressing — change the top in one beat, the trousers
in the next, keeping what came before. It reads as styling rather than as a
costume change, and it sidesteps having to transfer two regions at once.

Transferring a top and bottom **simultaneously** in one pass is unreliable. Run
them as two sequential passes: transfer the top, then feed that result back in
as the person image for the trousers.

## Rights

Storefront product photography belongs to the brand or its suppliers. Using it
as a *reference input* for imagery advertising that same brand's products is
ordinary practice; using a competitor's photography, or any of it for something
other than selling those products, is not. If the client is not the rights
holder, ask before it ships.
