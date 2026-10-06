# Foundation + infrastructure + authentication verification (Phase 0-3).
# Usage: pnpm verify   (or) powershell -ExecutionPolicy Bypass -File scripts/verify-foundation.ps1
# Leaves the docker compose infrastructure running; stop it with `pnpm infra:down`.

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

function Skip-Step([string]$name, [string]$reason) {
  Write-Host "`n=== $name === (skipped: $reason)" -ForegroundColor Yellow
  $results[$name] = "SKIPPED ($reason)"
}

function Wait-Http([string]$url, [int]$timeoutSec = 90) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
      if ($response.StatusCode -eq 200) { return $response }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "Timed out waiting for a 200 response from $url"
}

Invoke-Step 'install' { pnpm install --prefer-offline --fetch-retries 5 --fetch-timeout 120000 }
Invoke-Step 'env file' { pnpm env:init }
Invoke-Step 'prisma generate' { pnpm db:generate }
Invoke-Step 'lint' { pnpm lint }
Invoke-Step 'typecheck' { pnpm typecheck }
Invoke-Step 'build (packages, api, web)' { pnpm build }
Invoke-Step 'unit tests' { pnpm test }

$dockerAvailable = [bool](Get-Command docker -ErrorAction SilentlyContinue)
$infraSteps = @('docker compose config', 'docker compose up', 'migrations', 'integration tests (API -> PostgreSQL/Redis/MinIO)', 'api health', 'health endpoints remain public', 'API default-deny without a session', 'web health')

if (-not $dockerAvailable) {
  foreach ($step in $infraSteps) { Skip-Step $step 'docker is not installed' }
} else {
  Invoke-Step 'docker compose config' { pnpm infra:config }
  Invoke-Step 'docker compose up' {
    pnpm infra:up
    if ($LASTEXITCODE -ne 0) { return }
    docker compose ps
  }
  Invoke-Step 'migrations' { pnpm db:migrate:deploy }
  Invoke-Step 'integration tests (API -> PostgreSQL/Redis/MinIO)' { pnpm test:integration }

  $api = $null
  $web = $null
  try {
    $api = Start-Process -FilePath 'node' -ArgumentList 'apps/api/dist/main.js' -PassThru -WindowStyle Hidden
    Invoke-Step 'api health' {
      $body = (Wait-Http 'http://localhost:4000/api/v1/health').Content | ConvertFrom-Json
      if (-not $body.success -or $body.data.status -ne 'ok') { throw "overall status '$($body.data.status)'" }
      foreach ($name in 'application', 'database', 'redis', 'objectStorage') {
        $check = $body.data.checks.$name
        if ($check.status -ne 'up') { throw "$name is $($check.status) ($($check.error))" }
        Write-Host ("  {0,-14} up ({1} ms)" -f $name, $check.latencyMs)
      }
    }
    Invoke-Step 'health endpoints remain public' {
      $live = Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health/live' -UseBasicParsing -TimeoutSec 10
      if ($live.StatusCode -ne 200) { throw "health/live returned $($live.StatusCode)" }
      $health = Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/health' -UseBasicParsing -TimeoutSec 10
      if ($health.StatusCode -ne 200) { throw "health returned $($health.StatusCode)" }
    }
    Invoke-Step 'API default-deny without a session' {
      $denied = $false
      try {
        Invoke-WebRequest -Uri 'http://localhost:4000/api/v1/users' -UseBasicParsing -TimeoutSec 10 | Out-Null
      } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ne 401) { throw "GET /users returned $code (expected 401)" }
        $denied = $true
      }
      if (-not $denied) { throw 'GET /users succeeded without a session' }
    }

    $web = Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter', '@hospital/web', 'start' -PassThru -WindowStyle Hidden
    Invoke-Step 'web health' {
      $page = Wait-Http 'http://localhost:3000/health'
      if ($page.Content -notmatch 'data-testid="api-overall-status"[^>]*>ok<') {
        throw 'web health page does not show API status ok'
      }
    }
  } finally {
    foreach ($proc in @($api, $web)) {
      if ($proc -and -not $proc.HasExited) { taskkill /PID $proc.Id /T /F | Out-Null }
    }
  }
}

Invoke-Step 'git secrets check' {
  $tracked = git ls-files | Where-Object { $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '\.env\.example$' }
  if ($tracked) { throw "tracked env files: $tracked" }
  git check-ignore -q .env
  if ($LASTEXITCODE -ne 0) { throw '.env is not git-ignored' }

  $secretKeys = 'POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'MINIO_ROOT_PASSWORD', 'MINIO_SECRET_KEY'
  $secretValues = Get-Content .env | Where-Object { $_ -match "^($($secretKeys -join '|'))=(.+)$" } |
    ForEach-Object { ($_ -split '=', 2)[1].Trim() } | Where-Object { $_.Length -ge 8 }
  foreach ($value in $secretValues) {
    $hits = git grep -l -F -e $value 2>$null
    if ($hits) { throw "a local secret value appears in tracked files: $hits" }
  }
  $global:LASTEXITCODE = 0
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$results.GetEnumerator() | ForEach-Object { '{0,-52} {1}' -f $_.Key, $_.Value }

if ($results.Values | Where-Object { $_ -ne 'PASS' }) { exit 1 }
