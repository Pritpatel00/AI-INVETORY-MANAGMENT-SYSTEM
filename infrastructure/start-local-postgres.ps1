$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot ".local\postgres-data"
$logFile = Join-Path $projectRoot ".local\postgres.log"
$postgresBin = "C:\Program Files\PostgreSQL\18\bin"
$pgCtl = Join-Path $postgresBin "pg_ctl.exe"

if (-not (Test-Path -LiteralPath $dataDirectory)) {
    throw "Local database has not been initialized."
}

& $pgCtl -D $dataDirectory -l $logFile -o "-p 5434" start
