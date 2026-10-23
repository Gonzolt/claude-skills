"""Single-pair virtual try-on with RefTon, sized for a 12 GB card.

Stages arbitrary image paths into the folder layout RefTon's in-the-wild
loader expects, then runs the repo's own pipeline with the transformer
quantized so it fits. Preprocessing is upstream's, so results stay comparable
to `inference.py`.
"""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
import time
from pathlib import Path

import torch

SKILL_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = SKILL_DIR / "repo"
WEIGHTS_DIR = SKILL_DIR / "weights"

# the repo is a flat script layout, not an installed package
sys.path.insert(0, str(REPO_DIR))

DEFAULT_LORA = {
    (512, 384): "512_384_pytorch_lora_weights.safetensors",
    (1024, 768): "1024_768_pytorch_lora_weights.safetensors",
}


def stage_inputs(args, tmp: Path) -> None:
    """Copy inputs under a shared filename, one per role folder."""
    name = "input" + Path(args.cloth).suffix.lower()
    if name.endswith((".jpeg", ".webp", ".bmp")):
        name = "input.png"  # the loader only enumerates .jpg/.png

    roles = {"cloth": args.cloth}
    if args.person:
        roles["person"] = args.person
    if args.agnostic:
        roles["agnostic"] = args.agnostic
    if args.reference:
        roles["image_ref"] = args.reference

    for folder, src in roles.items():
        src_path = Path(src)
        if not src_path.exists():
            raise SystemExit(f"missing input image: {src_path}")
        dest_dir = tmp / folder
        dest_dir.mkdir(parents=True, exist_ok=True)
        if src_path.suffix.lower() in (".jpg", ".png"):
            shutil.copy2(src_path, dest_dir / name)
        else:
            from PIL import Image

            Image.open(src_path).convert("RGB").save(dest_dir / name)


def build_pipeline(args):
    from refton.pipelines import FluxKontextPipelineI2I

    kwargs = {"torch_dtype": torch.bfloat16}
    if args.quant == "nf4":
        from diffusers import BitsAndBytesConfig as DiffusersBnb
        from diffusers import FluxTransformer2DModel

        print(f"[refton] loading transformer from {args.base} (nf4) ...", flush=True)
        kwargs["transformer"] = FluxTransformer2DModel.from_pretrained(
            args.base,
            subfolder="transformer",
            torch_dtype=torch.bfloat16,
            quantization_config=DiffusersBnb(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
            ),
        )

    print(f"[refton] building pipeline from {args.base} ...", flush=True)
    pipe = FluxKontextPipelineI2I.from_pretrained(args.base, **kwargs)

    print(f"[refton] applying LoRA {args.lora}", flush=True)
    try:
        pipe.load_lora_weights(args.lora)
    except Exception as exc:  # a run without the LoRA is not RefTon
        raise SystemExit(
            f"LoRA load failed ({type(exc).__name__}: {exc}).\n"
            "With --quant nf4 this is usually a peft/bitsandbytes version clash.\n"
            "Retry with: --quant bf16 --offload sequential  (slow, but it fits)."
        )

    if args.offload == "sequential":
        pipe.enable_sequential_cpu_offload()
    elif args.offload == "model":
        pipe.enable_model_cpu_offload()
    else:
        pipe.to("cuda")
    return pipe


def save_image(tensor_or_image, path: Path) -> None:
    import numpy as np
    from PIL import Image

    if hasattr(tensor_or_image, "save"):  # already PIL
        tensor_or_image.save(path)
        return
    t = tensor_or_image.detach().cpu()
    if t.min() < 0:  # upstream saves in [-1, 1]
        t = (t + 1) / 2
    arr = np.transpose(t.float().numpy(), (1, 2, 0))
    Image.fromarray((arr * 255).clip(0, 255).astype(np.uint8)).save(path)


def main():
    p = argparse.ArgumentParser(description="RefTon single-pair try-on")
    p.add_argument("--cloth", required=True, help="flat garment image")
    p.add_argument("--person", help="target person, wearing something else")
    p.add_argument("--agnostic", help="target person, garment region masked out")
    p.add_argument("--reference", help="another person wearing the target garment")
    p.add_argument("--out")
    p.add_argument("--height", type=int, default=512)
    p.add_argument("--width", type=int, default=384)
    p.add_argument("--cond-scale", dest="cond_scale", type=float)
    p.add_argument("--base", default=str(WEIGHTS_DIR / "FLUX.1-Kontext-dev"))
    p.add_argument("--lora")
    p.add_argument("--steps", type=int, default=28)
    p.add_argument("--guidance", type=float, default=2.5)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--quant", default="nf4", choices=["nf4", "bf16"])
    p.add_argument("--offload", default="model",
                   choices=["model", "sequential", "none"])
    args = p.parse_args()

    if bool(args.person) == bool(args.agnostic):
        raise SystemExit("pass exactly one of --person or --agnostic")
    if not torch.cuda.is_available():
        raise SystemExit("CUDA not available -- see references/setup.md")

    res = (args.height, args.width)
    if args.cond_scale is None:
        args.cond_scale = 2.0 if res == (1024, 768) else 1.0
    if args.lora is None:
        fname = DEFAULT_LORA.get(res)
        if fname is None:
            raise SystemExit(
                f"no default LoRA for {args.height}x{args.width}; pass --lora"
            )
        args.lora = str(WEIGHTS_DIR / fname)
    for path, what in ((args.base, "backbone"), (args.lora, "LoRA")):
        if not Path(path).exists() and "/" not in str(path):
            raise SystemExit(f"{what} not found: {path} -- run scripts/fetch_weights.ps1")

    out = Path(args.out) if args.out else SKILL_DIR / "output" / f"tryon_{args.seed}.png"
    out.parent.mkdir(parents=True, exist_ok=True)

    mode = "person" if args.person else "agnostic"
    print(f"[refton] mode: {mode}"
          f"{' + reference' if args.reference else ' (no reference)'}, "
          f"{args.height}x{args.width}, cond_scale {args.cond_scale}")

    from datasets_util.datasets_loader import viton_collate_fn
    from datasets_util.in_the_wild import MyDataset

    tmp = Path(tempfile.mkdtemp(prefix="refton_"))
    try:
        stage_inputs(args, tmp)
        dataset = MyDataset(
            str(tmp),
            size=res,
            instance_prompt="",
            center_crop=True,  # upstream defaults to RandomCrop; we want repeatable
            scale=args.cond_scale,
        )
        batch = viton_collate_fn([dataset[0]])

        # mirrors the slot mapping in repo/inference.py
        key_to_index_scale = {
            f"cond_pixel_values_{mode}": [1, 1],
            "cond_pixel_values_cloth": [2, 1],
        }
        if args.reference:
            key_to_index_scale["pixel_values_ref"] = [5, args.cond_scale]

        t0 = time.time()
        pipe = build_pipeline(args)
        print(f"[refton] ready in {time.time() - t0:.0f}s; sampling "
              f"{args.steps} steps ...", flush=True)

        t1 = time.time()
        with torch.no_grad():
            images = pipe(
                image=batch,
                batch_size=1,
                prompt="",
                num_images_per_prompt=1,
                guidance_scale=args.guidance,
                num_inference_steps=args.steps,
                generator=torch.Generator().manual_seed(args.seed),
                height=args.height,
                width=args.width,
                cond_scale=args.cond_scale,
                key_to_index_scale=key_to_index_scale,
            ).images

        save_image(images[0], out)
        print(f"[refton] wrote {out}")
        print(f"[refton] {time.time() - t1:.0f}s sampling, "
              f"peak VRAM {torch.cuda.max_memory_allocated() / 2**30:.1f} GB")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
