<#
    onmodel stage 3 - try-on.

    ASCII ONLY (see references/troubleshooting.md).

    Draft every garment at 512x384:
        powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work .\work

    Finals at 1024x768, once the drafts are judged good:
        powershell -ExecutionPolicy Bypass -File scripts/tryon-batch.ps1 -Work .\work -Final

    One garment only:
        ... -Only 13264769-308427-barn

    Build an outfit instead of swapping single items (a top, then trousers over
    the result, and so on - the way to handle a product list that mixes body
    regions):
        ... -Chain

    NEVER run the final pass on a garment whose draft is wrong. The fix for a
    wrong draft is a better reference or a tighter crop - not more steps, not a
    new seed, not more guidance. references/realism.md maps symptom to cause.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Work,
    [switch] $Final,
    [string] $Only = "",
    [switch] $Chain,
    [int]    $Seed = 42,
    [int]    $Steps = 28,
    [double] $Guidance = 2.5,
    [ValidateSet("nf4", "bf16")][string] $Quant = "nf4",
    [ValidateSet("model", "sequential", "none")][string] $Offload = "model",
    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

$SkillDir  = Split-Path -Parent $PSScriptRoot
$SkillsDir = Split-Path -Parent $SkillDir
$Refton    = Join-Path $SkillsDir 'refton'
$Python    = Join-Path $Refton 'repo\.venv\Scripts\python.exe'
$TryOn     = Join-Path $Refton 'scripts\tryon.py'

if (-not (Test-Path $Python)) { throw "RefTon venv missing. See doctor.ps1." }
if (-not (Test-Path $TryOn))  { throw "RefTon wrapper missing at $TryOn" }

# The LoRA file and the resolution MUST match. Mixing them degrades output in a
# way that looks exactly like a bad prompt, which sends you tuning the wrong
# thing entirely. tryon.py picks the LoRA from --height, so setting height and
# cond-scale together is enough.
if ($Final) {
    $H = 1024; $W = 768; $Cond = 2.0; $Tier = "final"
} else {
    $H = 512;  $W = 384; $Cond = 1.0; $Tier = "draft"
}

$OutDir = Join-Path $Work ("tryon\" + $Tier)
$Picks  = Join-Path $Work 'garments\picks.json'
$Master = Join-Path $Work 'model\master-prepped.png'

if (-not (Test-Path $Picks))  { throw "No $Picks - run fetch-garments.mjs then prep.sh." }
if (-not (Test-Path $Master)) { throw "No $Master - run cast.ps1 then prep.sh." }

# Locale trap, and it is silent: this machine runs a Norwegian locale, where
# PowerShell stringifies 2.5 as "2,5" when splatting it into a native command's
# argument list. Python's argparse then rejects it as a float, or worse, some
# tools parse it as 2. Force invariant culture on every non-integer argument.
$inv = [System.Globalization.CultureInfo]::InvariantCulture
$GuidanceStr = $Guidance.ToString($inv)
$CondStr     = $Cond.ToString($inv)

$picks = Get-Content $Picks -Raw | ConvertFrom-Json
$handles = @($picks.PSObject.Properties.Name)
if ($Only) { $handles = @($handles | Where-Object { $_ -eq $Only }) }
if ($handles.Count -eq 0) { throw "No garments to process (checked -Only '$Only')." }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host ""
Write-Host "RefTon try-on - $Tier pass" -ForegroundColor Cyan
Write-Host "  resolution : ${W}x${H}   cond-scale $CondStr"
Write-Host "  quant      : $Quant / offload $Offload"
Write-Host "  garments   : $($handles.Count)"
if ($Chain) { Write-Host "  mode       : CHAIN - each result becomes the person image for the next" }
Write-Host ""
if (-not $Final) {
    Write-Host "  Expect roughly 1-2 min to load, then 2-4 min per image." -ForegroundColor DarkGray
} else {
    Write-Host "  Finals are 3-4x the sampling cost of a draft. If it OOMs, use" -ForegroundColor DarkGray
    Write-Host "  -Offload sequential rather than dropping back to 512." -ForegroundColor DarkGray
}
Write-Host ""

$person = $Master
$results = @()
$noRef = @()
$swAll = [Diagnostics.Stopwatch]::StartNew()

foreach ($handle in $handles) {
    $entry = $picks.$handle
    $dir   = Join-Path $Work "garments\$handle"
    $cloth = Join-Path $dir 'cloth.png'
    $ref   = Join-Path $dir 'reference.png'
    $out   = Join-Path $OutDir "$handle.png"

    if (-not (Test-Path $cloth)) {
        Write-Host "  $handle : no prepped cloth.png - run prep.sh" -ForegroundColor Red
        continue
    }

    $hasRef = Test-Path $ref
    if (-not $hasRef) { $noRef += $handle }

    $mode = "person + cloth + REFERENCE"
    if (-not $hasRef) { $mode = "person + cloth only (no reference)" }

    Write-Host ("  {0}" -f $handle)
    Write-Host ("    mode   : {0}" -f $mode)
    if ($Chain -and $person -ne $Master) {
        Write-Host ("    person : {0}  (chained)" -f (Split-Path -Leaf $person))
    }

    $argv = @(
        $TryOn,
        '--cloth', $cloth,
        '--person', $person,
        '--out', $out,
        '--height', $H, '--width', $W,
        '--cond-scale', $CondStr,
        '--steps', $Steps,
        '--guidance', $GuidanceStr,
        '--seed', $Seed,
        '--quant', $Quant,
        '--offload', $Offload
    )
    if ($hasRef) { $argv += @('--reference', $ref) }

    if ($DryRun) {
        Write-Host ("    would run: python " + ($argv -join ' ')) -ForegroundColor DarkGray
        continue
    }

    $t0 = [Diagnostics.Stopwatch]::StartNew()
    & $Python $argv
    $t0.Stop()

    if (Test-Path $out) {
        Write-Host ("    done   : {0:n0}s  {1}" -f $t0.Elapsed.TotalSeconds, $out) -ForegroundColor Green
        $results += [pscustomobject]@{
            handle = $handle; file = $out; reference = $hasRef
            seconds = [math]::Round($t0.Elapsed.TotalSeconds); tier = $Tier
        }
        if ($Chain) { $person = $out }
    } else {
        Write-Host "    FAILED : no output file" -ForegroundColor Red
        Write-Host "    Quote the actual error above. If it was load_lora_weights, that is"
        Write-Host "    the known peft-on-NF4 issue: rerun with -Quant bf16 -Offload sequential."
        Write-Host "    A run without the LoRA is not RefTon and must not be presented as one."
    }
}

$swAll.Stop()

if ($DryRun) { exit 0 }

$manifest = Join-Path $OutDir 'results.json'
$results | ConvertTo-Json -Depth 5 | Set-Content $manifest -Encoding utf8

Write-Host ""
Write-Host ("{0}/{1} produced in {2:n0}s" -f $results.Count, $handles.Count, $swAll.Elapsed.TotalSeconds) -ForegroundColor Green
Write-Host "  $OutDir"
Write-Host ""

if ($noRef.Count -gt 0) {
    Write-Host "Ran WITHOUT a reference for: $($noRef -join ', ')" -ForegroundColor Yellow
    Write-Host "  That is a plain Kontext try-on, not RefTon's reference mode. Say so when"
    Write-Host "  reporting these results - the drape and print scale are invented."
    Write-Host ""
}

Write-Host "Now build the review sheet and READ IT before judging anything good:"
Write-Host ""
Write-Host "  bash scripts/sheet.sh $Work $Tier"
Write-Host ""
