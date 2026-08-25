$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot ".local\runtime"
$startScript = Join-Path $PSScriptRoot "start-all.ps1"
$stopScript = Join-Path $PSScriptRoot "stop-all.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null

function Get-ListeningProcessId {
    param([int]$Port)
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) { return [int]$listener.OwningProcess }
    return $null
}

function Test-ExpectedEndpoint {
    param([string]$Url, [string]$ExpectedText)
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
        return $response.Content -match [regex]::Escape($ExpectedText)
    }
    catch {
        return $false
    }
}

function Stop-ExpectedListener {
    param([string]$Name, [int]$Port, [string]$Url, [string]$ExpectedText)
    $owner = Get-ListeningProcessId -Port $Port
    if (-not $owner) { return }
    if (-not (Test-ExpectedEndpoint -Url $Url -ExpectedText $ExpectedText)) {
        throw "Port $Port is owned by another application (PID $owner). It was not stopped."
    }
    Stop-Process -Id $owner -Force -ErrorAction Stop
    Write-Host "[stopped] $Name (PID $owner)" -ForegroundColor DarkYellow
}

function Wait-ForEndpoint {
    param([string]$Name, [string]$Url, [int]$Attempts = 180)
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "[online] $Name" -ForegroundColor Green
                return
            }
        }
        catch {}
        Start-Sleep -Milliseconds 500
    }
    throw "$Name did not become ready. Check $runtimeDirectory for logs."
}

Write-Host "Stopping the previous Inventory Management runtime..." -ForegroundColor Cyan
if (Test-Path -LiteralPath $stopScript) {
    try { & $stopScript } catch { Write-Host "The managed stop request was unavailable; checking listeners directly." -ForegroundColor DarkYellow }
    Start-Sleep -Seconds 3
}

Stop-ExpectedListener -Name "Web application" -Port 3000 -Url "http://localhost:3000" -ExpectedText "Inventory Management"
Stop-ExpectedListener -Name "NestJS API" -Port 4000 -Url "http://127.0.0.1:4000/api/health" -ExpectedText "status"

$generatedDirectories = @(
    (Join-Path $projectRoot "frontend\dist"),
    (Join-Path $projectRoot "frontend\.next"),
    (Join-Path $projectRoot "frontend\node_modules\.vite")
)
foreach ($directory in $generatedDirectories) {
    if (Test-Path -LiteralPath $directory) {
        $resolved = (Resolve-Path -LiteralPath $directory).Path
        $frontendRoot = (Resolve-Path -LiteralPath (Join-Path $projectRoot "frontend")).Path
        if (-not $resolved.StartsWith($frontendRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove generated directory outside the frontend: $resolved"
        }
        Remove-Item -LiteralPath $resolved -Recurse -Force
        Write-Host "[cleared] $resolved"
    }
}

Remove-Item -LiteralPath (Join-Path $runtimeDirectory "stop.request") -Force -ErrorAction SilentlyContinue

$launcherOut = Join-Path $runtimeDirectory "launcher.log"
$launcherError = Join-Path $runtimeDirectory "launcher-error.log"
$arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ('"' + $startScript + '"'))
Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $launcherOut -RedirectStandardError $launcherError | Out-Null

Wait-ForEndpoint -Name "NestJS API" -Url "http://127.0.0.1:4000/api/health"
Wait-ForEndpoint -Name "Web application" -Url "http://localhost:3000"

Write-Host "Clearing the obsolete browser application shell..." -ForegroundColor Cyan
Start-Process "http://localhost:3000/__clear-development-cache"
Write-Host "Inventory Management restarted from the current source. Reservations are no longer available." -ForegroundColor Green
