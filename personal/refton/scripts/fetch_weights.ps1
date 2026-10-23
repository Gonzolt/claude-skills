# Downloads the FLUX.1-Kontext-dev backbone (~31 GB, gated) and the RefTon
# LoRAs (~0.4 GB) into <skill>/weights.

$ErrorActionPreference = "Stop"

$SkillDir   = Split-Path -Parent $PSScriptRoot
$Py         = Join-Path $SkillDir "repo\.venv\Scripts\python.exe"
$WeightsDir = Join-Path $SkillDir "weights"

if (-not (Test-Path $Py)) {
    Write-Host "No venv -- run scripts/setup.ps1 first."; exit 1
}
if (-not (Test-Path $WeightsDir)) { New-Item -ItemType Directory $WeightsDir | Out-Null }

if (-not $env:HF_TOKEN) {
    Write-Host "HF_TOKEN is not set. FLUX.1-Kontext-dev is a gated repo:"
    Write-Host "  1. sign in and accept the licence at"
    Write-Host "     https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev"
    Write-Host "  2. setx HF_TOKEN ""hf_xxx"" and restart this shell"
    Write-Host "Continuing anyway -- the backbone download will 401 without it."
}

$Free = (Get-PSDrive C).Free / 1GB
Write-Host ("C: free: {0:N0} GB (need ~32 GB)" -f $Free)
if ($Free -lt 40) { Write-Host "Not enough free space. Aborting."; exit 1 }

# --- RefTon LoRAs ------------------------------------------------------------
Write-Host "`nDownloading RefTon LoRA weights (qihoo360/RefVTON) ..."
& $Py -m huggingface_hub.commands.huggingface_cli download `
    qihoo360/RefVTON `
    512_384_pytorch_lora_weights.safetensors `
    1024_768_pytorch_lora_weights.safetensors `
    --local-dir $WeightsDir

# --- FLUX.1-Kontext-dev backbone --------------------------------------------
$BackboneDir = Join-Path $WeightsDir "FLUX.1-Kontext-dev"
# The diffusers subfolder layout is what the pipeline loads. Skipping the
# single-file original checkpoint and the original-format autoencoder saves
# ~22.5 GB of the repo's 54 GB.
Write-Host "`nDownloading FLUX.1-Kontext-dev, diffusers layout (~31 GB) ..."
& $Py -m huggingface_hub.commands.huggingface_cli download `
    black-forest-labs/FLUX.1-Kontext-dev `
    --local-dir $BackboneDir `
    --exclude "*.gguf" "flux1-kontext-dev.safetensors" "ae.safetensors"

Write-Host "`nContents of $WeightsDir :"
Get-ChildItem $WeightsDir | ForEach-Object {
    if ($_.PSIsContainer) {
        $size = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1GB
        Write-Host ("  {0,-46} {1,7:N1} GB" -f $_.Name, $size)
    } else {
        Write-Host ("  {0,-46} {1,7:N1} GB" -f $_.Name, ($_.Length / 1GB))
    }
}

Write-Host "`nSmoke test:"
Write-Host "  python scripts/tryon.py --cloth repo/example/cloth/01.jpg --person repo/example/person/01.jpg --reference repo/example/image_ref/01.jpg --out output/smoke.png"
