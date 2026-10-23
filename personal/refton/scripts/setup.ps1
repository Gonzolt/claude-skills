# One-time environment build for the refton skill.
# ~10 GB, ~15 min. Model weights come separately: scripts/fetch_weights.ps1

$ErrorActionPreference = "Stop"

$SkillDir = Split-Path -Parent $PSScriptRoot
$RepoDir  = Join-Path $SkillDir "repo"
$VenvDir  = Join-Path $RepoDir ".venv"
$Py       = Join-Path $VenvDir "Scripts\python.exe"

# Upstream targets python 3.12 via conda; 3.11 is the safest on Windows for
# this dependency set and satisfies everything the repo imports.
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

# cu128 wheels: the repo pins torch==2.7.1 with Linux-only nvidia-*-cu12
# packages built for CUDA 12.6, which has no sm_120 kernels for this RTX 5070.
Write-Host "Installing torch/torchvision (cu128) ..."
& $Py -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128

# Curated subset of requirements.txt: inference stack + what the dataset and
# pipeline modules actually import. deepspeed/wandb/kaggle are training-only
# and are left out (see references/training.md).
Write-Host "Installing the RefTon runtime stack ..."
& $Py -m pip install `
    "diffusers>=0.35.0" `
    "transformers>=4.51" `
    accelerate `
    peft `
    "bitsandbytes>=0.46" `
    safetensors `
    sentencepiece `
    protobuf `
    numpy `
    pillow `
    matplotlib `
    opencv-python `
    scikit-image `
    timm `
    tqdm `
    omegaconf `
    "huggingface_hub[cli]"

Write-Host ""
& $Py -c @"
import torch
print('torch', torch.__version__, '| cuda', torch.version.cuda)
print('device', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE')
print('capability', torch.cuda.get_device_capability(0) if torch.cuda.is_available() else '-')
import diffusers, peft; print('diffusers', diffusers.__version__, '| peft', peft.__version__)
"@

Write-Host ""
Write-Host "Next: set HF_TOKEN, accept the FLUX.1-Kontext-dev licence, then run"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/fetch_weights.ps1"
