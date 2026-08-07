$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$keycloakHome = Join-Path $projectRoot ".local\keycloak-26.7.0"
$keycloakCommand = Join-Path $keycloakHome "bin\kc.bat"
$realmSource = Join-Path $PSScriptRoot "keycloak\nirka-inventory-realm.json"
$realmImportDirectory = Join-Path $keycloakHome "data\import"
$realmDestination = Join-Path $realmImportDirectory "nirka-inventory-realm.json"
$stdout = Join-Path $projectRoot ".local\keycloak.log"
$stderr = Join-Path $projectRoot ".local\keycloak-error.log"
$javaHome = "C:\Program Files\Java\jdk-23"

if (-not (Test-Path -LiteralPath $keycloakCommand)) {
    throw "Keycloak 26.7.0 has not been downloaded into the project."
}

New-Item -ItemType Directory -Force -Path $realmImportDirectory | Out-Null
Copy-Item -LiteralPath $realmSource -Destination $realmDestination -Force

$env:KC_BOOTSTRAP_ADMIN_USERNAME = "nirka-admin"
$env:KC_BOOTSTRAP_ADMIN_PASSWORD = "nirka-admin-dev"
$env:JAVA_HOME = $javaHome

Start-Process `
    -FilePath $keycloakCommand `
    -ArgumentList @("start-dev", "--http-port=8080", "--import-realm") `
    -WorkingDirectory $keycloakHome `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden
