# Running inference

Two lanes: the wrapper (single pairs, low VRAM) and upstream `inference.py`
(batches and benchmarks, written for 8 GPUs).

---

## Lane A — `scripts/tryon.py`

```
python scripts/tryon.py --cloth <img> (--person <img> | --agnostic <img>) [options]
```

| Flag | Default | Notes |
|---|---|---|
| `--cloth` | — | required |
| `--person` | — | ordinary photo of the target person |
| `--agnostic` | — | pre-masked photo; mutually exclusive with `--person` |
| `--reference` | — | someone else wearing the target garment; enables the RefTon branch |
| `--out` | `output/tryon_<seed>.png` | |
| `--height` / `--width` | `512` / `384` | 4:3 portrait; also `1024`/`768` |
| `--cond-scale` | `1.0` | `1.0` at 512×384, `2.0` at 1024×768 |
| `--lora` | auto from `--height` | must match the resolution |
| `--base` | `weights/FLUX.1-Kontext-dev` | or a HF repo id |
| `--steps` | `28` | |
| `--guidance` | `2.5` | upstream's inference value |
| `--seed` | `42` | upstream default; fixed for comparability |
| `--quant` | `nf4` | `nf4` \| `bf16` |
| `--offload` | `model` | `model` \| `sequential` \| `none` |

What it does: stages the inputs into a temp directory in the layout
`repo/datasets_util/in_the_wild.py` expects (same filename in each folder),
builds one batch through the repo's own `MyDataset` + `viton_collate_fn`
(with `center_crop=True` so it is reproducible), loads
`FluxKontextPipelineI2I`, applies the LoRA, and saves the result. The
preprocessing is upstream's, so results are comparable to upstream runs.

The mode it selects mirrors upstream's `key_to_index_scale`:

| Mode | Conditioning slots |
|---|---|
| `--person` | person → 1, cloth → 2 |
| `--agnostic` | agnostic → 1, cloth → 2 |
| `+ --reference` | adds reference → 5 at `cond_scale` |

Expected on a 12 GB RTX 5070, NF4 + model offload: ~1–2 min load, then ~2–4 min
per image at 512×384. 1024×768 is roughly 3–4× the sampling cost and may need
`--offload sequential`.

---

## Lane B — upstream `inference.py` (batches, benchmarks)

```bash
accelerate launch --num_processes 1 inference.py \
  --pretrained_model_name_or_path ../weights/FLUX.1-Kontext-dev \
  --instance_data_dir example \
  --output_dir ../weights/512_384_pytorch_lora_weights.safetensors \
  --mixed_precision bf16 --split test \
  --height 512 --width 384 --inference_batch_size 1 \
  --cond_scale 1.0 --seed 0 --use_reference --use_person
```

Note the naming trap: **`--output_dir` is the input LoRA path**, not where
results go. Results are written to
`<instance_data_dir>/sample_<mode>/` — `sample_person`, `sample_person_ref`,
`sample_agnostic`, `sample_person_unpair_ref`, and so on.

Flags: `--use_person` (person instead of agnostic), `--use_reference` (enable
the reference branch), `--use_different` (unpaired garment/person combos, for
VITON-HD and DressCode evaluation only).

**This lane OOMs on a 12 GB card as written** — it loads the pipeline in bf16
and calls `pipe.to(device)`, i.e. ~24 GB resident. The upstream commands
assume 8 GPUs. To use it here, edit the two lines in `inference.py`:

```python
# pipe, dataloader = accelerator.prepare(pipe, dataloader)
# pipe.to(accelerator.device)
dataloader = accelerator.prepare(dataloader)
pipe.enable_model_cpu_offload()
```

and quantize the transformer at load time the way `scripts/tryon.py` does.
Keep the edit in the working tree, not committed, so `git -C repo pull` stays
clean.

Also note `inference.py` imports `train_refton_lora`, which drags in the whole
training dependency set (`wandb`, `datasets`, …) just to reach
`viton_collate_fn` — which actually lives in
`datasets_util/datasets_loader.py`. Install the training extras
(`references/training.md`) or import from the loader module directly.

---

## Evaluation

```bash
python evaluation/eval.py --gt_folder <gt> --pred_folder <pred> --paired
python evaluation/eval_dresscode.py --gt_folder_base <gt> --pred_folder_base <pred> --paired
```

`--paired` reports SSIM and LPIPS as well as FID/KID; omit it for unpaired
runs, where only FID/KID are meaningful.
