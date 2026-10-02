# Phase 0 + Phase 1 foundation verification.
# Usage: pnpm verify   (or) powershell -ExecutionPolicy Bypass -File scripts/verify-foundation.ps1

# Windows PowerShell turns native stderr (e.g. Node deprecation warnings) into errors;
# step results are decided by exit codes instead.
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)

$results = [ordered]@{}

function Invoke-Step([string]$name, [scriptblock]$action) {
  Write-Host "`n=== $name ===" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  try {
    & $action
    if ($LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
    $results[$name] = 'PASS'
  } catch {
    $results[$name] = "FAIL ($_)"
  }
}

function Wait-Http([string]$url, [int]$timeoutSec = 90) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      if ($response.StatusCode -eq 200) { return $response }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "Timed out waiting for $url"
}

Invoke-Step 'install' { pnpm install --prefer-offline --fetch-retries 5 --fetch-timeout 120000 }
Invoke-Step 'lint' { pnpm lint }
Invoke-Step 'typecheck' { pnpm typecheck }
Invoke-Step 'build:packages' { pnpm build:packages }
Invoke-Step 'build:api' { pnpm build:api }
Invoke-Step 'build:web' { pnpm build:web }

$api = $null
$web = $null
try {
  $api = Start-Process -FilePath 'node' -ArgumentList 'apps/api/dist/main.js' -PassThru -WindowStyle Hidden
  Invoke-Step 'api health' {
    $body = (Wait-Http 'http://localhost:4000/api/v1/health').Content | ConvertFrom-Json
    if (-not $body.success -or $body.data.status -ne 'ok') { throw 'unexpected health payload' }
  }

  $web = Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter', '@hospital/web', 'start' -PassThru -WindowStyle Hidden
  Invoke-Step 'web health' {
    $page = Wait-Http 'http://localhost:3000/health'
    if ($page.Content -notmatch 'Health') { throw 'health page content missing' }
  }
} finally {
  foreach ($proc in @($api, $web)) {
    if ($proc -and -not $proc.HasExited) { taskkill /PID $proc.Id /T /F | Out-Null }
  }
}

Invoke-Step 'git: secrets not tracked' {
  $tracked = git ls-files | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '\.env\.example$' }
  if ($tracked) { throw "tracked env files: $tracked" }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$results.GetEnumerator() | ForEach-Object { '{0,-28} {1}' -f $_.Key, $_.Value }

if ($results.Values | Where-Object { $_ -ne 'PASS' }) { exit 1 }
