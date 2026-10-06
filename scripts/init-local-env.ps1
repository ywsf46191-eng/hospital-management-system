# Creates a local `.env` from `.env.example` with random development secrets.
# Usage: pnpm env:init            (refuses to overwrite an existing .env)
#        pnpm env:init -- -Force  (regenerates; existing Docker volumes keep the old passwords)

param([switch]$Force)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$example = Join-Path $root '.env.example'
$target = Join-Path $root '.env'

if ((Test-Path $target) -and -not $Force) {
  Write-Host '.env already exists; leaving it unchanged (use -Force to regenerate).'
  exit 0
}

function New-Secret([int]$bytes = 24) {
  $buffer = New-Object byte[] $bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  -join ($buffer | ForEach-Object { $_.ToString('x2') })
}

$secrets = @{
  POSTGRES_PASSWORD   = New-Secret
  REDIS_PASSWORD      = New-Secret
  MINIO_ROOT_PASSWORD = New-Secret
  MINIO_SECRET_KEY    = New-Secret
}

$lines = Get-Content $example | ForEach-Object {
  $line = $_
  foreach ($key in $secrets.Keys) {
    if ($line -match "^$key=\s*$") { $line = "$key=$($secrets[$key])" }
    $line = $line.Replace("<$key>", $secrets[$key])
  }
  $line
}

[System.IO.File]::WriteAllLines($target, $lines, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Created $target with random local development secrets."
