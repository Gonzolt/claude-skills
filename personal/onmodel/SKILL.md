---
name: onmodel
description: "Photoreal on-model clothing imagery, generated locally and free. Casts an AI model at any specified age with FLUX, then dresses them in real garments with RefTon, using the storefront's own on-model photography as the fabric reference so the clothes read as worn rather than pasted on. Use for clothing and fashion advertising stills, kidswear or adult campaigns, virtual try-on that has to survive full-screen, Shopify/brando.no product sourcing, and any request phrased as 'make it look like the model is actually wearing it, not an overlay'."
argument-hint: "[doctor | garments <product-url> | cast | tryon | finish | sheet]"
metadata:
  version: "1.0.0"
  builds-on: ["flux", "refton", "imagemagick-skill"]
---

# onmodel — clothes that read as worn

Produces **stills**: one consistent AI person, photographed once, wearing each
real garment. What happens to those stills afterwards — Remotion, print, a
carousel — is not this skill's business.

## The one idea

Everything else is detail:

> **The garment reference is a photo of a real person wearing that exact
> garment. Not a flat lay.**

A flat lay is a garment with the body taken out of it. It cannot say how the
fabric falls at the elbow, how the hem sits over the hip, how sheer it is
against skin, or how big the print reads at chest width. A model asked to
transfer a flat lay has to *invent* all of that, and invented drape is exactly
what the eye reads as "pasted on". RefTon's reference branch (`--reference`)
exists to supply it, and a Shopify storefront ships one on nearly every product
page for free.

Run without a reference and this is a competent Kontext try-on — which is the
thing the user already rejected. **Always find the reference.**

## Read before doing anything

| Situation | Read first |
|---|---|
| Choosing or writing the person prompt | `references/casting.md` |
| Sourcing garments from a storefront | `references/garments.md` |
| Judging a result, or fixing a bad one | `references/realism.md` — **the reason this skill exists** |
| A run failed, OOMed, or looks wrong | `references/troubleshooting.md` |

## Machine state

Windows 11, RTX 5070 (12 GB, sm_120). Verified 2026-08-25:

- **RefTon env: installed and working.** `~/.claude/skills/refton/repo/.venv`,
  torch 2.11.0+cu128, diffusers 0.40.0, peft 0.20.0, bitsandbytes 0.50.1.
- **FLUX env: not installed.** Not required — `scripts/cast.py` runs on the
  RefTon venv, which already carries diffusers and bitsandbytes. Installing the
  flux skill's own venv costs ~10 GB and buys nothing here.
- **Weights: not downloaded.** This is the only blocker. See `doctor`.
- **ImageMagick:** `~/.claude/skills/imagemagick-skill/bin/magick.exe`, not on
  PATH. Every script here resolves it; never assume bare `magick` works.

Run `doctor` first, every session. Report what it says rather than guessing.

```bash
powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1
```

## The pipeline

Five stages. Each writes files; the next reads them. Nothing is generated at
assembly time.

```text
storefront ──▶ garments/<slug>/raw/*            every product image  (stage 1)
                       │
                       ├── picks.json           which is cloth, which is reference
                       │
              prep ────┴──▶ cloth.png           3:4, 768x1024        (stage 2.5)
                            reference.png
                                    │
FLUX schnell ──▶ model/master.png   │           one person           (stage 2)
                       │            │
                  prep ┴──▶ master-prepped.png
                       │            │
                       └──▶ RefTon ─┴──▶ tryon/<tier>/<slug>.png     (stage 3)
                                              │
                identity + grade + grain ─────┴──▶ final/<slug>.png  (stage 4)
                                                        │
                          review sheet ────────────────┴──▶ judge    (stage 5)
```

### 1. Garments

```bash
node scripts/fetch-garments.mjs <product-url> [more urls...] --out <workdir>
```

Pulls `<store>/products/<handle>.json`, downloads every image, and scores each
one for skin-pixel fraction to propose which are on-model and which are flat
lays. **It proposes; you confirm by looking.** Writes a `picks.json` to edit and
a contact sheet of the candidates.

Read `references/garments.md` before accepting the proposal — picking the wrong
reference is the most expensive mistake in this pipeline, because everything
downstream inherits it and it presents as a model problem.

### 2. Cast

```bash
powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work <workdir> -Age 7 -Subject girl
```

Generates the person once. Every garment is then tried on **this same file**, so
identity cannot drift between outfits.

Three casting constraints are non-negotiable, and `references/casting.md`
explains why each is load-bearing:

- **Arms clear of the torso**, slightly bent, hands away from the body.
- **A plain, close-fitting, mid-grey base layer.** Not a bulky knit.
- **Head-to-thigh framing in a 3:4 portrait crop** (width:height).

Judge this frame hard before continuing. Face, hair, pose, framing and lighting
are fixed from here — every later stage inherits them, and re-casting after ten
try-ons means redoing the ten try-ons.

### 2.5. Prep

```bash
bash scripts/prep.sh <workdir>            # pads to 3:4, the safe default
bash scripts/prep.sh <workdir> --crop     # when padding leaves the garment too small
```

Not optional, and easy to skip because nothing errors without it. **RefTon
resizes every input to exactly 3:4 without preserving aspect ratio**, so a
square flat lay arrives stretched — and a stretched garment transfers as a
stretched garment. It is one of the quieter reasons a result looks wrong
without looking like anything in particular.

Padding is the default because it cannot destroy part of a garment; the pad
colour is sampled from the image's own corner, so a flat lay on white pads with
that same white and leaves no edge for the model to read as a garment boundary.

### 3. Try-on

```bash
powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work <workdir>
```

Draft pass at 512×384 for every garment first, then `-Final` for 1024×768 on the
ones that survive. Roughly 2–4 min per image at 512, 3–4× that at 1024.

Never run the final pass on a garment whose draft is wrong. The fix for a wrong
draft is a better reference or a tighter crop — **not** more steps, not a new
seed, not more guidance. `references/realism.md` maps each symptom to its cause.

### 4. Finish

```bash
bash scripts/finish.sh <workdir>
```

Four repairs, in order, each closing a specific tell:

1. **Identity restore** — the master's head is composited back through a
   feathered mask. The person never moved, so this is exact. It makes the face
   pixel-identical across every outfit *and* keeps it at master sharpness
   instead of upscaled-diffusion sharpness.
2. **Upscale** to plate size.
3. **Grade** to the brand background, so a white studio sweep does not seam
   against a warm layout colour.
4. **Grain**, matched and applied across the whole plate. A real photograph has
   sensor noise; a diffusion output has none. Unifying the grain is one of the
   strongest "this is a photo" cues available, and almost nobody does it.

### 5. Judge

```bash
bash scripts/sheet.sh <workdir>
```

Builds `<workdir>/review/sheet.png`: reference, flat lay and result at matched
scale, plus 200% crops of the neckline, cuff and hem.

**This is the gate. Read the sheet before reporting success, every time.** It is
this skill's equivalent of the mask-debug PNG that caught every problem in the
predecessor project — including the two that shipped anyway because nobody
looked at it.

## Running order

```bash
powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1

node scripts/fetch-garments.mjs <url> <url> <url> --out ./work
#   -> open every garments/<handle>/sheet.png and correct picks.json

powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work ./work -Age 7 -Subject girl -Count 6
#   -> open model/candidates.png, pick on pose first
powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work ./work -Pick 3

bash scripts/prep.sh ./work

powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work ./work
bash scripts/sheet.sh ./work draft
#   -> judge. Fix inputs for anything wrong. Only then:

powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work ./work -Final
bash scripts/finish.sh ./work
bash scripts/sheet.sh ./work --final
```

Both GPU scripts — `cast.ps1` and `tryon-batch.ps1` — take `-DryRun`. **Use it
before any GPU run**, every time. It
prints the assembled command line without loading a model, and a four-minute
load that ends in an argument error is an expensive way to find a typo. That is
exactly how the locale bug in `troubleshooting.md` was caught.

## Rules that decide whether it works

The full failure taxonomy is in `references/realism.md`. The short version:

- **Fix inputs, never settings.** Wrong garment identity is a reference problem
  most of the time. Seeds and step counts do not repair a bad crop.
- **The base layer's silhouette bleeds through.** A bulky jumper in the master
  leaves bulky-jumper shoulders under a t-shirt. Cast plain and close-fitting.
- **Occlusion over the torso is the top failure source.** Hands, hair, a bag
  strap. Fix it at casting; it cannot be fixed at try-on.
- **Garment text and logos come out as gibberish.** Diffusion cannot spell.
  Either choose products without chest text, or composite the real logo back in
  at stage 4 — a real asset, correctly warped, beats a hallucinated one.
- **Match the light direction** between person and reference. A garment lit from
  the right on a face lit from the left is uncanny before it is anything else.

## Licensing — state this once, then proceed

Free to run is not free to ship.

- **Casting** uses `FLUX.1 [schnell]` by default — **Apache-2.0**, commercially
  clean. Keep it that way for client work.
- **Try-on** is RefTon, a LoRA on **FLUX.1-Kontext-dev**, which is the
  **FLUX.1-dev Non-Commercial License**. A live campaign needs a paid BFL
  licence (https://bfl.ai/pricing/licensing). There is no free commercial route
  for this stage — RefTon exists only on Kontext.
- RefTon's repo ships no LICENSE file, so its code has no stated grant beyond
  research use. Worth settling with the authors before a campaign ships.

Two things to raise with the client once, factually, then drop:

- Many ad platforms and retailers now require **disclosure that a model is
  AI-generated**. Check the placement's rules before delivery.
- Norway's Marketing Act carries a labelling requirement for advertising with
  **retouched or manipulated body appearance**. Whether a fully synthetic model
  falls inside it is genuinely unsettled — verify with the client's legal
  contact rather than assuming either way.

## Honesty rules

- Report wall-clock time and the actual output path. Confirm files exist.
- Say which mode produced a result: with or without `--reference`, and at which
  resolution. A run without the reference is not the thing that was asked for.
- If a run OOMs, quote the CUDA error and go to `references/troubleshooting.md`.
  Do not silently drop to 512 and present it as the plan.
- If `load_lora_weights` fails, that is the known peft-on-NF4 issue. Fall back to
  `--quant bf16 --offload sequential` (slow, but it fits). **A run without the
  LoRA is not RefTon** — never present one as a try-on.
- Never claim a result looks good without having built and read the contact
  sheet.
