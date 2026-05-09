<#
.SYNOPSIS
  Copies apps/web-main into website-versions/vN (next available version).

.EXAMPLE
  From repo root: .\website-versions\snapshot-web-main.ps1
  Force specific version: .\website-versions\snapshot-web-main.ps1 -Version 3
#>
param(
  [int]$Version = 0
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$source = Join-Path $repoRoot "apps\web-main"
$archiveRoot = $PSScriptRoot

if (-not (Test-Path -LiteralPath $source)) {
  Write-Error "Source not found: $source"
}

if ($Version -le 0) {
  $existing = Get-ChildItem -LiteralPath $archiveRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^v\d+$' } |
    ForEach-Object {
      if ($_.Name -match '^v(\d+)$') { [int]$Matches[1] }
    }
  if ($existing) {
    $Version = ($existing | Measure-Object -Maximum).Maximum + 1
  } else {
    $Version = 1
  }
}

$dest = Join-Path $archiveRoot ("v{0}" -f $Version)
if (Test-Path -LiteralPath $dest) {
  Write-Error "Destination already exists: $dest - delete it or pass a different -Version."
}

New-Item -ItemType Directory -Path $dest | Out-Null

Write-Host "Snapshot apps/web-main → $dest"

# Robocopy: copy subtree, exclude noisy dirs; retry on locks; no purge (no /MIR)
$excludeDirs = @(
  "node_modules", ".next", ".turbo", "dist", "out", "coverage", ".cache",
  "storybook-static", "playwright-report", "test-results"
)

# Exclude by directory name anywhere under source (robocopy /XD)
$xdArgs = foreach ($d in $excludeDirs) { "/XD"; $d }

$robArgs = @(
  $source,
  $dest,
  "/E",
  "/COPY:DAT",
  "/R:2",
  "/W:2",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NP"
) + $xdArgs

& robocopy @robArgs
$exit = $LASTEXITCODE
# robocopy 0–7 are success-ish for our purposes
if ($exit -ge 8) {
  Write-Error "robocopy failed with exit code $exit"
}

Write-Host "Done. Created website-versions\v$Version"
Write-Host "Tip: add a line under Version log in README.md describing this snapshot."
