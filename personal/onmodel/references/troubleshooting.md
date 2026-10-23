# Troubleshooting

Errors here mostly point at the wrong thing. Each entry names the real cause.

## Setup and weights

### `401` / `403` on first download

FLUX.1-Kontext-dev is a **gated** HuggingFace repo. The licence must be
accepted while signed in at
`huggingface.co/black-forest-labs/FLUX.1-Kontext-dev`, and `HF_TOKEN` must be
set:

```bash
setx HF_TOKEN "hf_xxx"
```

`setx` affects new shells only — the current one keeps the old environment.
Open a new shell before retrying. Do not retry blindly; a 401 never resolves on
its own.

### Weights missing

~31 GB, almost all of it the Kontext backbone:

```bash
powershell -ExecutionPolicy Bypass -File ~/.claude/skills/refton/scripts/fetch_weights.ps1
```

Casting additionally wants FLUX.1 [schnell] (~24 GB, ungated, Apache-2.0),
downloaded on first `cast` run. Say so before starting a download that size,
not after.

### `FileNotFoundError: Missing file: ...`

RefTon's in-the-wild loader enumerates `cloth/` and then looks for **the same
filename** in every other folder. `scripts/tryon.py` stages this correctly; if
you are building a batch folder by hand, the filenames must match exactly
across `cloth/`, `person/`, `image_ref/`.

### Loader picks the wrong dataset class

Upstream selects the loader by **substring of the path**. A path containing
`viton` gets the VITON-HD loader and its extra folder requirements; one
containing `DressCode` gets that loader. Never name a working directory
`viton_test` or put the project under a folder with those substrings.

## VRAM

### `CUDA out of memory`

Expected budget on this 12 GB card: NF4 + model offload, ~7 GB transformer
resident, comfortable at 512×384 and workable at 1024×768.

In order of preference:

1. Confirm you are on `--quant nf4 --offload model` (the wrapper's default).
2. Drop to 512×384 for drafts.
3. `--offload sequential` — slow, several minutes, but it fits.
4. Close anything else using the GPU. A browser with hardware acceleration can
   hold a surprising amount.

Never run upstream `inference.py` unmodified — it does `pipe.to(device)` in
bf16, needs ~24 GB, and its commands assume 8 datacenter GPUs. It will OOM
here regardless of `accelerate` settings. Do not predict that it will work.

### `load_lora_weights` errors inside peft

Known: applying a LoRA on top of a 4-bit quantized transformer fails on some
peft versions. Fall back to:

```
--quant bf16 --offload sequential
```

Slow but correct. **Do not silently continue without the LoRA** — a Kontext run
without RefVTON is not a try-on, and presenting one as a result is the
dishonest failure mode this skill most wants to avoid.

## Results

### Results differ between identical runs

Upstream loaders use `RandomCrop` when `center_crop=False`, so upstream
inference is not deterministic even with a fixed seed. `scripts/tryon.py`
passes `center_crop=True`. If you are comparing against an upstream run, that
is the difference.

### Output is soft or degraded for no clear reason

**The LoRA file and the resolution must match.** `512_384_*` with 512×384 and
`--cond-scale 1.0`; `1024_768_*` with 1024×768 and `--cond-scale 2.0`. Mixing
them degrades output in a way that looks exactly like a bad prompt, which sends
you tuning the wrong thing.

### Everything else

Go to `realism.md`. Visual wrongness is almost never an error condition — it is
an input problem with a specific name.

## ImageMagick, on this machine

The binary is at `~/.claude/skills/imagemagick-skill/bin/magick.exe` and is
**not on PATH**. Bare `magick` fails in both bash and PowerShell. Every script
here resolves it explicitly; do the same in anything you write.

### `UnableToOpenConfigureFile 'colors.xml'` is harmless

Every invocation prints it. Named colours still resolve correctly — verified:
`gray50` reads 0.498039, `white` 1, `black` 0. Filter it out of script output
rather than chasing it, and do not switch to hex on account of it.

```bash
bash scripts/sheet.sh ./work draft 2>&1 | grep -v colors.xml
```

### The Q16-HDRI traps

It is a **Q16-HDRI** build, which causes four traps that each cost a cycle in
the predecessor project:

1. **`-level` values are read against 0–65535, not 0–255.** `-level 140,255`
   puts both numbers in the bottom half-percent and blows the image to white.
   **Always express level values as percentages.**
2. **Centre a shading layer with the output range, never `-evaluate add`.**
   Adding lifts highlights until they clip at white, after which an Overlay
   composite screens the print straight off the garment.
3. **`%[fx:mean]` over a masked image counts transparent pixels as black**, so
   a masked mean reads far too low and sends you tuning in the wrong direction.
   Measure on a solid patch of fabric instead.
4. **Place one tile; do not repeat.** A tiled swatch leaves a visible seam. No
   all-over print survives being cut and butted against itself at garment
   scale.

## PowerShell, on this machine

### Write .ps1 files as pure ASCII

**An em-dash in a PowerShell script breaks the parser**, and the error points
somewhere else entirely. This bit while building this skill and is worth
knowing before it costs an hour.

An em-dash is UTF-8 `E2 80 94`. PowerShell 5.1 reads a BOM-less file as
cp1252, where byte `94` decodes to U+201D, a right smart quote — and PowerShell
**accepts smart quotes as string delimiters**. So every em-dash silently opens
a string, and the parser reports "the string is missing the terminator" tens of
lines later, at whatever unrelated line the damage surfaces:

```
At doctor.ps1:173 char:67   The string is missing the terminator: ".
At doctor.ps1:151 char:8    Missing closing '}' in statement block
```

Neither cited line was wrong. The em-dash was on line 52.

Same applies to en-dashes, curly quotes, ellipses and `×`. Keep every `.ps1`
in this skill ASCII-only. To check and repair:

```bash
grep -nP '[^\x00-\x7F]' script.ps1
sed -i 's/\xe2\x80\x94/-/g; s/\xe2\x80\x93/-/g; s/\xc3\x97/x/g' script.ps1
```

Markdown and `.sh` files are unaffected — this is specific to how PowerShell
5.1 decodes a file with no BOM.

### Decimal arguments become commas under a Norwegian locale

This machine runs a Norwegian locale, where PowerShell stringifies `2.5` as
**`2,5`** when splatting it into a native command's argument list. Python's
argparse then rejects it, and the error surfaces as a Python problem in a
script you did not write:

```
would run: python tryon.py ... --guidance 2,5 ...
```

Force invariant culture on every non-integer argument crossing into a native
command:

```powershell
$inv = [System.Globalization.CultureInfo]::InvariantCulture
$GuidanceStr = $Guidance.ToString($inv)
```

Caught here by a `-DryRun` that printed the assembled command line. That is
what `-DryRun` is for on every script in this skill — use it before any long
GPU run, because a four-minute load followed by an argparse error is an
expensive way to find a comma.

### Two more, each of which cost an hour in the predecessor project

**Comma binds before subtraction inside an index.** `$mask[$x - 1, $y]` does
not index a 2-D array — PowerShell evaluates `$x - @(1, $y)` and fails with
*"[System.Object[]] does not contain a method named 'op_Subtraction'"*. Write
`$mask[($x - 1), $y]`. The error points at the array, never at the comma, and
it reads exactly like a parameter-binding problem.

**Variables are case-insensitive.** `foreach ($h in $HANDS)` silently
overwrites `$H` set a hundred lines earlier, and it fails much later somewhere
unrelated — typically at a constructor, with *"Cannot find an overload for
'new' and the argument count"*. Never give a loop variable a single-letter name
that any other variable uses in any case.

Also: this build is Windows PowerShell 5.1. No `&&`, no `||`, no ternary, no
`??`. Use `; if ($?) { }` for conditional chaining.
