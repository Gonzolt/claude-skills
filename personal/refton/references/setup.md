# Setup on this machine

Target: Windows 11, RTX 5070 (Blackwell **sm_120**, 12 GB), Python 3.11.

## Why not `pip install -r requirements.txt`

The upstream file is a frozen Linux 8×GPU environment:

- pinned `torch==2.7.1` plus a full set of `nvidia-*-cu12` wheels — Linux-only
  packaging, and the CUDA 12.6 pins predate Blackwell support
- `deepspeed`, only needed for multi-GPU training and painful to build on
  Windows
- `wandb`, `kaggle`, `gdown`, `datasets`, evaluation extras

`scripts/setup.ps1` installs a curated subset instead: cu128 torch, the
diffusers/peft/bitsandbytes stack, and the handful of things the dataset code
actually imports (`matplotlib`, `opencv-python`, `scikit-image`, `timm`).

If a *training* run is planned, `references/training.md` lists the extras to
add on top.

## One-time install

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

Creates `repo/.venv`, installs cu128 torch, the runtime stack, and prints a
CUDA smoke test. ~10 GB, ~15 minutes, no model weights yet.

## Weights

```bash
powershell -ExecutionPolicy Bypass -File scripts/fetch_weights.ps1
```

Two downloads:

| What | Source | Size |
|---|---|---|
| FLUX.1-Kontext-dev backbone, diffusers layout | `black-forest-labs/FLUX.1-Kontext-dev` (**gated**) | ~31 GB |
| RefTon LoRAs (both resolutions) | `qihoo360/RefVTON` | ~0.4 GB |

The HF repo totals ~54 GB; the script skips the single-file original
checkpoint and `ae.safetensors`, which the diffusers pipeline never reads.

The backbone is gated: sign in at
https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev, accept the
licence, then `setx HF_TOKEN "hf_xxx"` and restart the shell. A 401/403 on the
first download means this was skipped.

Files land in:

```text
weights/
├── FLUX.1-Kontext-dev/                          (backbone, diffusers layout)
├── 512_384_pytorch_lora_weights.safetensors
└── 1024_768_pytorch_lora_weights.safetensors
```

`scripts/tryon.py` finds them there by default; override with `--base` and
`--lora`.

## Verifying

```bash
repo\.venv\Scripts\python.exe -c "import torch, diffusers, peft, bitsandbytes; print(torch.__version__, torch.cuda.get_device_name(0))"
```

Then a real end-to-end check using the sample data upstream ships:

```bash
python scripts/tryon.py --cloth repo/example/cloth/01.jpg --person repo/example/person/01.jpg --reference repo/example/image_ref/01.jpg --out output/smoke.png
```

If that produces a plausible image, the environment is good. Do this before
debugging anything about the user's own photos.

## Updating upstream

```bash
git -C repo pull
```
