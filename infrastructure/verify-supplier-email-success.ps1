$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$resultPath = Join-Path $projectRoot ".local\supplier-email-success-test.json"
$apiBaseUrl = "http://localhost:4000/api"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"
$mailpitBaseUrl = "http://localhost:8025"
$webClient = $null

function JsonBytes($value) {
    return ,[System.Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Depth 20 -Compress))
}

function ApiPost($path, $headers, $body) {
    Invoke-RestMethod -Method Post -Uri "$apiBaseUrl$path" -Headers $headers `
        -ContentType "application/json; charset=utf-8" -Body (JsonBytes $body) -TimeoutSec 30
}

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
    $workerToken = Invoke-RestMethod -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{ client_id = $webClientId; grant_type = "password"; username = "worker1"; password = "Worker@123" }
    $headers = @{ Authorization = "Bearer $($managerToken.access_token)" }
    $workerHeaders = @{ Authorization = "Bearer $($workerToken.access_token)" }

    $mailBefore = Invoke-RestMethod -Uri "$mailpitBaseUrl/api/v1/messages" -TimeoutSec 10
    $balancesBefore = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/balances" -Headers $headers
    $drafts = ApiPost "/inventory/reorder-drafts/refresh" $headers @{}
    $draft = @($drafts | Where-Object {
        $_.status -eq "DRAFT" -and
        -not [string]::IsNullOrWhiteSpace([string]$_.product.supplierEmail
        )
    })[0]
    if (-not $draft) {
        $lowBalance = @($balancesBefore | Where-Object {
            ([int]$_.quantity - [int]$_.reservedQuantity) -lt [int]$_.product.safetyStock -and
            -not [string]::IsNullOrWhiteSpace([string]$_.product.supplierEmail)
        })[0]
        if (-not $lowBalance) { throw "No low-stock balance with a supplier email is available." }
        $recoveryQuantity = [int]$lowBalance.product.safetyStock -
            ([int]$lowBalance.quantity - [int]$lowBalance.reservedQuantity) + 1
        $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $receive = ApiPost "/inventory/transactions" $workerHeaders @{
            action = "RECEIVE"; productId = $lowBalance.product.id;
            destinationLocationId = $lowBalance.location.id; quantity = $recoveryQuantity;
            condition = "GOOD"; clientRequestId = "email-recovery-$runId"
        }
        ApiPost "/inventory/transactions/$($receive.id)/confirm" $workerHeaders @{} | Out-Null
        $ship = ApiPost "/inventory/transactions" $workerHeaders @{
            action = "SHIP"; productId = $lowBalance.product.id;
            sourceLocationId = $lowBalance.location.id; quantity = $recoveryQuantity;
            condition = "GOOD"; clientRequestId = "email-shortage-$runId"
        }
        ApiPost "/inventory/transactions/$($ship.id)/confirm" $workerHeaders @{} | Out-Null
        $drafts = ApiPost "/inventory/reorder-drafts/refresh" $headers @{}
        $draft = @($drafts | Where-Object {
            $_.status -eq "DRAFT" -and
            $_.product.id -eq $lowBalance.product.id -and
            $_.location.id -eq $lowBalance.location.id
        })[0]
    }
    if (-not $draft) { throw "A fresh low-stock supplier draft was not created after stock recovery and renewed shortage." }

    $approved = ApiPost "/inventory/reorder-drafts/$($draft.id)/approve" $headers @{ note = "Approved during complete supplier-email verification." }
    ApiPost "/inventory/reorder-drafts/$($draft.id)/queue-email" $headers @{} | Out-Null

    $deadline = (Get-Date).AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 500
        $allDrafts = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/reorder-drafts" -Headers $headers
        $sent = @($allDrafts | Where-Object { $_.id -eq $draft.id })[0]
    } while ($sent.emailStatus -ne "SENT" -and (Get-Date) -lt $deadline)
    if ($sent.emailStatus -ne "SENT") { throw "Supplier email did not reach SENT status." }

    $mailAfter = Invoke-RestMethod -Uri "$mailpitBaseUrl/api/v1/messages" -TimeoutSec 10
    $message = @($mailAfter.messages | Where-Object {
        @($_.To | Where-Object { $_.Address -eq $draft.product.supplierEmail }).Count -gt 0
    })[0]
    $balancesAfter = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/balances" -Headers $headers
    $beforeStockState = @($balancesBefore | Sort-Object id | ForEach-Object {
        [pscustomobject]@{ id = $_.id; quantity = [int]$_.quantity; reservedQuantity = [int]$_.reservedQuantity }
    }) | ConvertTo-Json -Depth 5 -Compress
    $afterStockState = @($balancesAfter | Sort-Object id | ForEach-Object {
        [pscustomobject]@{ id = $_.id; quantity = [int]$_.quantity; reservedQuantity = [int]$_.reservedQuantity }
    }) | ConvertTo-Json -Depth 5 -Compress
    $stockUnchanged = $beforeStockState -eq $afterStockState
    $result = [pscustomobject]@{
        product = $draft.product.sku
        supplierEmail = $draft.product.supplierEmail
        approvalStatus = $approved.status
        emailStatus = $sent.emailStatus
        emailAttempts = [int]$sent.emailAttempts
        inboxMessageAdded = [int]$mailAfter.total -gt [int]$mailBefore.total
        recipientMatched = $null -ne $message
        stockUnchanged = $stockUnchanged
        passed = $approved.status -eq "APPROVED" -and $sent.emailStatus -eq "SENT" -and $null -ne $message -and $stockUnchanged
    }
    $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (-not $result.passed) { throw "Supplier-email success verification failed." }
    $result | ConvertTo-Json -Depth 10
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
