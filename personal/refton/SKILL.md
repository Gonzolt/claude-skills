---
name: refton
description: "Virtual try-on with RefTon (CVPR 2026) — put a specific garment onto a specific person, locally, using FLUX.1-Kontext-dev plus the qihoo360 RefVTON LoRA. Its distinguishing feature is an optional reference photo of someone else wearing the same garment, which preserves fabric texture, drape and print far better than a flat product shot alone. Use for: virtual try-on, dress this person in this garment, garment swap on a model photo, e-commerce on-model imagery, VITON-HD/DressCode inference or training."
argument-hint: "[setup|weights|tryon] --cloth <img> --person <img> [--reference <img>]"
metadata:
  version: "1.0.0"
  upstream: "https://github.com/360CVGroup/RefTon"
  paper: "https://arxiv.org/abs/2511.00956"
  weights: "https://huggingface.co/qihoo360/RefVTON"
---

# RefTon — reference-assisted virtual try-on

Upstream repo vendored at `repo/`. RefTon is a **LoRA on FLUX.1-Kontext-dev**,
not a standalone model: the backbone is downloaded separately and the ~200 MB
LoRA steers it.

Machine profile: Windows 11, RTX 5070 (12 GB, Blackwell/sm_120), Python 3.11.

## Read before doing anything

| Situation | Read first |
|---|---|
| Nothing installed yet | `references/setup.md` |
| Preparing user photos | `references/inputs.md` — **the thing that decides quality** |
| Running a batch / benchmark | `references/running.md` |
| Fine-tuning on new data | `references/training.md` |

## What makes it different

Three conditioning images, and the third is the point:

| Input | Role | Required? |
|---|---|---|
| `cloth` | the garment to put on — flat product shot | **always** |
| `person` *or* `agnostic` | the target person; `person` = ordinary photo wearing something else, `agnostic` = photo with the garment region masked out | one of the two |
| `image_ref` | **someone else wearing that same garment** | optional, and the reason to use RefTon |

A flat product shot cannot show how a fabric drapes, how sheer it is, or how a
print sits on a body. The reference image supplies exactly that. If the user
has one, use it (`--reference`). If they don't, RefTon still runs and behaves
like a strong Kontext try-on — say which mode was used in the result.

`person` mode is the one to reach for with real user photos: it needs no mask.
`agnostic` mode is for benchmark data (VITON-HD, DressCode) that ships
pre-masked images.

## Quick reference

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

```bash
powershell -ExecutionPolicy Bypass -File scripts/fetch_weights.ps1
```

```bash
python scripts/tryon.py --cloth shirt.jpg --person model.jpg --reference worn.jpg --out result.png
```

`scripts/tryon.py` is a single-image wrapper over the repo's own pipeline and
dataset code — it stages a temp dataset dir in the layout RefTon expects, so
arbitrary file paths and names work. For benchmark runs use upstream
`inference.py` directly (see `references/running.md`).

## Workflow

1. **Env check.** No `repo/.venv` → run `setup.ps1` (~10 GB, ~15 min). No LoRA
   in `weights/` → run `fetch_weights.ps1` (~31 GB, almost all of it the
   Kontext backbone, which is a **gated** HF repo needing `HF_TOKEN` and an
   accepted licence).
2. **Vet the inputs against `references/inputs.md` before generating.** Bad
   crops and mismatched aspect ratios cause more failures here than any
   parameter. Fix the inputs; do not compensate with settings.
3. **Pick the resolution.** `512×384` (LoRA `512_384_*.safetensors`,
   `--cond-scale 1.0`) is the default and what fits comfortably. `1024×768`
   (LoRA `1024_768_*.safetensors`, `--cond-scale 2.0`) is sharper and much
   heavier — try it only after a 512 pass looks right.
   **The LoRA file and the resolution must match.** Mixing them degrades
   output in ways that look like a bad prompt.
4. **Run**, confirm the file exists, and report which mode (person/agnostic,
   with/without reference) produced it.
5. **Iterate on inputs, not seeds.** If the garment identity is wrong, the fix
   is almost always a better reference image or a tighter garment crop.

## VRAM reality

Same arithmetic as the FLUX skill: Kontext is a 12B transformer, ~24 GB in
bf16, on a 12 GB card. `scripts/tryon.py` therefore defaults to **NF4
quantization + model CPU offload**. Expect ~2–4 min per image at 512×384 after
a ~1–2 min load.

Upstream's `inference.py` does `pipe.to(device)` in bf16 and **will OOM here**
regardless of `accelerate launch` settings — its commands assume 8× datacenter
GPUs. Don't run it unmodified on this box and don't predict that it will work;
`references/running.md` has the low-VRAM route.

One caveat worth stating up front: applying a LoRA on top of a 4-bit
quantized transformer occasionally fails inside peft depending on version. If
`load_lora_weights` errors, that is the cause — fall back to
`--quant bf16 --offload sequential` (slow, several minutes, but it fits) rather
than silently dropping the LoRA. A run without the LoRA is not RefTon.

## Licensing and use

- RefTon code: check `repo/` — upstream ships no top-level LICENSE file, so
  treat reuse beyond research as needing the authors' say-so.
- The backbone, **FLUX.1-Kontext-dev**, is under the FLUX.1-dev
  **Non-Commercial License**. Try-on images for a real shop are commercial use
  and need a BFL licence. Raise this once if the context is commercial, then
  proceed.
- VRF / VITON-HD / DressCode datasets carry their own research-only terms and
  are not redistributed by upstream.

Try-on puts a real, identifiable person into generated imagery. Only run it on
photos the user has the right to use, and don't produce revealing or intimate
imagery of a real person from their photo.
