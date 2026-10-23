"""FLUX.1 runner for a 12 GB card.

Quantizes the 12B transformer (and T5) with bitsandbytes so the model actually
fits, then dispatches to the right diffusers pipeline. See
references/low-vram.md for why plain bf16 is not an option here.
"""

from __future__ import annotations

import argparse
import os
import time
from pathlib import Path

import torch

SKILL_DIR = Path(__file__).resolve().parent.parent

REPOS = {
    "schnell": "black-forest-labs/FLUX.1-schnell",
    "dev": "black-forest-labs/FLUX.1-dev",
    "krea": "black-forest-labs/FLUX.1-Krea-dev",
    "kontext": "black-forest-labs/FLUX.1-Kontext-dev",
    "fill": "black-forest-labs/FLUX.1-Fill-dev",
    "canny": "black-forest-labs/FLUX.1-Canny-dev",
    "depth": "black-forest-labs/FLUX.1-Depth-dev",
    "canny-lora": "black-forest-labs/FLUX.1-Canny-dev-lora",
    "depth-lora": "black-forest-labs/FLUX.1-Depth-dev-lora",
    "redux": "black-forest-labs/FLUX.1-Redux-dev",
}

# (steps, guidance) defaults, keyed by t2i model or by task
DEFAULTS = {
    "schnell": (4, 0.0),
    "dev": (28, 3.5),
    "krea": (28, 3.5),
    "edit": (30, 2.5),
    "fill": (50, 30.0),
    "control": (30, 10.0),
    "redux": (28, 2.5),
}


def quant_configs(mode: str):
    """Return (diffusers_config, transformers_config) for the transformer/T5."""
    if mode == "bf16":
        return None, None

    from diffusers import BitsAndBytesConfig as DiffusersBnb
    from transformers import BitsAndBytesConfig as TransformersBnb

    if mode == "int8":
        return DiffusersBnb(load_in_8bit=True), TransformersBnb(load_in_8bit=True)
    if mode == "nf4":
        kw = dict(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        return DiffusersBnb(**kw), TransformersBnb(**kw)
    raise SystemExit(f"unknown --quant {mode!r} (nf4 | int8 | bf16)")


def load_transformer(repo: str, quant: str):
    from diffusers import FluxTransformer2DModel

    d_cfg, _ = quant_configs(quant)
    extra = {"quantization_config": d_cfg} if d_cfg is not None else {}
    print(f"[flux] loading transformer from {repo} ({quant}) ...", flush=True)
    return FluxTransformer2DModel.from_pretrained(
        repo, subfolder="transformer", torch_dtype=torch.bfloat16, **extra
    )


def load_t5(repo: str, quant: str):
    from transformers import T5EncoderModel

    _, t_cfg = quant_configs(quant)
    extra = {"quantization_config": t_cfg} if t_cfg is not None else {}
    print(f"[flux] loading T5 text encoder ({quant}) ...", flush=True)
    return T5EncoderModel.from_pretrained(
        repo, subfolder="text_encoder_2", torch_dtype=torch.bfloat16, **extra
    )


def load_components(repo: str, quant: str):
    return load_transformer(repo, quant), load_t5(repo, quant)


def apply_offload(pipe, mode: str):
    if mode == "sequential":
        pipe.enable_sequential_cpu_offload()
    elif mode == "model":
        pipe.enable_model_cpu_offload()
    else:
        pipe.to("cuda")
    try:
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()
    except Exception:
        pass
    return pipe


def load_image(path):
    from diffusers.utils import load_image as _li

    return _li(str(path))


def preprocess_control(image, mode: str, width: int, height: int):
    """canny -> OpenCV edge map; depth -> Depth-Anything-V2-Small."""
    import numpy as np
    from PIL import Image

    image = image.convert("RGB").resize((width, height))
    if mode == "canny":
        import cv2

        edges = cv2.Canny(np.array(image), 100, 200)
        return Image.fromarray(np.stack([edges] * 3, axis=-1))

    from transformers import pipeline as hf_pipeline

    depth = hf_pipeline(
        "depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        device=0 if torch.cuda.is_available() else -1,
    )
    return depth(image)["depth"].convert("RGB").resize((width, height))


def build(args):
    """Return (pipe, call_kwargs) for the requested task."""
    from diffusers import (
        FluxControlPipeline,
        FluxFillPipeline,
        FluxKontextPipeline,
        FluxPipeline,
    )

    generator = torch.Generator("cpu").manual_seed(args.seed)
    common = dict(
        num_inference_steps=args.steps,
        generator=generator,
        num_images_per_prompt=args.batch,
        max_sequence_length=512,
    )

    if args.task == "t2i":
        repo = REPOS[args.model]
        tr, te = load_components(repo, args.quant)
        pipe = FluxPipeline.from_pretrained(
            repo, transformer=tr, text_encoder_2=te, torch_dtype=torch.bfloat16
        )
        kw = dict(
            prompt=args.prompt,
            width=args.width or 1024,
            height=args.height or 1024,
            **common,
        )
        if args.model == "schnell":
            # schnell is guidance-distilled and caps T5 at 256 tokens
            kw["max_sequence_length"] = 256
        else:
            kw["guidance_scale"] = args.guidance
        return pipe, kw

    if args.task == "edit":
        repo = REPOS["kontext"]
        tr, te = load_components(repo, args.quant)
        pipe = FluxKontextPipeline.from_pretrained(
            repo, transformer=tr, text_encoder_2=te, torch_dtype=torch.bfloat16
        )
        kw = dict(
            prompt=args.prompt,
            image=load_image(args.image),
            guidance_scale=args.guidance,
            **common,
        )
        # Kontext keeps the input's aspect ratio unless told otherwise
        if args.width:
            kw["width"] = args.width
        if args.height:
            kw["height"] = args.height
        return pipe, kw

    if args.task == "fill":
        repo = REPOS["fill"]
        tr, te = load_components(repo, args.quant)
        pipe = FluxFillPipeline.from_pretrained(
            repo, transformer=tr, text_encoder_2=te, torch_dtype=torch.bfloat16
        )
        img = load_image(args.image)
        mask = load_image(args.mask)
        if mask.size != img.size:
            raise SystemExit(
                f"mask {mask.size} must match image {img.size} exactly"
            )
        kw = dict(
            prompt=args.prompt,
            image=img,
            mask_image=mask,
            width=img.width,
            height=img.height,
            guidance_scale=args.guidance,
            **common,
        )
        return pipe, kw

    if args.task == "control":
        if args.lora:
            repo = REPOS["dev"]
            tr, te = load_components(repo, args.quant)
            pipe = FluxControlPipeline.from_pretrained(
                repo, transformer=tr, text_encoder_2=te, torch_dtype=torch.bfloat16
            )
            pipe.load_lora_weights(REPOS[f"{args.mode}-lora"])
        else:
            repo = REPOS[args.mode]
            tr, te = load_components(repo, args.quant)
            pipe = FluxControlPipeline.from_pretrained(
                repo, transformer=tr, text_encoder_2=te, torch_dtype=torch.bfloat16
            )
        width, height = args.width or 1024, args.height or 1024
        control = preprocess_control(load_image(args.image), args.mode, width, height)
        control_path = Path(args.out).with_suffix(".control.png")
        control.save(control_path)
        print(f"[flux] control map -> {control_path}")
        kw = dict(
            prompt=args.prompt,
            control_image=control,
            width=width,
            height=height,
            guidance_scale=args.guidance,
            **common,
        )
        return pipe, kw

    if args.task == "redux":
        from diffusers import FluxPriorReduxPipeline

        base = REPOS["schnell" if args.model == "schnell" else "dev"]
        # Redux replaces the text encoders entirely: it turns the input image
        # into the prompt embeddings the base model consumes.
        prior = FluxPriorReduxPipeline.from_pretrained(
            REPOS["redux"], torch_dtype=torch.bfloat16
        )
        prior.to("cuda")
        prior_out = prior(image=load_image(args.image))
        prior_out = {k: v.to("cuda") for k, v in prior_out.items()}
        del prior
        torch.cuda.empty_cache()

        pipe = FluxPipeline.from_pretrained(
            base,
            transformer=load_transformer(base, args.quant),
            text_encoder=None,
            text_encoder_2=None,
            tokenizer=None,
            tokenizer_2=None,
            torch_dtype=torch.bfloat16,
        )
        kw = dict(
            width=args.width or 1024,
            height=args.height or 1024,
            num_inference_steps=args.steps,
            guidance_scale=args.guidance,
            generator=generator,
            **prior_out,
        )
        return pipe, kw

    raise SystemExit(f"unknown task {args.task!r}")


def main():
    p = argparse.ArgumentParser(description="FLUX.1 local runner (12 GB profile)")
    p.add_argument("task", choices=["t2i", "edit", "fill", "control", "redux"])
    p.add_argument("--prompt", default="")
    p.add_argument("--image", help="input image for edit/fill/control/redux")
    p.add_argument("--mask", help="fill: white = regenerate, black = keep")
    p.add_argument("--model", default="schnell", choices=["schnell", "dev", "krea"])
    p.add_argument("--mode", default="canny", choices=["canny", "depth"])
    p.add_argument("--lora", action="store_true",
                   help="control: LoRA variant stacked on FLUX.1-dev")
    p.add_argument("--steps", type=int)
    p.add_argument("--guidance", type=float)
    p.add_argument("--width", type=int)
    p.add_argument("--height", type=int)
    p.add_argument("--seed", type=int, default=-1)
    p.add_argument("--batch", type=int, default=1)
    p.add_argument("--quant", default="nf4", choices=["nf4", "int8", "bf16"])
    p.add_argument("--offload", default="model",
                   choices=["model", "sequential", "none"])
    p.add_argument("--out")
    args = p.parse_args()

    if args.task in ("edit", "fill", "control", "redux") and not args.image:
        raise SystemExit(f"--image is required for '{args.task}'")
    if args.task == "fill" and not args.mask:
        raise SystemExit("--mask is required for 'fill'")
    if args.task != "redux" and not args.prompt:
        raise SystemExit("--prompt is required")

    key = args.model if args.task == "t2i" else args.task
    d_steps, d_guidance = DEFAULTS[key]
    if args.steps is None:
        args.steps = d_steps
    if args.guidance is None:
        args.guidance = d_guidance
    if args.seed < 0:
        args.seed = int.from_bytes(os.urandom(4), "little") % (2**31)

    out = (
        Path(args.out)
        if args.out
        else SKILL_DIR / "output" / f"{args.task}_{args.seed}.png"
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    args.out = str(out)

    if not torch.cuda.is_available():
        raise SystemExit("CUDA not available -- run scripts/doctor.ps1")

    t0 = time.time()
    pipe, kwargs = build(args)
    apply_offload(pipe, args.offload)
    print(
        f"[flux] ready in {time.time() - t0:.0f}s; sampling {args.steps} steps, "
        f"seed {args.seed} ...",
        flush=True,
    )

    t1 = time.time()
    images = pipe(**kwargs).images
    for i, img in enumerate(images):
        path = out if i == 0 else out.with_name(f"{out.stem}_{i}{out.suffix}")
        img.save(path)
        print(f"[flux] wrote {path}")
    print(
        f"[flux] {time.time() - t1:.0f}s sampling, "
        f"peak VRAM {torch.cuda.max_memory_allocated() / 2**30:.1f} GB"
    )


if __name__ == "__main__":
    main()
