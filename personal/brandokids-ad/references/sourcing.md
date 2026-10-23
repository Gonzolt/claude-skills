# Sourcing products from brando.no

## The endpoint

Shopify exposes structured JSON. **Use it; never scrape the page.**

```bash
curl -s "https://brando.no/products/<handle>.json"     # one product
curl -s "https://brando.no/collections/<handle>/products.json?limit=50&page=1"
```

`<handle>` is the last path segment of a product URL. The response carries the
real title, `variants[].price`, every image with dimensions, and `tags`.

For a single product, `https://brando.no/products/<handle>.js` (note `.js`)
additionally returns `media[].media_type` — worth checking, though as of the
2026-08 audit **no kids product carries video**. Stills only.

Useful tags: `brandokids`, and `Jente` / `Gutt` for gender.

## Prices must be real

`variants[0].price` is a decimal string, e.g. `"359.95"`. The storefront
formats Norwegian style: `359,95 kr` — comma decimal, space before `kr`.
`scripts/fetch-products.mjs` does this conversion; don't hand-format.

A previous cut shipped invented prices (199 / 249 / 179 kr). Never again.

## Which images you may use

The catalogue's photography splits three ways, and the split matters:

| Kind | Use in an ad? |
|---|---|
| **Garment-only** — flat lay, ghost mannequin, hanger, fabric detail | **Yes.** No person, no release needed. |
| **On-model, brand campaign** (Name It, Lil' Atelier) | Only with the brand's permission. It is their licensed model. |
| **On-model, customer-submitted** (27 KIDS) | **No.** Real identifiable children, no model release. |

`scripts/check-images.mjs` sorts them and flags the risky ones. It proposes;
**you confirm by looking at the contact sheet.**

## Vendor reality (measured 2026-08-25, 320 images / 111 products)

On-model photography is a minority and is decided by the vendor, not the
product:

- **Abercrombie Kids, Hummel, Levi's, Tommy, Jack&Jones** — ghost mannequin
  only, zero on-model.
- **NAME IT** — ~24% on-model, genuine campaign quality, a different child per
  product.
- **Lil' Atelier** — campaign quality but sparse; the general catalogue is
  mostly baby flat lay.
- **27 KIDS** — effectively all on-model, but amateur customer snapshots plus
  AI-generated studio shots.

**Consequence for this skill:** garment-only imagery is abundant and safe,
which is exactly what the pipeline needs, because the worn frames come from
your own shoot.

## The AI watermark

27 KIDS images carry a circular badge reading `GENERATED WITH AI BY REAL
HUMANS`, usually bottom-right, black line art. It is easy to miss at thumbnail
size and obvious at 100%. `check-images.mjs` flags likely candidates by
detecting high-frequency dark line content in the corner regions; confirm by
eye at full size, then crop it out or drop the image.

## Do not auto-trust people-detection

The obvious heuristic — fraction of skin-toned pixels — **does not work**. Warm
beige and dusty-pink garments and fabric close-ups false-positive hard: in the
audit, only about 5 of the top 20 scoring images actually contained a person.
The scripts here score and sort, but a human confirms every classification from
the contact sheet.
