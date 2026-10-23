<#
    onmodel stage 2 - cast the model.

    ASCII ONLY. An em-dash in a .ps1 breaks the PowerShell 5.1 parser and the
    error points at an unrelated line. See references/troubleshooting.md.

    Generate candidates:
        powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work .\work -Age 7 -Subject girl -Count 6

    Promote the one you picked to master.png:
        powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work .\work -Pick 3

    One image decides the whole campaign: every garment is tried on this exact
    file, so pose, framing, lighting and base layer are inherited by every
    result. Casting is a SELECTION problem, not a prompting problem - generate
    a sheet, pick on pose first, then refine with the seed held fixed.

    Model loading dominates the clock. The first run also downloads FLUX.1
    schnell (~24 GB, ungated, Apache-2.0); say so before starting it.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $Work,

    # --- casting brief ---
    [string] $Age        = "7-year-old",
    [string] $Subject    = "girl",
    [string] $Expression = "a relaxed neutral expression, looking straight at the camera",
    [string] $Hair       = "Their hair is tied back behind their shoulders, clear of the chest.",
    [string] $Backdrop   = "warm off-white",
    [string] $Light      = "camera-left",
    [string] $Extra      = "",

    # --- generation ---
    [int]    $Count   = 6,
    [int]    $Seed    = 0,
    [int]    $Width   = 1152,
    [int]    $Height  = 1536,
    [ValidateSet("schnell", "dev", "krea")][string] $Model = "schnell",
    [int]    $Steps   = 0,

    # --- selection ---
    [int]    $Pick    = 0,

    [switch] $DryRun
)

$ErrorActionPreference = 'Stop'

$SkillDir  = Split-Path -Parent $PSScriptRoot
$SkillsDir = Split-Path -Parent $SkillDir
$Magick    = Join-Path $SkillsDir 'imagemagick-skill\bin\magick.exe'
$Generate  = Join-Path $SkillsDir 'flux\scripts\generate.py'

# Prefer the flux venv if it exists; otherwise the RefTon venv, which carries
# diffusers, transformers and bitsandbytes and runs generate.py unmodified.
$Python = Join-Path $SkillsDir 'flux\repo\.venv\Scripts\python.exe'
if (-not (Test-Path $Python)) { $Python = Join-Path $SkillsDir 'refton\repo\.venv\Scripts\python.exe' }
if (-not (Test-Path $Python)) { throw "No usable venv. Run the refton setup script (see doctor.ps1)." }
if (-not (Test-Path $Generate)) { throw "flux skill not found at $Generate" }

$ModelDir = Join-Path $Work 'model'
$CandDir  = Join-Path $ModelDir 'candidates'
$CastJson = Join-Path $ModelDir 'cast.json'
$Master   = Join-Path $ModelDir 'master.png'

# ---------------------------------------------------------------- promote --
# -Pick promotes an already-generated candidate. No model load, no GPU.

if ($Pick -gt 0) {
    if (-not (Test-Path $CastJson)) { throw "No cast.json in $ModelDir - generate candidates first." }
    $cast = Get-Content $CastJson -Raw | ConvertFrom-Json
    $cands = @($cast.candidates)
    if ($Pick -gt $cands.Count) { throw "Only $($cands.Count) candidates exist; asked for $Pick." }

    $chosen = $cands[$Pick - 1]
    Copy-Item $chosen.file $Master -Force

    $cast | Add-Member -NotePropertyName 'picked' -NotePropertyValue $chosen -Force
    $cast | Add-Member -NotePropertyName 'master' -NotePropertyValue $Master -Force
    $cast | ConvertTo-Json -Depth 6 | Set-Content $CastJson -Encoding utf8

    Write-Host ""
    Write-Host "master.png  <-  candidate $Pick  (seed $($chosen.seed))" -ForegroundColor Green
    Write-Host "  $Master"
    Write-Host ""
    Write-Host "Before running any try-on, check every box in references/casting.md:"
    Write-Host "  arms clear of the torso, hands open and separated, nothing crossing"
    Write-Host "  the chest, plain close-fitting mid-grey base layer, head to mid-thigh"
    Write-Host "  with side clearance, correct finger count, age reading in the body"
    Write-Host "  proportions and not only the face, key light matching the garment"
    Write-Host "  references."
    Write-Host ""
    Write-Host "Any unchecked box is a re-cast. It costs 40 seconds now and hours after"
    Write-Host "the try-ons are done."
    exit 0
}

# ----------------------------------------------------------------- prompt --
<#
    Every clause here prevents a specific downstream failure. Do not trim this
    for brevity - references/casting.md has the table of what each one buys.
#>

$prompt = @"
A full-colour studio photograph of a $Age $Subject, standing upright and facing the camera, $Expression.

They wear a plain close-fitting mid-grey crew-neck t-shirt with no print, no text and no logo, and plain mid-grey trousers. The clothing is simple and unremarkable.

Their arms hang away from their sides with a slight bend at the elbow, hands open and clearly separated from the body, nothing crossing the chest or stomach. $Hair

Framed head to mid-thigh, centred, full body width visible with room either side. Plain seamless $Backdrop studio backdrop, evenly lit.

Shot on an 85mm lens at f/4 on a full-frame camera, large soft key light from slightly $Light, gentle fill, soft natural shadows, neutral white balance, crisp focus on the face, realistic skin texture with visible pores and fine detail, natural photographic grain.
"@

if ($Extra) { $prompt = $prompt + "`n`n" + $Extra }
$prompt = ($prompt -replace "`r`n", " " -replace "`n", " " -replace "\s+", " ").Trim()

if ($Steps -le 0) {
    $Steps = 4
    if ($Model -ne "schnell") { $Steps = 28 }
}

Write-Host ""
Write-Host "Casting brief" -ForegroundColor Cyan
Write-Host "  subject   : $Age $Subject"
Write-Host "  model     : FLUX.1 $Model  ($Steps steps)"
Write-Host "  size      : ${Width}x${Height}  (3:4, downsampled to 384x512 or 768x1024 at try-on)"
Write-Host "  candidates: $Count"
Write-Host "  python    : $Python"
Write-Host ""
Write-Host "Prompt:"
Write-Host "  $prompt"
Write-Host ""

if ($Model -ne "schnell") {
    Write-Host "NOTE: FLUX.1 $Model is under the non-commercial licence. Only schnell" -ForegroundColor Yellow
    Write-Host "      (Apache-2.0) keeps this stage commercially clean." -ForegroundColor Yellow
    Write-Host ""
}

if ($DryRun) { Write-Host "-DryRun: stopping before generation."; exit 0 }

New-Item -ItemType Directory -Force -Path $CandDir | Out-Null

# ------------------------------------------------------------- generation --

if ($Seed -le 0) { $Seed = 1000 }

$candidates = @()
$sw = [Diagnostics.Stopwatch]::StartNew()

for ($i = 0; $i -lt $Count; $i++) {
    $s = $Seed + $i
    $out = Join-Path $CandDir ("cand-{0:d2}-seed{1}.png" -f ($i + 1), $s)

    Write-Host ("[{0}/{1}] seed {2} ..." -f ($i + 1), $Count, $s) -NoNewline
    $t0 = [Diagnostics.Stopwatch]::StartNew()

    & $Python $Generate t2i `
        --model $Model --prompt $prompt `
        --width $Width --height $Height `
        --steps $Steps --seed $s --out $out

    $t0.Stop()

    if (Test-Path $out) {
        Write-Host (" {0:n0}s  {1}" -f $t0.Elapsed.TotalSeconds, (Split-Path -Leaf $out)) -ForegroundColor Green
        $candidates += [pscustomobject]@{ index = $i + 1; seed = $s; file = $out }
    } else {
        Write-Host " FAILED (no output file)" -ForegroundColor Red
    }
}

$sw.Stop()

if ($candidates.Count -eq 0) {
    Write-Host ""
    Write-Host "Nothing was generated. Quote the actual error above rather than retrying blindly." -ForegroundColor Red
    Write-Host "A 401/403 means the HF licence was not accepted; see references/troubleshooting.md."
    exit 1
}

# ------------------------------------------------------------------ sheet --

$sheet = Join-Path $ModelDir 'candidates.png'
if (Test-Path $Magick) {
    $args = @()
    foreach ($c in $candidates) {
        $args += @('(', $c.file, '-resize', '300x400', '-background', 'white',
                   '-gravity', 'south', '-splice', '0x30',
                   '-pointsize', '17', '-fill', 'black',
                   '-annotate', '+0+6', ("{0}   seed {1}" -f $c.index, $c.seed), ')')
    }
    $args += @('-background', '#DDDDDD', '+append', $sheet)
    & $Magick $args
}

# ------------------------------------------------------------------ write --

$cast = [pscustomobject]@{
    prompt     = $prompt
    model      = $Model
    steps      = $Steps
    width      = $Width
    height     = $Height
    brief      = [pscustomobject]@{
        age = $Age; subject = $Subject; expression = $Expression
        hair = $Hair; backdrop = $Backdrop; light = $Light; extra = $Extra
    }
    candidates = $candidates
    generated  = (Get-Date).ToString('s')
}
$cast | ConvertTo-Json -Depth 6 | Set-Content $CastJson -Encoding utf8

Write-Host ""
Write-Host ("{0} candidates in {1:n0}s" -f $candidates.Count, $sw.Elapsed.TotalSeconds) -ForegroundColor Green
if (Test-Path $sheet) { Write-Host "  sheet: $sheet" }
Write-Host "  cast : $CastJson"
Write-Host ""
Write-Host "Pick on POSE AND FRAMING first, face second. A beautiful frame with folded"
Write-Host "arms is useless for try-on; a plain frame with clean arms works for every"
Write-Host "garment. Then:"
Write-Host ""
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/cast.ps1 -Work $Work -Pick <n>"
Write-Host ""
