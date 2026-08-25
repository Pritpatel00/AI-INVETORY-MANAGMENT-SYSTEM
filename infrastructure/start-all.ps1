$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot ".local\runtime"
$stateFile = Join-Path $runtimeDirectory "managed-processes.json"
$stopFile = Join-Path $runtimeDirectory "stop.request"

New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
Remove-Item -LiteralPath $stopFile -Force -ErrorAction SilentlyContinue

function Test-HttpEndpoint {
    param([string]$Url, [int]$TimeoutSeconds = 2)
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec $TimeoutSeconds
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    }
    catch {
        return $false
    }
}

function Get-ListeningProcessId {
    param([int]$Port)
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) { return [int]$listener.OwningProcess }
    return $null
}

function Wait-ForEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$Port,
        [int]$Attempts = 60
    )
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        if (Test-HttpEndpoint -Url $Url) {
            Write-Host "[online] $Name" -ForegroundColor Green
            return
        }
        Start-Sleep -Milliseconds 500
    }
    $owner = Get-ListeningProcessId -Port $Port
    $ownerText = if ($owner) { " Port $Port is owned by process $owner." } else { " Port $Port is not listening." }
    throw "$Name did not become healthy.$ownerText Check the logs in $runtimeDirectory."
}

function Assert-PortAvailableOrHealthy {
    param([string]$Name, [int]$Port, [string]$HealthUrl)
    $owner = Get-ListeningProcessId -Port $Port
    if (-not $owner) { return $false }
    if (Test-HttpEndpoint -Url $HealthUrl) {
        Write-Host "[reuse] $Name is already healthy (PID $owner)." -ForegroundColor DarkGreen
        return $true
    }
    throw "$Name cannot start because port $Port is already used by unhealthy process $owner. Stop that process and run npm run start:all again."
}

function Start-ManagedProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory,
        [string]$LogName
    )
    $stdout = Join-Path $runtimeDirectory "$LogName.log"
    $stderr = Join-Path $runtimeDirectory "$LogName-error.log"
    $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden -PassThru
    Write-Host "[start] $Name (PID $($process.Id))"
    return $process
}

$managed = [ordered]@{}
$startedPostgres = $false

try {
    Write-Host "Starting Inventory Management services..." -ForegroundColor Cyan

    $postgresReady = Get-ListeningProcessId -Port 5434
    if (-not $postgresReady) {
        & (Join-Path $PSScriptRoot "start-local-postgres.ps1")
        $startedPostgres = $true
        for ($attempt = 1; $attempt -le 30; $attempt++) {
            if (Get-ListeningProcessId -Port 5434) { break }
            Start-Sleep -Milliseconds 500
        }
        if (-not (Get-ListeningProcessId -Port 5434)) { throw "PostgreSQL did not start on port 5434." }
        Write-Host "[online] PostgreSQL" -ForegroundColor Green
    }
    else {
        Write-Host "[reuse] PostgreSQL is already listening." -ForegroundColor DarkGreen
    }

    if (-not (Assert-PortAvailableOrHealthy -Name "Keycloak" -Port 8080 -HealthUrl "http://127.0.0.1:8080/realms/nirka-inventory")) {
        & (Join-Path $PSScriptRoot "start-local-keycloak.ps1")
        Wait-ForEndpoint -Name "Keycloak" -Url "http://127.0.0.1:8080/realms/nirka-inventory" -Port 8080 -Attempts 120
        $managed.Keycloak = Get-ListeningProcessId -Port 8080
    }

    if (-not (Assert-PortAvailableOrHealthy -Name "Speech-to-text" -Port 5001 -HealthUrl "http://127.0.0.1:5001/health")) {
        & (Join-Path $PSScriptRoot "start-local-speech.ps1")
        Wait-ForEndpoint -Name "Speech-to-text" -Url "http://127.0.0.1:5001/health" -Port 5001 -Attempts 60
        $managed.Speech = Get-ListeningProcessId -Port 5001
    }

    $ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollamaCommand) { throw "Ollama is not installed or is unavailable in PATH." }
    if (-not (Assert-PortAvailableOrHealthy -Name "Ollama AI" -Port 11434 -HealthUrl "http://127.0.0.1:11434/api/tags")) {
        $ollamaProcess = Start-ManagedProcess -Name "Ollama AI" -FilePath $ollamaCommand.Source -ArgumentList @("serve") -WorkingDirectory $projectRoot -LogName "ollama"
        $managed.Ollama = $ollamaProcess.Id
        Wait-ForEndpoint -Name "Ollama AI" -Url "http://127.0.0.1:11434/api/tags" -Port 11434 -Attempts 60
    }
    & (Join-Path $PSScriptRoot "check-local-ai.ps1")

    if (Get-ListeningProcessId -Port 4000) {
        if (-not (Test-HttpEndpoint -Url "http://127.0.0.1:4000/api/health")) {
            $owner = Get-ListeningProcessId -Port 4000
            throw "NestJS API port 4000 is occupied by unhealthy process $owner. Stop it before restarting the project."
        }
        Write-Host "[reuse] NestJS API is already healthy." -ForegroundColor DarkGreen
    }
    else {
        & npm.cmd run api:build --silent
        if ($LASTEXITCODE -ne 0) { throw "NestJS API build failed." }
        $apiProcess = Start-ManagedProcess -Name "NestJS API" -FilePath "node.exe" -ArgumentList @("dist/src/main.js") -WorkingDirectory (Join-Path $projectRoot "backend\api") -LogName "api"
        $managed.Api = $apiProcess.Id
        Wait-ForEndpoint -Name "NestJS API" -Url "http://127.0.0.1:4000/api/health" -Port 4000 -Attempts 60
    }

    if (Get-ListeningProcessId -Port 3000) {
        if (-not (Test-HttpEndpoint -Url "http://localhost:3000")) {
            $owner = Get-ListeningProcessId -Port 3000
            throw "Web application port 3000 is occupied by unhealthy process $owner. Stop it before restarting the project."
        }
        Write-Host "[reuse] Web application is already healthy." -ForegroundColor DarkGreen
    }
    else {
        $webProcess = Start-ManagedProcess -Name "Web application" -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--port", "3000") -WorkingDirectory (Join-Path $projectRoot "frontend") -LogName "web"
        $managed.Web = $webProcess.Id
        Wait-ForEndpoint -Name "Web application" -Url "http://localhost:3000" -Port 3000 -Attempts 120
    }

    $state = [ordered]@{
        startedAt = (Get-Date).ToString("o")
        startedPostgres = $startedPostgres
        processes = $managed
    }
    $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8

    Write-Host ""
    Write-Host "Inventory Management is ready: http://localhost:3000" -ForegroundColor Green
    Write-Host "Keep this terminal open. Press Ctrl+C to stop services started by this command."

    while (-not (Test-Path -LiteralPath $stopFile)) {
        Start-Sleep -Seconds 3
        foreach ($entry in @($managed.GetEnumerator())) {
            if (-not $entry.Value) { continue }
            if (-not (Get-Process -Id $entry.Value -ErrorAction SilentlyContinue)) {
                throw "$($entry.Key) stopped unexpectedly. Check $runtimeDirectory for its error log."
            }
        }
    }
}
finally {
    Write-Host "Stopping services started by this launcher..."
    foreach ($processId in @($managed.Values)) {
        if ($processId) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
    }
    if ($startedPostgres) {
        & (Join-Path $PSScriptRoot "stop-local-postgres.ps1") 2>$null
    }
    Remove-Item -LiteralPath $stateFile -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stopFile -Force -ErrorAction SilentlyContinue
}
