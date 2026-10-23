# FLUX.1 open-weight models

All weights come from HuggingFace. Every repo except `FLUX.1-schnell` is
**gated**: sign in at huggingface.co, open the model page, accept the terms,
then set `HF_TOKEN` (or run `hf auth login`).

| Task | `--model` | HF repo | Size (bf16) | License |
|---|---|---|---|---|
| Text-to-image, 4 steps | `schnell` | `black-forest-labs/FLUX.1-schnell` | ~24 GB | Apache-2.0 |
| Text-to-image, 50 steps | `dev` | `black-forest-labs/FLUX.1-dev` | ~24 GB | Non-commercial |
| Text-to-image, photographic | `krea` | `black-forest-labs/FLUX.1-Krea-dev` | ~24 GB | Non-commercial |
| Instruction editing | `kontext` | `black-forest-labs/FLUX.1-Kontext-dev` | ~24 GB | Non-commercial |
| Inpaint / outpaint | `fill` | `black-forest-labs/FLUX.1-Fill-dev` | ~24 GB | Non-commercial |
| Edge-guided | `canny` | `black-forest-labs/FLUX.1-Canny-dev` | ~24 GB | Non-commercial |
| Depth-guided | `depth` | `black-forest-labs/FLUX.1-Depth-dev` | ~24 GB | Non-commercial |
| Edge-guided (LoRA on dev) | `canny-lora` | `...-Canny-dev-lora` | dev + ~1 GB | Non-commercial |
| Depth-guided (LoRA on dev) | `depth-lora` | `...-Depth-dev-lora` | dev + ~1 GB | Non-commercial |
| Image variations | `redux` | `black-forest-labs/FLUX.1-Redux-dev` | dev/schnell + ~1 GB | Non-commercial |

Add the shared encoders once, reused by every model:
T5-XXL (~9 GB), CLIP-L (~250 MB), autoencoder (~330 MB, Apache-2.0).

**Disk budget:** first `dev` run pulls ~34 GB. schnell + dev + Kontext together
≈ 85 GB. Under NF4 the *download* is still full-size (quantization happens at
load time) unless a pre-quantized repo is used.

## Choosing

- **Drafting, many variations, commercial use** → `schnell`. 4 steps,
  `guidance` is ignored (it is guidance-distilled).
- **Final quality, prompt adherence** → `dev`, 28–50 steps, guidance 3.5.
- **Photorealism, less "AI look"** → `krea`. Same interface as `dev`.
- **"Change X in this photo"** → `kontext`. Feed the image, describe only the
  change. Preserves identity and composition far better than img2img.
- **"Fill this hole" / "extend the canvas"** → `fill` with a black/white mask
  the same size as the image (white = region to regenerate). Wants high
  guidance (~30) and ~50 steps.
- **"Same layout, new content/texture"** → `canny` (hard edges, logos,
  architecture) or `depth` (3D structure, poses). LoRA variants are smaller
  and stack on `dev`; full variants are slightly stronger.
- **"More like this image"** → `redux`, no prompt needed; it re-imagines the
  input through a SigLIP embedder.

## Local weight overrides

The upstream repo resolves checkpoints in this order: env var → its
`checkpoints/` dir (relative to the **current working directory**) → HF
download. To point at existing files:

```bash
export FLUX_MODEL=/path/to/flux1-dev.safetensors
export FLUX_AE=/path/to/ae.safetensors
export FLUX_LORA=/path/to/lora.safetensors      # canny-lora / depth-lora
export FLUX_REDUX=/path/to/flux1-redux-dev.safetensors
```

`scripts/generate.py` uses the diffusers cache instead (`HF_HOME`, default
`~/.cache/huggingface`). Set `HF_HOME` to move it off the C: drive.
