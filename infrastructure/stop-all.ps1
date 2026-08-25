$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot ".local\runtime"
$stateFile = Join-Path $runtimeDirectory "managed-processes.json"
$stopFile = Join-Path $runtimeDirectory "stop.request"

New-Item -ItemType Directory -Force -Path $runtimeDirectory | Out-Null
New-Item -ItemType File -Force -Path $stopFile | Out-Null

if (Test-Path -LiteralPath $stateFile) {
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    foreach ($property in $state.processes.PSObject.Properties) {
        $processId = [int]$property.Value
        if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $($property.Name) (PID $processId)."
        }
    }
    if ($state.startedPostgres) {
        & (Join-Path $PSScriptRoot "stop-local-postgres.ps1")
    }
}
else {
    Write-Host "No launcher-owned process state was found. No unrelated process was stopped."
}

Write-Host "Stop request sent."
