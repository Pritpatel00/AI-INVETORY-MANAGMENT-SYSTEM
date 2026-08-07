$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "complete-workflow-test.json"
$apiBaseUrl = "http://localhost:4000/api"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"
$webClient = $null

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null

function ConvertTo-JsonBytes($value) {
    return ,[System.Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Depth 20 -Compress))
}

function Invoke-ApiPost($path, $headers, $body) {
    Invoke-RestMethod -Method Post -Uri "$apiBaseUrl$path" -Headers $headers `
        -ContentType "application/json; charset=utf-8" -Body (ConvertTo-JsonBytes $body) -TimeoutSec 30
}

function Get-Balances($headers) {
    Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/balances" -Headers $headers -TimeoutSec 30
}

function Get-Quantity($headers, $sku, $locationCode) {
    $balance = @((Get-Balances $headers) | Where-Object {
        $_.product.sku -eq $sku -and $_.location.code -eq $locationCode
    })[0]
    if ($balance) { return [int]$balance.quantity }
    return 0
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

    $workerToken = Invoke-RestMethod -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{ client_id = $webClientId; grant_type = "password"; username = "worker1"; password = "Worker@123" }
    $managerToken = Invoke-RestMethod -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{ client_id = $webClientId; grant_type = "password"; username = "manager1"; password = "Manager@123" }
    $workerHeaders = @{ Authorization = "Bearer $($workerToken.access_token)" }
    $managerHeaders = @{ Authorization = "Bearer $($managerToken.access_token)" }

    $products = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/products" -Headers $workerHeaders
    $locations = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/locations" -Headers $workerHeaders
    $product = @($products | Where-Object { $_.sku -eq "ITEM-402" })[0]
    $shelf = @($locations | Where-Object { $_.code -eq "SHELF-B" })[0]
    $receiving = @($locations | Where-Object { $_.code -eq "RECEIVING" })[0]
    if (-not $product -or -not $shelf -or -not $receiving) {
        throw "Required sample product or warehouse locations are missing."
    }
    $productId = [string](@($product.id)[0])
    $shelfId = [string](@($shelf.id)[0])
    $receivingId = [string](@($receiving.id)[0])
    foreach ($identifier in @($productId, $shelfId, $receivingId)) {
        $parsedIdentifier = [guid]::Empty
        if (-not [guid]::TryParse($identifier, [ref]$parsedIdentifier)) {
            throw "The inventory API returned an invalid product or location identifier."
        }
    }
    if ($shelfId -eq $receivingId) {
        throw "SHELF-B and RECEIVING resolved to the same location identifier."
    }

    $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $prefix = "complete-e2e-$runId"
    $initialShelf = Get-Quantity $workerHeaders "ITEM-402" "SHELF-B"
    $initialReceiving = Get-Quantity $workerHeaders "ITEM-402" "RECEIVING"
    $checks = [ordered]@{}
    $createdIds = [System.Collections.Generic.List[string]]::new()

    function New-And-Confirm($name, $action, $quantity, $sourceId, $destinationId) {
        $body = @{
            action = $action
            productId = $productId
            quantity = $quantity
            condition = if ($action -eq "DAMAGE") { "DAMAGED" } else { "GOOD" }
            clientRequestId = "$prefix-$name"
            referenceNumber = "AUTO-$($name.ToUpper())-$runId"
            notes = "Automated complete workflow verification."
            transcript = "$action $quantity units of Item 402."
        }
        if ($sourceId) { $body.sourceLocationId = $sourceId }
        if ($destinationId) { $body.destinationLocationId = $destinationId }
        Write-Host "Testing $action ($name): source=$sourceId destination=$destinationId quantity=$quantity"
        $transaction = Invoke-ApiPost "/inventory/transactions" $workerHeaders $body
        $createdIds.Add($transaction.id)
        $confirmation = Invoke-ApiPost "/inventory/transactions/$($transaction.id)/confirm" $workerHeaders @{}
        return [pscustomobject]@{ transaction = $transaction; confirmation = $confirmation }
    }

    $receive = New-And-Confirm -name "receive" -action "RECEIVE" -quantity 8 -sourceId $null -destinationId $shelfId
    $checks.receiveIncreased = (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($initialShelf + 8)

    $ship = New-And-Confirm -name "ship" -action "SHIP" -quantity 2 -sourceId $shelfId -destinationId $null
    $checks.shipDecreased = (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($initialShelf + 6)

    $use = New-And-Confirm -name "use" -action "USE" -quantity 1 -sourceId $shelfId -destinationId $null
    $checks.useDecreased = (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($initialShelf + 5)

    $transferOut = New-And-Confirm -name "transfer-out" -action "TRANSFER" -quantity 3 -sourceId $shelfId -destinationId $receivingId
    $checks.transferMovedStock =
        (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($initialShelf + 2) -and
        (Get-Quantity $workerHeaders "ITEM-402" "RECEIVING") -eq ($initialReceiving + 3)
    $transferBack = New-And-Confirm -name "transfer-back" -action "TRANSFER" -quantity 3 -sourceId $receivingId -destinationId $shelfId
    $checks.transferRestoredLocations =
        (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($initialShelf + 5) -and
        (Get-Quantity $workerHeaders "ITEM-402" "RECEIVING") -eq $initialReceiving

    $beforeCount = Get-Quantity $workerHeaders "ITEM-402" "SHELF-B"
    $cycle = New-And-Confirm -name "cycle-count" -action "CYCLE_COUNT" -quantity ($beforeCount + 6) -sourceId $shelfId -destinationId $null
    $checks.cycleCountRequiresReview = $cycle.confirmation.outcome -eq "PENDING_REVIEW"
    $checks.discrepancyDetected =
        [int]$cycle.transaction.systemQuantityBefore -eq $beforeCount -and
        [int]$cycle.transaction.discrepancyDifference -eq 6 -and
        [bool]$cycle.transaction.significantDiscrepancy
    $cycleApproval = Invoke-ApiPost "/inventory/transactions/$($cycle.transaction.id)/approve" $managerHeaders @{ note = "Approved automated significant cycle-count test." }
    $checks.cycleCountApproved =
        $cycleApproval.outcome -eq "POSTED" -and
        (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq ($beforeCount + 6)

    $damage = New-And-Confirm -name "damage" -action "DAMAGE" -quantity 1 -sourceId $shelfId -destinationId $null
    $damageApproval = Invoke-ApiPost "/inventory/transactions/$($damage.transaction.id)/approve" $managerHeaders @{ note = "Approved automated damaged-stock test." }
    $checks.damageApproved = $damage.confirmation.outcome -eq "PENDING_REVIEW" -and $damageApproval.outcome -eq "POSTED"

    $loss = New-And-Confirm -name "loss" -action "LOSS" -quantity 1 -sourceId $shelfId -destinationId $null
    $lossApproval = Invoke-ApiPost "/inventory/transactions/$($loss.transaction.id)/approve" $managerHeaders @{ note = "Approved automated lost-stock test." }
    $checks.lossApproved = $loss.confirmation.outcome -eq "PENDING_REVIEW" -and $lossApproval.outcome -eq "POSTED"

    $restoreAmount = (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") - $initialShelf
    if ($restoreAmount -gt 0) {
        $restore = New-And-Confirm -name "restore" -action "SHIP" -quantity $restoreAmount -sourceId $shelfId -destinationId $null
    } elseif ($restoreAmount -lt 0) {
        $restore = New-And-Confirm -name "restore" -action "RECEIVE" -quantity (-$restoreAmount) -sourceId $null -destinationId $shelfId
    }
    $checks.stockRestored =
        (Get-Quantity $workerHeaders "ITEM-402" "SHELF-B") -eq $initialShelf -and
        (Get-Quantity $workerHeaders "ITEM-402" "RECEIVING") -eq $initialReceiving

    $allAudit = Invoke-RestMethod -Method Get -Uri "$apiBaseUrl/inventory/transactions" -Headers $managerHeaders
    $audit = @($allAudit | Where-Object {
        $_.clientRequestId -like "$prefix-*"
    })
    $checks.auditRecordsCreated =
        $audit.Count -eq $createdIds.Count -and
        @($audit | Where-Object { $_.status -ne "POSTED" }).Count -eq 0

    $drafts = Invoke-ApiPost "/inventory/reorder-drafts/refresh" $managerHeaders @{}
    $lowBalance = @((Get-Balances $managerHeaders) | Where-Object {
        ([int]$_.quantity - [int]$_.reservedQuantity) -lt [int]$_.product.safetyStock
    })[0]
    $lowStockDraft = @($drafts | Where-Object {
        $lowBalance -and
        $_.product.id -eq $lowBalance.product.id -and
        $_.location.id -eq $lowBalance.location.id -and
        $_.status -in @("DRAFT", "APPROVED", "SENT")
    })[0]
    $checks.lowStockDraftExists =
        [bool]$lowBalance -and
        [bool]$lowStockDraft -and
        [int]$lowStockDraft.currentStock -eq ([int]$lowBalance.quantity - [int]$lowBalance.reservedQuantity)

    $passed = @($checks.Values | Where-Object { -not $_ }).Count -eq 0
    $results = [pscustomobject]@{
        runId = $runId
        initialShelf = $initialShelf
        finalShelf = Get-Quantity $workerHeaders "ITEM-402" "SHELF-B"
        initialReceiving = $initialReceiving
        finalReceiving = Get-Quantity $workerHeaders "ITEM-402" "RECEIVING"
        transactionCount = $createdIds.Count
        checks = $checks
        passed = $passed
    }
    $results | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (-not $passed) { throw "One or more complete inventory workflow checks failed." }
    $results | ConvertTo-Json -Depth 20
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
