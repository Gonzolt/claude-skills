# Command reference

Two lanes. `scripts/generate.py` is the one to use here; the upstream CLI is
documented below it so its flags can be read off directly when needed.

---

## Lane A — `scripts/generate.py` (diffusers, NF4-capable)

```
python scripts/generate.py <task> [options]
```

Tasks: `t2i`, `edit`, `fill`, `control`, `redux`.

Shared options:

| Flag | Default | Notes |
|---|---|---|
| `--prompt` | — | Required except for `redux` |
| `--out` | `output/<task>_<seed>.png` | Output path |
| `--seed` | random | Fix it while tuning a prompt |
| `--steps` | per model | schnell 4, dev/krea 28, kontext 30, fill 50 |
| `--guidance` | per model | schnell n/a, dev 3.5, kontext 2.5, fill 30 |
| `--width` / `--height` | 1024×1024 | Multiples of 16; ≤1440 on 12 GB |
| `--quant` | `nf4` | `nf4` \| `int8` \| `bf16` |
| `--offload` | `model` | `model` \| `sequential` \| `none` |
| `--batch` | 1 | Images per run; raises VRAM |

Task-specific:

| Task | Extra flags |
|---|---|
| `t2i` | `--model schnell\|dev\|krea` |
| `edit` | `--image <path>` (the image to edit) |
| `fill` | `--image <path> --mask <path>` (white = regenerate) |
| `control` | `--image <path> --mode canny\|depth [--lora]` |
| `redux` | `--image <path> [--model dev\|schnell]` |

Examples:

```bash
python scripts/generate.py t2i --model schnell --prompt "a rain-slick Oslo street at dusk, neon reflections, 35mm, shallow depth of field" --seed 7
```

```bash
python scripts/generate.py edit --image portrait.jpg --prompt "change the background to a snowy forest, keep the person unchanged"
```

```bash
python scripts/generate.py fill --image room.png --mask room_mask.png --prompt "a tall bookshelf filled with books" --guidance 30 --steps 50
```

```bash
python scripts/generate.py control --mode depth --lora --image pose.jpg --prompt "a bronze statue in a museum atrium"
```

---

## Lane B — upstream CLI (bf16 reference; run from `repo/`)

Dispatch is `python -m flux <subcommand>` via `fire`, so every parameter is
`--snake_case value`. Add `--loop` for an interactive prompt session.

### `t2i`
```
--name flux-dev-krea   # flux-dev | flux-schnell | flux-dev-krea
--width 1360 --height 768 --seed None --prompt "..."
--num_steps None       # defaults per model
--guidance 2.5 --offload False --output_dir output
--device cuda --add_sampling_metadata True
--trt False --trt_transformer_precision bf16   # Linux/TRT only
--track_usage False    # commercial licensing telemetry, needs BFL_API_KEY
```

### `kontext` — image editing
```
--name flux-dev-kontext --img_cond_path assets/cup.png
--prompt "replace the logo with the text 'Black Forest Labs'"
--aspect_ratio None --num_steps 30 --guidance 2.5 --seed None --offload False
```

### `fill` — inpaint / outpaint
```
--img_cond_path assets/cup.png --img_mask_path assets/cup_mask.png
--prompt "a white paper cup" --num_steps 50 --guidance 30.0 --offload False
```
Mask must be the same size as the image and pure black/white.

### `control` — canny / depth
```
--name flux-dev-canny | flux-dev-depth | flux-dev-canny-lora | flux-dev-depth-lora
--img_cond_path assets/robot.webp --prompt "a robot made out of gold"
--width 1024 --height 1024 --num_steps 50 --guidance None --lora_scale 0.85
```
`--name` is positional-required for this subcommand.

### `redux` — variations
```
--name flux-dev | flux-schnell --img_cond_path assets/robot.webp
--width 1360 --height 768 --num_steps None --guidance 2.5
```

### Demos
```bash
streamlit run demo_st.py          # t2i + i2i
streamlit run demo_st_fill.py     # inpainting canvas
python demo_gr.py --name flux-schnell --device cuda --offload
```

All of Lane B assumes the transformer fits in VRAM in bf16. It does not, here —
see `low-vram.md`.
