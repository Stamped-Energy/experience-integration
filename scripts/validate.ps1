# Workspace full-stack validation orchestrator (Phase N / commit 71).
# Chains what is available: repo presence -> fast unit subset -> CNC smoke.
# Exit 0 = healthy enough for a local/CI gate; non-zero = stop the release.
#
# Usage (from L1-L6 root):
#   powershell -File scripts/validate.ps1
#   powershell -File scripts/validate.ps1 -SkipSmoke
#   $env:VALIDATE_FULL = "1"; powershell -File scripts/validate.ps1
#
# Companion: scripts/validate.sh (bash / Git Bash / WSL).

[CmdletBinding()]
param(
    [switch]$SkipSmoke,
    [switch]$Full
)

$ErrorActionPreference = "Continue"
# Resolve L1-L6 workspace root whether invoked from L1-L6/scripts or a repo copy
# under experience-integration/scripts (or scripts/workspace).
$here = $PSScriptRoot
$Root = $null
foreach ($cand in @(
    (Join-Path $here ".."),
    (Join-Path $here "..\.."),
    (Join-Path $here "..\..\..")
)) {
    $resolved = Resolve-Path $cand -ErrorAction SilentlyContinue
    if (-not $resolved) { continue }
    if (Test-Path -LiteralPath (Join-Path $resolved "universal-repositary") -PathType Container) {
        $Root = $resolved
        break
    }
}
if (-not $Root) {
    Write-Host "validate.ps1: cannot find L1-L6 workspace (universal-repositary missing)" -ForegroundColor Red
    exit 1
}
Set-Location $Root
Write-Host "workspace root: $Root"

$script:Failures = New-Object System.Collections.Generic.List[string]
$script:Skipped = New-Object System.Collections.Generic.List[string]

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "== validate: $msg ==" -ForegroundColor Cyan
}

function Add-Fail([string]$msg) {
    [void]$script:Failures.Add($msg)
    Write-Host "FAIL: $msg" -ForegroundColor Red
}

function Add-Skip([string]$msg) {
    [void]$script:Skipped.Add($msg)
    Write-Host "SKIP: $msg" -ForegroundColor Yellow
}

function Test-RepoPath([string]$rel) {
    $p = Join-Path $Root $rel
    if (Test-Path -LiteralPath $p -PathType Container) {
        Write-Host "ok  $rel"
        return $true
    }
    Add-Fail "missing key repo: $rel"
    return $false
}

# Demo / Proof Run env must not leak into unit tests (ENABLE_CNC, PROOF_RUN, …).
$script:DemoEnvKeys = @(
    "ENABLE_CNC", "PROOF_RUN", "ENABLE_IDLE_LOAD", "ENABLE_IDLE_FURNACE",
    "ENABLE_SEC", "ENABLE_WARM", "L4_DEFAULT_LANE", "L4_MONEY_PACK_LANE_A",
    "DEMO_PROFILE", "LNM_DEMO"
)

function Clear-DemoEnv {
    $saved = @{}
    foreach ($k in $script:DemoEnvKeys) {
        $saved[$k] = [Environment]::GetEnvironmentVariable($k, "Process")
        Remove-Item -Path "Env:$k" -ErrorAction SilentlyContinue
        [Environment]::SetEnvironmentVariable($k, $null, "Process")
    }
    return $saved
}

function Restore-DemoEnv([hashtable]$saved) {
    foreach ($k in $saved.Keys) {
        $v = $saved[$k]
        if ($null -eq $v -or $v -eq "") {
            Remove-Item -Path "Env:$k" -ErrorAction SilentlyContinue
            [Environment]::SetEnvironmentVariable($k, $null, "Process")
        } else {
            Set-Item -Path "Env:$k" -Value $v
            [Environment]::SetEnvironmentVariable($k, $v, "Process")
        }
    }
}

function Get-GitBash {
    $candidates = @(
        (Join-Path ${env:ProgramFiles} "Git\bin\bash.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Git\bin\bash.exe"),
        "C:\Program Files\Git\bin\bash.exe"
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c)) { return $c }
    }
    # Prefer Git Bash over broken WSL stub (System32\bash.exe → WSL disk missing).
    $cmd = Get-Command bash -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -notmatch '\\System32\\bash\.exe$') {
        return $cmd.Source
    }
    return $null
}

function Invoke-PyTestFast {
    param(
        [string]$repoRel,
        [string]$testsRel,
        [string[]]$ExtraArgs = @()
    )
    $repo = Join-Path $Root $repoRel
    $tests = Join-Path $repo $testsRel
    if (-not (Test-Path -LiteralPath $tests)) {
        Add-Skip "$repoRel - no $testsRel"
        return
    }
    Write-Step "fast pytest $repoRel/$testsRel"
    Push-Location $repo
    $saved = Clear-DemoEnv
    try {
        $py = Get-Command python -ErrorAction SilentlyContinue
        if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
        if (-not $py) {
            Add-Fail "$repoRel - python not on PATH"
            return
        }
        $args = @($testsRel, "-q", "--tb=line", "-x", "--maxfail=3") + $ExtraArgs
        & $py.Source -m pytest @args
        if ($LASTEXITCODE -ne 0) {
            Add-Fail "$repoRel pytest exited $LASTEXITCODE"
        } else {
            Write-Host "ok  $repoRel pytest"
        }
    } catch {
        Add-Fail "$repoRel pytest error: $_"
    } finally {
        Restore-DemoEnv $saved
        Pop-Location
    }
}

function Invoke-RepoValidateSh([string]$repoRel) {
    $sh = Join-Path $Root (Join-Path $repoRel (Join-Path "scripts" "validate.sh"))
    if (-not (Test-Path -LiteralPath $sh)) {
        Add-Skip "$repoRel - no scripts/validate.sh"
        return
    }
    $bash = Get-GitBash
    if (-not $bash) {
        Add-Skip "$repoRel validate.sh - Git Bash not available (WSL bash skipped)"
        return
    }
    Write-Step "repo validate.sh $repoRel (via $bash)"
    Push-Location (Join-Path $Root $repoRel)
    $saved = Clear-DemoEnv
    try {
        & $bash "./scripts/validate.sh"
        if ($LASTEXITCODE -ne 0) {
            Add-Fail "$repoRel validate.sh exited $LASTEXITCODE"
        } else {
            Write-Host "ok  $repoRel validate.sh"
        }
    } catch {
        Add-Fail "$repoRel validate.sh error: $_"
    } finally {
        Restore-DemoEnv $saved
        Pop-Location
    }
}

# --- 1. Key repos -----------------------------------------------------------
Write-Step "key repos present"
$KeyRepos = @(
    "universal-repositary",
    "Intellience - L3\intelligence-core",
    "Intellience - L3\intelligence-rulepacks",
    "knowledge-reasoning",
    "experience-integration",
    "connectors-edge",
    "closure-verification"
)
$reposOk = $true
foreach ($r in $KeyRepos) {
    if (-not (Test-RepoPath $r)) { $reposOk = $false }
}
if (-not $reposOk) {
    Write-Host ""
    Write-Host "validate.ps1: FAILED (missing repos)" -ForegroundColor Red
    exit 1
}

# --- 2. Fast test subset ----------------------------------------------------
Invoke-PyTestFast "Intellience - L3\intelligence-core" "tests\unit"
# Rulepacks: unit/schema only (skip e2e/fuzz) for the fast workspace gate
if (Test-Path -LiteralPath (Join-Path $Root "Intellience - L3\intelligence-rulepacks\tests\unit")) {
    Invoke-PyTestFast "Intellience - L3\intelligence-rulepacks" "tests\unit"
} else {
    Invoke-PyTestFast "Intellience - L3\intelligence-rulepacks" "tests" -ExtraArgs @("--ignore=tests/e2e", "-m", "not fuzz")
}
Invoke-PyTestFast "knowledge-reasoning" "tests\unit"
Invoke-PyTestFast "closure-verification" "tests\unit"

$useFull = $Full -or ($env:VALIDATE_FULL -eq "1")
if ($useFull) {
    Write-Step "VALIDATE_FULL - per-repo validate.sh"
    foreach ($r in @(
        "Intellience - L3\intelligence-core",
        "Intellience - L3\intelligence-rulepacks",
        "knowledge-reasoning",
        "experience-integration",
        "closure-verification"
    )) {
        Invoke-RepoValidateSh $r
    }
} else {
    Add-Skip "per-repo validate.sh (set VALIDATE_FULL=1 or -Full)"
}

# --- 3. CNC smoke (fixtures mode - no Docker required) ----------------------
$skipSmokeEnv = $SkipSmoke -or ($env:SKIP_SMOKE -eq "1")
$smokeLauncher = Join-Path $Root "scripts\smoke_l1_to_l6_cnc.py"
$smokeCore = Join-Path $Root "Intellience - L3\intelligence-core\scripts\smoke_l1_to_l6_cnc.py"

if ($skipSmokeEnv) {
    Add-Skip "CNC smoke (SkipSmoke / SKIP_SMOKE=1)"
} elseif (Test-Path -LiteralPath $smokeLauncher) {
    Write-Step "CNC smoke (fixtures)"
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
    if (-not $py) {
        Add-Fail "CNC smoke - python not on PATH"
    } else {
        # Scoped demo flags — do not leave them set for later steps.
        $prevCnc = $env:ENABLE_CNC; $prevProof = $env:PROOF_RUN
        $env:ENABLE_CNC = "1"
        $env:PROOF_RUN = "1"
        try {
            & $py.Source $smokeLauncher --mode fixtures
            if ($LASTEXITCODE -ne 0) {
                Add-Fail "CNC smoke exited $LASTEXITCODE"
            } else {
                Write-Host "ok  CNC smoke (fixtures)"
            }
        } finally {
            if ($null -eq $prevCnc) { Remove-Item Env:ENABLE_CNC -ErrorAction SilentlyContinue } else { $env:ENABLE_CNC = $prevCnc }
            if ($null -eq $prevProof) { Remove-Item Env:PROOF_RUN -ErrorAction SilentlyContinue } else { $env:PROOF_RUN = $prevProof }
        }
    }
} elseif (Test-Path -LiteralPath $smokeCore) {
    Write-Step "CNC smoke (fixtures, core path)"
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
    if (-not $py) {
        Add-Fail "CNC smoke - python not on PATH"
    } else {
        $prevCnc = $env:ENABLE_CNC; $prevProof = $env:PROOF_RUN
        $env:ENABLE_CNC = "1"
        $env:PROOF_RUN = "1"
        try {
            & $py.Source $smokeCore --mode fixtures
            if ($LASTEXITCODE -ne 0) {
                Add-Fail "CNC smoke exited $LASTEXITCODE"
            } else {
                Write-Host "ok  CNC smoke (fixtures)"
            }
        } finally {
            if ($null -eq $prevCnc) { Remove-Item Env:ENABLE_CNC -ErrorAction SilentlyContinue } else { $env:ENABLE_CNC = $prevCnc }
            if ($null -eq $prevProof) { Remove-Item Env:PROOF_RUN -ErrorAction SilentlyContinue } else { $env:PROOF_RUN = $prevProof }
        }
    }
} else {
    Add-Skip "CNC smoke script not present"
}

# --- Summary ----------------------------------------------------------------
Write-Host ""
Write-Host "== validate: summary ==" -ForegroundColor Cyan
if ($script:Skipped.Count -gt 0) {
    Write-Host "skipped ($($script:Skipped.Count)):"
    $script:Skipped | ForEach-Object { Write-Host "  - $_" }
}
if ($script:Failures.Count -gt 0) {
    Write-Host "failures ($($script:Failures.Count)):" -ForegroundColor Red
    $script:Failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "validate.ps1: FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "validate.ps1: ALL GREEN" -ForegroundColor Green
exit 0
