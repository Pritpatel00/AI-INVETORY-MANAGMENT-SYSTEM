$ErrorActionPreference = "Stop"

$apiBaseUrl = "http://localhost:4000/api"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"
$webClient = $null

try {
    $admin = Invoke-RestMethod -Method Post `
        -Uri "$keycloakBaseUrl/realms/master/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{ client_id = "admin-cli"; grant_type = "password"; username = "nirka-admin"; password = "nirka-admin-dev" }
    $adminHeaders = @{ Authorization = "Bearer $($admin.access_token)" }
    $webClient = @((Invoke-RestMethod -Method Get `
        -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients?clientId=$webClientId" `
        -Headers $adminHeaders))[0]
    $webClient.directAccessGrantsEnabled = $true
    Invoke-RestMethod -Method Put `
        -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
        -Headers $adminHeaders -ContentType "application/json" `
        -Body ($webClient | ConvertTo-Json -Depth 30)

    $managerToken = Invoke-RestMethod -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{ client_id = $webClientId; grant_type = "password"; username = "manager1"; password = "Manager@123" }
    $managerHeaders = @{ Authorization = "Bearer $($managerToken.access_token)" }

    $before = @(Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/products" -Headers $managerHeaders).Count
    Write-Host "Products before removal: $before"

    $result = Invoke-RestMethod -Method Delete -Uri "$apiBaseUrl/inventory/default-data" -Headers $managerHeaders -TimeoutSec 30
    Write-Host "Remove result: $($result | ConvertTo-Json -Compress)"

    $productsAfter = @(Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/products" -Headers $managerHeaders).Count
    $locationsAfter = @(Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/locations" -Headers $managerHeaders).Count
    $transactionsAfter = @(Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/transactions" -Headers $managerHeaders).Count
    Write-Host "After removal - products: $productsAfter, locations: $locationsAfter, transactions: $transactionsAfter"

    if (-not $result.cleared) { throw "The endpoint did not return cleared=true." }
    if ($productsAfter -ne 0 -or $locationsAfter -ne 0 -or $transactionsAfter -ne 0) {
        throw "Default data was not fully removed."
    }
    Write-Host "PASS: Default data removed, catalogue is empty, sign-in still works."
}
finally {
    if ($webClient) {
        try {
            $restoreAdmin = Invoke-RestMethod -Method Post `
                -Uri "$keycloakBaseUrl/realms/master/protocol/openid-connect/token" `
                -ContentType "application/x-www-form-urlencoded" `
                -Body @{ client_id = "admin-cli"; grant_type = "password"; username = "nirka-admin"; password = "nirka-admin-dev" }
            $restoreHeaders = @{ Authorization = "Bearer $($restoreAdmin.access_token)" }
            $webClient.directAccessGrantsEnabled = $false
            Invoke-RestMethod -Method Put `
                -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
                -Headers $restoreHeaders -ContentType "application/json" `
                -Body ($webClient | ConvertTo-Json -Depth 30)
        } catch {
            Write-Warning "Temporary direct test login could not be disabled automatically."
        }
    }
}
