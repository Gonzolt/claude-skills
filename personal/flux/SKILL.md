---
name: flux
description: "Run Black Forest Labs FLUX.1 open-weight image models locally on this machine (RTX 5070, 12 GB). Covers text-to-image (schnell / dev / Krea), Kontext instruction editing, Fill inpainting/outpainting, Canny & Depth structural conditioning, and Redux variations. Use for: generate an image locally, edit a photo with FLUX Kontext, inpaint/outpaint, offline/no-API image generation, FLUX weights setup, FLUX VRAM or OOM problems."
argument-hint: "[setup|t2i|edit|fill|control|redux|doctor] <prompt or image path>"
metadata:
  version: "1.0.0"
  upstream: "https://github.com/black-forest-labs/flux"
  vendored-commit: "see repo/.git"
---

# FLUX.1 — local image generation and editing

Wraps the official Black Forest Labs inference repo, vendored at `repo/`.
Everything here targets **this machine**: Windows 11, RTX 5070 (12 GB VRAM,
Blackwell / sm_120), Python 3.11 available at
`C:\Users\thoma\AppData\Local\Programs\Python\Python311\python.exe`.

## Read before doing anything

| Situation | Read first |
|---|---|
| First run, nothing installed | `references/setup.md` |
| Choosing a model / license question | `references/models.md` |
| Building a command line | `references/cli.md` |
| OOM, slow, or "which precision" | `references/low-vram.md` |

## The one constraint that shapes everything

Every FLUX.1 model is a **12B-parameter** transformer. In bf16 that is
**~24 GB of weights** — it does **not** fit in this card's 12 GB, and the
upstream repo's `--offload` flag does not fix that (it only moves the text
encoders and autoencoder off-GPU; the transformer stays resident).

So there are two lanes, and picking the right one is the main judgement call:

- **Lane A — `scripts/generate.py` (default, use this).** diffusers +
  bitsandbytes **NF4** quantization. Transformer ≈ 7 GB, fits comfortably,
  ~20–40 s for a schnell image, ~1–2 min for a dev/Kontext image. Slight
  quality loss vs bf16, invisible for most work.
- **Lane B — upstream `python -m flux ...` in `repo/`.** Reference
  implementation, bf16 only. Use it to check faithfulness against upstream, to
  read the sampling code, or if a bigger GPU ever shows up. On this card it
  will OOM unless run with `--offload` *and* sequential CPU offload, which
  `scripts/generate.py` handles better anyway.

Never promise a bf16 upstream run will work here. If the user insists, run it
and report the actual OOM rather than predicting success.

## Quick reference

```bash
# one-time: venv + cu128 torch + deps  (~15 min, ~10 GB)
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

```bash
# check the env is sane before blaming a model
powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1
```

| Task | Command (from the skill dir, venv active) |
|---|---|
| Text-to-image, fast | `python scripts/generate.py t2i --model schnell --prompt "..."` |
| Text-to-image, best | `python scripts/generate.py t2i --model dev --prompt "..."` |
| Photographic look | `python scripts/generate.py t2i --model krea --prompt "..."` |
| Edit an image | `python scripts/generate.py edit --image in.png --prompt "make the jacket red"` |
| Inpaint / outpaint | `python scripts/generate.py fill --image in.png --mask mask.png --prompt "..."` |
| Structure-preserving | `python scripts/generate.py control --mode canny --image in.png --prompt "..."` |
| Image variations | `python scripts/generate.py redux --image in.png` |

Outputs land in `output/` next to the skill unless `--out` is given.

## Workflow

1. **Check the env.** If `.venv/` is missing under `repo/`, run `setup.ps1`
   first and tell the user it is a ~10 GB, ~15 min one-time cost.
2. **Check HF access.** Everything except schnell lives in a **gated** HF repo.
   The user must accept the license on the model page while signed in, then
   have `HF_TOKEN` set (or `hf auth login`). A 401/403 on first download means
   this step was skipped — say so plainly, do not retry blindly.
3. **Pick the model** from `references/models.md`. Default to `schnell` for
   drafts and iteration, `dev`/`krea` for finals, `kontext` for "change this
   image" requests.
4. **Write a real prompt.** FLUX responds to long, specific, natural-language
   descriptions — subject, action, setting, lens/lighting, style. Don't pass a
   three-word user request straight through; expand it and say what you added.
   For **Kontext edits** the opposite holds: keep the instruction short,
   imperative, and about the *change only* ("replace the sign text with
   'OPEN'"), because everything unstated is meant to be preserved.
5. **Run it**, then confirm the output file exists before reporting success.
6. **Iterate with a fixed `--seed`** when tuning a prompt, so changes are
   attributable to the prompt and not to noise.

## Licensing — state this when it matters

- `FLUX.1 [schnell]` — **Apache-2.0**. Commercial use fine.
- Everything else (`dev`, `Krea`, `Kontext`, `Fill`, `Canny`, `Depth`,
  `Redux`) — **FLUX.1-dev Non-Commercial License**. Outputs from a
  non-commercial-licensed model may not be used commercially without a paid
  BFL license (https://bfl.ai/pricing/licensing).

If the user's context is commercial (client work, an ad, a product listing),
raise this **once**, recommend schnell or a BFL license, and then do what they
ask. The commercial terms require usage reporting, which only the **upstream
lane** implements: `python -m flux <sub> --track_usage` with `BFL_API_KEY` set.
`scripts/generate.py` does not report usage — say so rather than implying a
licensed run is covered.

## Honesty rules for this skill

- Report the wall-clock time and the file path of what was produced.
- If a run OOMs, quote the CUDA error and go to `references/low-vram.md` —
  do not silently downgrade the model and pretend it was the plan.
- The first run of any model downloads 15–35 GB from HuggingFace. Say so
  before starting, not after.
