# Preparing inputs

Input quality dominates every parameter in this pipeline. Fix the photos
before touching settings.

## The four image roles

| Folder (upstream layout) | `tryon.py` flag | What it must show |
|---|---|---|
| `cloth/` | `--cloth` | The garment alone: flat lay or ghost mannequin, plain background, whole garment in frame, front-facing |
| `person/` | `--person` | The target person, full torso, wearing *something else* |
| `agnostic/` | `--agnostic` | The target person with the garment region already masked out (grey/white) |
| `image_ref/` | `--reference` | A **different person wearing the target garment**, on-body |
| `images/` | — | Ground truth, only used for evaluation |

`--person` and `--agnostic` are mutually exclusive. Prefer `--person` for real
photos; `--agnostic` exists for benchmark datasets that ship masks.

## Rules that actually matter

1. **Aspect ratio.** The model works at 512×384 or 1024×768 — a **4:3 portrait**
   crop. Everything is resized to exactly that, *without* preserving aspect
   ratio, so a square or 16:9 input arrives stretched. Crop to 4:3 yourself.
2. **Framing consistency.** Person and reference should be framed alike —
   similar crop (head-to-thigh works well), similar distance, upright. A
   full-body reference against a head-and-shoulders person confuses the
   garment scale.
3. **The garment must be unambiguous in the reference.** If the reference
   person wears a jacket *over* the target shirt, the model may transfer the
   jacket. Crop the reference to foreground the target garment.
4. **Same garment, not a similar one.** The reference exists to pin down this
   specific fabric and print. A lookalike in another colour actively hurts.
5. **Plain, evenly lit garment shots.** Shadows on a flat lay get baked in as
   texture.
6. **Hands, hair, and occlusion** over the garment region are the usual failure
   source in `person` mode. Pick a frame with arms clear of the torso.
7. **Category consistency.** A long dress onto a photo cropped at the waist
   cannot work; the model can only paint inside the frame it is given.

## Upstream folder layout

`tryon.py` builds this for you in a temp dir. For batches, build it by hand:

```text
mydata/
├── cloth/      01.jpg  02.jpg   <- required
├── person/     01.jpg  02.jpg   <- for --use_person
├── agnostic/   01.jpg  02.jpg   <- for the masked mode
├── image_ref/  01.jpg  02.jpg   <- for --use_reference
└── images/     01.jpg  02.jpg   <- optional ground truth
```

**Filenames must match exactly across folders.** The in-the-wild loader
(`repo/datasets_util/in_the_wild.py`) enumerates `cloth/` and then looks up the
*same filename* in every other folder, raising `FileNotFoundError: Missing
file: ...` if one is absent. Only `.jpg` and `.png` are listed.

Loader-selection quirk: upstream picks the dataset class by **substring of the
path** — a path containing `viton` uses the VITON-HD loader, one containing
`DressCode` uses the DressCode loader, anything else uses the in-the-wild
loader. Do not name a custom folder `viton_test` unless you want the VITON
loader and its `train/`, `test/`, `agnostic_mask/`, `dense/` requirements.

Another quirk worth knowing when comparing runs: the loaders use
`RandomCrop` when `center_crop=False` (their default), so upstream inference is
**not deterministic across runs** even with a fixed seed. `scripts/tryon.py`
passes `center_crop=True` for reproducibility.

## Reference scaling

The reference image is loaded at `size // cond_scale`:

| Resolution | LoRA file | `--cond-scale` | Reference loaded at |
|---|---|---|---|
| 512×384 | `512_384_pytorch_lora_weights.safetensors` | `1.0` | 512×384 |
| 1024×768 | `1024_768_pytorch_lora_weights.safetensors` | `2.0` | 512×384 |

These pairings come from the upstream README; don't mix them.
