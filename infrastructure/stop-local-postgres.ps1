$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDirectory = Join-Path $projectRoot ".local\postgres-data"
$postgresBin = "C:\Program Files\PostgreSQL\18\bin"
$pgCtl = Join-Path $postgresBin "pg_ctl.exe"

if (Test-Path -LiteralPath $dataDirectory) {
    & $pgCtl -D $dataDirectory stop
}
