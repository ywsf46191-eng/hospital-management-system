# Elevated installer: WSL 2 + Docker Desktop (data root on D:\DockerData).
# Logs to D:\hospital\scripts\install-docker-wsl.log
# Does NOT reboot automatically.

$ErrorActionPreference = 'Stop'
$log = 'D:\hospital\scripts\install-docker-wsl.log'
$dataRoot = 'D:\DockerData'
$installer = 'D:\DockerData\DockerDesktopInstaller.exe'
$marker = 'D:\hospital\scripts\install-docker-wsl.done'

function Write-Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Add-Content -Path $log -Value $line -Encoding UTF8
  Write-Host $line
}

try {
  if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
      [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'This script must run as Administrator.'
  }

  Set-Content -Path $log -Value '' -Encoding UTF8
  Write-Log 'Starting elevated install (WSL2 + Docker Desktop, data on D:).'
  New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
  New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

  Write-Log 'Enabling Windows optional features (Microsoft-Windows-Subsystem-Linux, VirtualMachinePlatform)...'
  $null = dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
  Write-Log ("dism WSL exit={0}" -f $LASTEXITCODE)
  $null = dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
  Write-Log ("dism VirtualMachinePlatform exit={0}" -f $LASTEXITCODE)

  Write-Log 'Running wsl --install --no-distribution --web-download ...'
  & wsl.exe --install --no-distribution --web-download 2>&1 |
    ForEach-Object { Write-Log ("wsl: {0}" -f ($_ -replace "`0", '')) }
  Write-Log ("wsl --install exit={0}" -f $LASTEXITCODE)
  if ($LASTEXITCODE -ne 0) { throw "wsl --install failed (exit $LASTEXITCODE)" }

  try {
    & wsl.exe --set-default-version 2 2>&1 | ForEach-Object { Write-Log ("wsl default: {0}" -f $_) }
  } catch {
    Write-Log ("wsl --set-default-version note: {0}" -f $_.Exception.Message)
  }

  if (-not (Test-Path $installer)) {
    Write-Log 'Downloading Docker Desktop installer to D:\DockerData (BITS, resumable) ...'
    $url = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
    Start-BitsTransfer -Source $url -Destination $installer -RetryInterval 60 -RetryTimeout 3600
    Write-Log ("Downloaded installer size={0:N0} bytes" -f (Get-Item $installer).Length)
  } else {
    Write-Log 'Installer already present; skipping download.'
  }

  Write-Log 'Installing Docker Desktop (backend=wsl-2, data-root=D:\DockerData)...'
  $installArgs = @(
    'install',
    '--quiet',
    '--accept-license',
    '--backend=wsl-2',
    "--wsl-default-data-root=$dataRoot"
  )
  $proc = Start-Process -FilePath $installer -ArgumentList $installArgs -Wait -PassThru
  Write-Log ("Docker installer exit={0}" -f $proc.ExitCode)

  $dockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
  Write-Log ("docker.exe present={0}" -f (Test-Path $dockerExe))
  Write-Log ("Docker folder present={0}" -f (Test-Path 'C:\Program Files\Docker\Docker'))

  @"
reboot_required=likely
docker_installed=$(Test-Path 'C:\Program Files\Docker\Docker')
data_root=$dataRoot
finished_at=$(Get-Date -Format o)
"@ | Set-Content -Path $marker -Encoding UTF8

  Write-Log 'DONE. A reboot is usually required before WSL2/Docker Engine will start.'
  Write-Log 'After reboot: start Docker Desktop, then tell the agent to continue verification.'
  exit 0
} catch {
  Write-Log ("ERROR: {0}" -f $_.Exception.Message)
  exit 1
}
