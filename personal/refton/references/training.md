# Fine-tuning RefTon

Read this before promising a training run: **the published recipe is 8 GPUs**,
and this machine has one 12 GB card. Adapting it is possible for small LoRA
ranks at 512×384 with heavy offload, but it is a research-scale job, not an
afternoon. Say that plainly rather than launching something that will crawl.

## Upstream recipe (reference)

```bash
CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7 accelerate launch --num_processes 8 \
  --main_process_port 29501 train_refton_lora.py \
  --pretrained_model_name_or_path <FLUX.1-Kontext-dev path> \
  --instance_data_dir <data> --split train --output_dir checkpoints \
  --mixed_precision bf16 --height 512 --width 384 \
  --train_batch_size 8 --guidance_scale 1 --gradient_checkpointing \
  --optimizer adamw --rank 64 --lora_alpha 128 --use_8bit_adam \
  --learning_rate 1e-4 --lr_scheduler constant --lr_warmup_steps 0 \
  --num_train_epochs 64 --cond_scale 2.0 --seed 0 \
  --dropout_reference 0.5 --person_prob 0.5
```

Arguments that carry the method:

| Flag | Meaning |
|---|---|
| `--dropout_reference 0.5` | drops the reference branch half the time, so one model serves both with- and without-reference inference |
| `--person_prob 0.5` | trains on the full person image half the time, agnostic the other half — this is what makes mask-free `--use_person` inference work |
| `--cond_scale` | conditioning resolution divisor; `1.0` at 512×384, `2.0` at 1024×768 |
| `--rank` / `--lora_alpha` | LoRA capacity, 64/128 published |

Note the README's asymmetry: `cond_scale 2.0` for *training* at 512×384, but
`1.0` for *inference* at that resolution.

## Extra dependencies

On top of `scripts/setup.ps1`:

```bash
repo\.venv\Scripts\python.exe -m pip install datasets wandb bitsandbytes prodigyopt
```

`deepspeed` (in `repo/config/`) is only needed for the multi-GPU ZeRO configs
and is a poor fit for Windows — skip it for single-GPU runs.

## Single-GPU adaptation sketch

- `accelerate launch --num_processes 1`
- `--train_batch_size 1 --gradient_accumulation_steps 8` to keep the effective
  batch near the published 64
- keep `--gradient_checkpointing` and `--use_8bit_adam`
- `--rank 16` or `32` to cut optimizer state
- 512×384 only
- expect the backbone in bf16 to be the blocker; a 4-bit base with a LoRA on
  top (QLoRA-style) is the only realistic route on 12 GB, and upstream does not
  ship that path — it needs code changes, not flags

## Data

The `VRF` datasets — the person/reference images that public try-on benchmarks
lack — are at https://huggingface.co/datasets/qihoo360/VRF-datasets. Upstream
redistributes only processed subsets; original VITON-HD, DressCode, IGPair,
ViViD and FashionTryon data must come from their own sources, under their own
research-only terms.
