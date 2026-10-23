<#
    onmodel - preflight

    Reports what is installed, what is missing, and the exact remedy for each
    gap. Run it first, every session, and report what it says rather than
    guessing at the state of the machine.

        powershell -ExecutionPolicy Bypass -File scripts/doctor.ps1

    Exit code 0 = ready to run the full pipeline. 1 = something is missing.
#>

$ErrorActionPreference = 'Continue'

$SkillDir  = Split-Path -Parent $PSScriptRoot
$SkillsDir = Split-Path -Parent $SkillDir
$Refton    = Join-Path $SkillsDir 'refton'
$Flux      = Join-Path $SkillsDir 'flux'
$Magick    = Join-Path $SkillsDir 'imagemagick-skill\bin\magick.exe'
$Venv      = Join-Path $Refton 'repo\.venv\Scripts\python.exe'
$Weights   = Join-Path $Refton 'weights'

$problems = @()

function Report($ok, $label, $detail, $remedy) {
    if ($ok) {
        Write-Host ("  [ok]      {0,-22} {1}" -f $label, $detail)
    } else {
        Write-Host ("  [MISSING] {0,-22} {1}" -f $label, $detail) -ForegroundColor Yellow
        $script:problems += ,@($label, $remedy)
    }
}

Write-Host ""
Write-Host "onmodel preflight" -ForegroundColor Cyan
Write-Host "-----------------"
Write-Host ""
Write-Host "Tools"

# --- ImageMagick -------------------------------------------------------------
$magickOk = Test-Path $Magick
$magickVer = ""
if ($magickOk) {
    $magickVer = (& $Magick -version | Select-Object -First 1) -replace '^Version: ', ''
}
Report $magickOk "ImageMagick" $(if ($magickOk) { $magickVer } else { "not found at $Magick" }) `
    "The imagemagick-skill provides the binary. Reinstall that skill."

# --- Node --------------------------------------------------------------------
$node = Get-Command node -ErrorAction SilentlyContinue
Report ($null -ne $node) "Node" $(if ($node) { (& node --version) } else { "not on PATH" }) `
    "Install Node 18+ - needed only for stage 1 (garment fetching)."

# --- Python venv -------------------------------------------------------------
Write-Host ""
Write-Host "RefTon environment"

$venvOk = Test-Path $Venv
Report $venvOk "venv" $(if ($venvOk) { $Venv } else { "not installed" }) `
    "powershell -ExecutionPolicy Bypass -File $Refton\scripts\setup.ps1   (~10 GB, ~15 min)"

$cudaOk = $false
if ($venvOk) {
    $probe = @'
import json, sys
out = {}
try:
    import torch
    out["torch"] = torch.__version__
    out["cuda"] = torch.cuda.is_available()
    if out["cuda"]:
        out["device"] = torch.cuda.get_device_name(0)
        cc = torch.cuda.get_device_capability(0)
        out["sm"] = "sm_%d%d" % cc
        out["vram"] = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 1)
    import diffusers; out["diffusers"] = diffusers.__version__
    import peft; out["peft"] = peft.__version__
    import bitsandbytes; out["bnb"] = bitsandbytes.__version__
except Exception as e:
    out["error"] = "%s: %s" % (type(e).__name__, e)
print(json.dumps(out))
'@
    $tmp = Join-Path $env:TEMP ("onmodel_probe_" + [guid]::NewGuid().ToString("N") + ".py")
    Set-Content -Path $tmp -Value $probe -Encoding utf8
    $raw = & $Venv $tmp 2>$null
    try { Remove-Item $tmp -Force -ErrorAction Stop } catch {}

    $info = $null
    if ($raw) {
        $line = ($raw | Where-Object { $_ -match '^\{' } | Select-Object -Last 1)
        if ($line) { try { $info = $line | ConvertFrom-Json } catch {} }
    }

    if ($info -and -not $info.error) {
        $cudaOk = [bool]$info.cuda
        Report $cudaOk "CUDA" $(if ($cudaOk) {
            "{0}  {1}  {2} GB  torch {3}" -f $info.device, $info.sm, $info.vram, $info.torch
        } else { "torch {0} present but no CUDA device" -f $info.torch }) `
            "Check the NVIDIA driver, and that torch is the cu128 build."
        Report $true "libraries" ("diffusers {0} | peft {1} | bitsandbytes {2}" -f $info.diffusers, $info.peft, $info.bnb) ""
    } else {
        $msg = "probe failed"
        if ($info -and $info.error) { $msg = $info.error }
        Report $false "CUDA" $msg "Rerun the refton setup script; the venv is incomplete."
    }
}

# --- Weights -----------------------------------------------------------------
Write-Host ""
Write-Host "Weights"

$backbone = Join-Path $Weights 'FLUX.1-Kontext-dev'
$backboneOk = Test-Path $backbone
Report $backboneOk "Kontext backbone" $(if ($backboneOk) { $backbone } else { "not downloaded (~31 GB, gated)" }) `
    "powershell -ExecutionPolicy Bypass -File $Refton\scripts\fetch_weights.ps1"

$lora512  = Join-Path $Weights '512_384_pytorch_lora_weights.safetensors'
$lora1024 = Join-Path $Weights '1024_768_pytorch_lora_weights.safetensors'
$l512 = Test-Path $lora512
$l1024 = Test-Path $lora1024
Report $l512  "RefVTON LoRA 512"  $(if ($l512)  { "512_384_pytorch_lora_weights.safetensors" }  else { "not downloaded" }) `
    "Same fetch_weights.ps1 - the LoRA is only ~200 MB of the download."
Report $l1024 "RefVTON LoRA 1024" $(if ($l1024) { "1024_768_pytorch_lora_weights.safetensors" } else { "not downloaded (finals only)" }) `
    "Same fetch_weights.ps1. Needed only for the 1024x768 final pass."

# --- HF credentials ----------------------------------------------------------
# Two ways to be authenticated, and huggingface_hub accepts either. The CLI
# login is the better one: the secret lands in a file the library reads by
# itself and never has to exist as an environment variable. Checking only
# HF_TOKEN would report MISSING for a perfectly working CLI login.

$tok = $env:HF_TOKEN
if (-not $tok) {
    try { $tok = [Environment]::GetEnvironmentVariable('HF_TOKEN', 'User') } catch {}
}
$envOk = -not [string]::IsNullOrWhiteSpace($tok)

$hfHomeDir = $env:HF_HOME
if (-not $hfHomeDir) { $hfHomeDir = Join-Path $env:USERPROFILE '.cache\huggingface' }
$tokenFile = Join-Path $hfHomeDir 'token'
$fileOk = (Test-Path $tokenFile) -and ((Get-Item $tokenFile).Length -gt 0)

$authOk = $envOk -or $fileOk

$how = "not authenticated"
if ($fileOk -and $envOk) { $how = "CLI login + HF_TOKEN" }
elseif ($fileOk)         { $how = "CLI login ($tokenFile)" }
elseif ($envOk)          { $how = "HF_TOKEN environment variable" }

$HfCli = Join-Path $Refton 'repo\.venv\Scripts\hf.exe'
Report $authOk "HF credentials" $how `
    "1) Accept the licence at huggingface.co/black-forest-labs/FLUX.1-Kontext-dev while signed in.  2) Run:  $HfCli auth login   - it can log in via the browser, so the token never has to be typed or pasted anywhere."

# Whoami confirms the token is not just present but actually valid. A revoked
# or mistyped token looks identical to a good one on disk, and only shows up as
# a 401 forty minutes into a download.
if ($authOk -and $venvOk) {
    $who = & $Venv -c "
from huggingface_hub import whoami
try:
    print('as ' + whoami()['name'])
except Exception as e:
    print('INVALID: %s' % type(e).__name__)
" 2>$null | Select-Object -Last 1
    if ($who -and $who -like 'as *') {
        Write-Host ("  [ok]      {0,-22} {1}" -f "HF identity", $who)
    } elseif ($who) {
        Write-Host ("  [MISSING] {0,-22} {1}" -f "HF identity", "token present but rejected") -ForegroundColor Yellow
        $problems += ,@("HF identity", "The stored token is invalid or revoked. Log in again with a fresh Read token.")
    }
}

# --- Casting model -----------------------------------------------------------
Write-Host ""
Write-Host "Casting (stage 2)"

$hfHome = $env:HF_HOME
if (-not $hfHome) { $hfHome = Join-Path $env:USERPROFILE '.cache\huggingface' }
$schnell = Join-Path $hfHome 'hub\models--black-forest-labs--FLUX.1-schnell'
$schnellOk = Test-Path $schnell
Report $schnellOk "FLUX.1-schnell" $(if ($schnellOk) { "cached" } else { "not cached (~24 GB, ungated, Apache-2.0)" }) `
    "Downloads automatically on the first cast run. Say so before starting it."

$fluxVenv = Test-Path (Join-Path $Flux 'repo\.venv\Scripts\python.exe')
if ($fluxVenv) {
    Write-Host "  [note]    flux venv              present; cast.py can use either venv"
} else {
    Write-Host "  [note]    flux venv              absent - not required, cast.py runs on the RefTon venv"
}

# --- Summary -----------------------------------------------------------------
Write-Host ""
if ($problems.Count -eq 0) {
    Write-Host "Ready. Full pipeline can run." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host ("{0} thing(s) to fix:" -f $problems.Count) -ForegroundColor Yellow
Write-Host ""
foreach ($p in $problems) {
    if ($p[1]) {
        Write-Host ("  {0}" -f $p[0]) -ForegroundColor Yellow
        Write-Host ("      {0}" -f $p[1])
    }
}
Write-Host ""
Write-Host "Stages 1 (garments), 4 (finish) and 5 (sheet) need only Node and ImageMagick,"
Write-Host "so they can run before the weights finish downloading."
Write-Host ""
exit 1
