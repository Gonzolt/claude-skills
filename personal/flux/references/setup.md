# Setup on this machine

Target: Windows 11, RTX 5070 (Blackwell, **sm_120**, 12 GB), Python 3.11.

## Why not just `pip install -e ".[all]"`

Two Windows/Blackwell gotchas the upstream README does not cover:

1. The repo's `torch` extra pins **`torch == 2.6.0`**, whose default wheels are
   built for CUDA 12.4 and have **no sm_120 kernels**. On this GPU that yields
   `no kernel image is available for execution on the device`. Install torch
   **first**, from the cu128 index, and then `pip install -e .` (the base
   dependency list contains no torch pin, so nothing overrides it).
2. TensorRT support in the README goes through `enroot` + an NVIDIA container.
   That path is Linux-only; ignore `--trt` on this machine.

## One-time install

```bash
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
```

What it does, in order:

1. Creates `repo/.venv` with Python 3.11.
2. Installs `torch`/`torchvision` from `https://download.pytorch.org/whl/cu128`.
3. `pip install -e .` inside `repo/` (no torch extra).
4. Installs the diffusers lane: `diffusers>=0.35`, `transformers`, `accelerate`,
   `bitsandbytes`, `peft`, `protobuf`, `sentencepiece`, `safetensors`.
5. Prints a CUDA smoke test.

Cost: ~10 GB on disk, ~15 minutes on a normal connection. No model weights yet.

## HuggingFace access

```bash
setx HF_TOKEN "hf_xxx"
```

Then restart the shell. Verify with `scripts/doctor.ps1`. Without this, every
model except `schnell` fails at download with a 401/403 gated-repo error.

Accept the license once per model family, while signed in:
- https://huggingface.co/black-forest-labs/FLUX.1-dev
- https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev
- (and the Fill / Canny / Depth / Redux / Krea pages as needed)

## Where things land

| What | Path | Size |
|---|---|---|
| venv | `repo/.venv` | ~10 GB |
| diffusers weights | `%USERPROFILE%\.cache\huggingface` (or `HF_HOME`) | 25–85 GB |
| upstream-lane weights | `<cwd>/checkpoints/` | 25–35 GB |
| outputs | `output/` | small |

C: had ~180 GB free when this skill was installed. Check before pulling a
third model family.

## Updating upstream

```bash
git -C repo pull
```

`repo/` is a real shallow clone of `black-forest-labs/flux`. Re-run
`pip install -e .` only if `pyproject.toml` changed.
