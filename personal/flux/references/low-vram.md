# 12 GB survival guide (RTX 5070)

## The arithmetic

| Component | bf16 | NF4 | int8 |
|---|---|---|---|
| Flow transformer (12B) | ~23.8 GB | ~6.9 GB | ~12.5 GB |
| T5-XXL text encoder | ~9.5 GB | ~3.5 GB | ~5.0 GB |
| CLIP-L | ~0.25 GB | — | — |
| Autoencoder | ~0.33 GB | — | — |

12 GB of VRAM. bf16 transformer alone overflows by 2×. int8 transformer fits
only if nothing else is resident — workable with `--offload model` but tight
at high resolution. **NF4 + `--offload model` is the configuration that just
works**, and it is the default in `scripts/generate.py`.

## Offload modes

- `--offload model` (default) — one component on GPU at a time, moved as a
  whole. Small speed cost, big VRAM win. Use this.
- `--offload sequential` — moves individual submodules. Fits almost anything,
  including bf16, but is **very** slow (several minutes per image). Last
  resort.
- `--offload none` — everything resident. Only viable with NF4 at ≤1024².

## Expected timings here (NF4, `--offload model`)

| Run | Time |
|---|---|
| schnell, 1024², 4 steps | ~20–30 s |
| dev/krea, 1024², 28 steps | ~1.5–2.5 min |
| kontext edit, 1024², 30 steps | ~2–3 min |
| fill, 1024², 50 steps | ~3–4 min |

Add 1–3 minutes on the *first* run of a session for load + quantization, and
however long the initial 25–35 GB download takes.

## When it OOMs anyway

Work down this list, one change at a time:

1. Drop resolution to 1024×1024 or 768×1024. VRAM scales with pixel count and
   attention scales worse than linearly.
2. `--batch 1`.
3. `--offload model` if it was `none`.
4. `--quant nf4` if it was `int8` or `bf16`.
5. Close other GPU consumers — the desktop already holds ~1.5 GB.
6. `--offload sequential` as the final fallback; warn the user it will be slow.

`torch.OutOfMemoryError` mid-run after several successful images usually means
fragmentation, not a real limit. Set
`PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` and rerun.

## Quality cost of NF4

NF4 is close to lossless for composition and prompt adherence. Where it shows:
fine text rendering, very small faces, subtle gradients. If a final needs the
last few percent, generate the *composition* in NF4 with a fixed seed, then
re-run the same seed at `--quant int8 --offload model` and compare.

## What does not help

- `--trt` — the TensorRT path (including the Blackwell-friendly FP4 exports)
  is documented only through NVIDIA's Linux container. Not available here.
- The upstream `--offload` flag on its own — it leaves the transformer on GPU.
- `torch.compile` — long compile times, no VRAM benefit.
