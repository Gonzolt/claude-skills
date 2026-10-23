# One-time environment build for the flux skill.
# ~10 GB, ~15 min. Downloads no model weights -- that happens on first run.

$ErrorActionPreference = "Stop"

$SkillDir = Split-Path -Parent $PSScriptRoot
$RepoDir  = Join-Path $SkillDir "repo"
$VenvDir  = Join-Path $RepoDir ".venv"
$Py       = Join-Path $VenvDir "Scripts\python.exe"

# --- interpreter -------------------------------------------------------------
# 3.11 is the sweet spot: the repo needs >=3.10, and several wheels in the
# diffusers stack still lag behind 3.13.
$Base = (py -3.11 -c "import sys; print(sys.executable)" 2>$null)
if (-not $Base) {
    Write-Host "Python 3.11 not found via the py launcher; falling back to 'python'."
    $Base = (Get-Command python).Source
}
Write-Host "Base interpreter: $Base"

if (-not (Test-Path $VenvDir)) {
    Write-Host "Creating venv at $VenvDir ..."
    & $Base -m venv $VenvDir
}

& $Py -m pip install --upgrade pip setuptools wheel

# --- torch first, from the cu128 index --------------------------------------
# The repo's [torch] extra pins torch==2.6.0 (cu124 wheels), which has no
# sm_120 kernels and fails on this RTX 5070. Installing torch up front and
# then `pip install -e .` (base deps, no torch pin) keeps cu128 in place.
Write-Host "Installing torch/torchvision (cu128) ..."
& $Py -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128

# --- upstream repo, without the torch extra ---------------------------------
Write-Host "Installing the flux package (editable) ..."
Push-Location $RepoDir
try { & $Py -m pip install -e . } finally { Pop-Location }

# --- diffusers lane ----------------------------------------------------------
Write-Host "Installing the diffusers/quantization stack ..."
& $Py -m pip install `
    "diffusers>=0.35.0" `
    "transformers>=4.51" `
    accelerate `
    "bitsandbytes>=0.46" `
    peft `
    safetensors `
    sentencepiece `
    protobuf `
    opencv-python `
    "huggingface_hub[cli]"

# --- smoke test --------------------------------------------------------------
Write-Host ""
& $Py -c @"
import torch
print('torch', torch.__version__, '| cuda', torch.version.cuda)
print('device', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE')
print('capability', torch.cuda.get_device_capability(0) if torch.cuda.is_available() else '-')
"@

Write-Host ""
Write-Host "Done. Activate with:"
Write-Host "  $VenvDir\Scripts\Activate.ps1"
Write-Host "Then set HF_TOKEN and accept the model licences on huggingface.co"
Write-Host "(see references/setup.md)."
