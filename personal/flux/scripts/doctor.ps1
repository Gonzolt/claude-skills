# Environment check for the flux skill. Run this before blaming a model.

$SkillDir = Split-Path -Parent $PSScriptRoot
$VenvDir  = Join-Path $SkillDir "repo\.venv"
$Py       = Join-Path $VenvDir "Scripts\python.exe"

Write-Host "=== flux skill doctor ===`n"

if (Test-Path $Py) { Write-Host "[ok]   venv: $VenvDir" }
else { Write-Host "[FAIL] no venv -- run scripts/setup.ps1"; exit 1 }

if ($env:HF_TOKEN) { Write-Host "[ok]   HF_TOKEN is set" }
else { Write-Host "[warn] HF_TOKEN not set -- every model except schnell is gated and will 401" }

Write-Host "`n--- GPU ---"
nvidia-smi --query-gpu=name,memory.total,memory.used,driver_version --format=csv,noheader

Write-Host "`n--- python packages ---"
& $Py -c @"
import importlib, torch
print('torch      ', torch.__version__, '| built for cuda', torch.version.cuda)
if torch.cuda.is_available():
    cap = torch.cuda.get_device_capability(0)
    free, total = torch.cuda.mem_get_info()
    print('gpu        ', torch.cuda.get_device_name(0), f'sm_{cap[0]}{cap[1]}')
    print('vram       ', f'{free/2**30:.1f} GB free of {total/2**30:.1f} GB')
    if cap >= (12, 0) and int(torch.version.cuda.split('.')[0]) < 12:
        print('  !! this torch build predates Blackwell; reinstall from the cu128 index')
else:
    print('  !! torch.cuda.is_available() is False')
for mod in ('diffusers', 'transformers', 'bitsandbytes', 'accelerate', 'peft', 'flux'):
    try:
        m = importlib.import_module(mod)
        print(f'{mod:<11}', getattr(m, '__version__', 'installed'))
    except Exception as e:
        print(f'{mod:<11} MISSING ({type(e).__name__})')
"@

Write-Host "`n--- cached weights ---"
$HfHome = if ($env:HF_HOME) { $env:HF_HOME } else { Join-Path $env:USERPROFILE ".cache\huggingface" }
$Hub = Join-Path $HfHome "hub"
if (Test-Path $Hub) {
    Get-ChildItem $Hub -Directory -Filter "models--black-forest-labs*" | ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1GB
        Write-Host ("  {0,-52} {1,6:N1} GB" -f $_.Name, $size)
    }
} else {
    Write-Host "  no HF cache yet at $Hub"
}

$Free = (Get-PSDrive C).Free / 1GB
Write-Host ("`nC: free: {0:N0} GB" -f $Free)
if ($Free -lt 40) { Write-Host "[warn] under 40 GB free -- a fresh model family may not fit" }
