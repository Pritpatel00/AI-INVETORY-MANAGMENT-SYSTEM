$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "confirmation-review-test.json"
$statusPath = Join-Path $localDirectory "confirmation-review-test.status"
$keycloakBaseUrl = "http://localhost:8080"
$apiBaseUrl = "http://localhost:4000/api"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
Set-Content -LiteralPath $statusPath -Value "running" -Encoding UTF8
$webClient = $null
$verificationSucceeded = $false

function ConvertTo-Utf8JsonBytes {
    param([Parameter(Mandatory = $true)] $Value)
    $json = $Value | ConvertTo-Json -Depth 20 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return ,$bytes
}

function Invoke-ApiPost {
    param(
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] $Headers,
        [Parameter(Mandatory = $true)] $Body
    )
    return Invoke-RestMethod `
        -Method Post `
        -Uri "$apiBaseUrl$Path" `
        -Headers $Headers `
        -ContentType "application/json; charset=utf-8" `
        -Body (ConvertTo-Utf8JsonBytes $Body) `
        -TimeoutSec 30
}

try {
    $admin = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/master/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = "admin-cli"
            grant_type = "password"
            username = "nirka-admin"
            password = "nirka-admin-dev"
        }
    $adminHeaders = @{ Authorization = "Bearer $($admin.access_token)" }
    $clients = Invoke-RestMethod `
        -Method Get `
        -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients?clientId=$webClientId" `
        -Headers $adminHeaders
    $webClient = @($clients)[0]
    $webClient.directAccessGrantsEnabled = $true
    Invoke-RestMethod `
        -Method Put `
        -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
        -Headers $adminHeaders `
        -ContentType "application/json" `
        -Body ($webClient | ConvertTo-Json -Depth 30)

    $workerToken = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = $webClientId
            grant_type = "password"
            username = "worker1"
            password = "Worker@123"
        }
    $managerToken = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = $webClientId
            grant_type = "password"
            username = "manager1"
            password = "Manager@123"
        }
    $workerHeaders = @{ Authorization = "Bearer $($workerToken.access_token)" }
    $managerHeaders = @{ Authorization = "Bearer $($managerToken.access_token)" }

    $balances = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/balances" `
        -Headers $workerHeaders
    $balance = @($balances | Where-Object {
        $_.product.sku -eq "ITEM-402" -and $_.location.code -eq "SHELF-B"
    })[0]
    if (-not $balance) {
        throw "The ITEM-402 balance at SHELF-B was not found."
    }
    $initialQuantity = [int]$balance.quantity
    $runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

    function New-CycleCountTransaction {
        param(
            [Parameter(Mandatory = $true)] [string] $Name,
            [Parameter(Mandatory = $true)] [int] $Quantity
        )
        return Invoke-ApiPost `
            -Path "/inventory/transactions" `
            -Headers $workerHeaders `
            -Body @{
                action = "CYCLE_COUNT"
                productId = $balance.product.id
                quantity = $Quantity
                condition = "GOOD"
                sourceLocationId = $balance.location.id
                transcript = "Cycle count $Quantity units of Item 402 at Shelf B."
                clientRequestId = "verification-$Name-$runId"
            }
    }

    $approveTransaction = New-CycleCountTransaction `
        -Name "approve" `
        -Quantity $initialQuantity
    $approveConfirmation = Invoke-ApiPost `
        -Path "/inventory/transactions/$($approveTransaction.id)/confirm" `
        -Headers $workerHeaders `
        -Body @{}

    $workerApprovalBlocked = $false
    try {
        Invoke-ApiPost `
            -Path "/inventory/transactions/$($approveTransaction.id)/approve" `
            -Headers $workerHeaders `
            -Body @{} | Out-Null
    }
    catch {
        $workerApprovalBlocked =
            [int]$_.Exception.Response.StatusCode -eq 403
    }
    $approval = Invoke-ApiPost `
        -Path "/inventory/transactions/$($approveTransaction.id)/approve" `
        -Headers $managerHeaders `
        -Body @{ note = "Automated approval safety verification." }

    $rejectTransaction = New-CycleCountTransaction `
        -Name "reject" `
        -Quantity ($initialQuantity + 11)
    $rejectConfirmation = Invoke-ApiPost `
        -Path "/inventory/transactions/$($rejectTransaction.id)/confirm" `
        -Headers $workerHeaders `
        -Body @{}
    $rejection = Invoke-ApiPost `
        -Path "/inventory/transactions/$($rejectTransaction.id)/reject" `
        -Headers $managerHeaders `
        -Body @{ note = "Automated rejection safety verification." }

    $recountTransaction = New-CycleCountTransaction `
        -Name "recount" `
        -Quantity ($initialQuantity + 12)
    $recountConfirmation = Invoke-ApiPost `
        -Path "/inventory/transactions/$($recountTransaction.id)/confirm" `
        -Headers $workerHeaders `
        -Body @{}
    $recount = Invoke-ApiPost `
        -Path "/inventory/transactions/$($recountTransaction.id)/request-recount" `
        -Headers $managerHeaders `
        -Body @{ note = "Automated recount safety verification." }

    $finalBalances = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/balances" `
        -Headers $workerHeaders
    $finalBalance = @($finalBalances | Where-Object {
        $_.product.sku -eq "ITEM-402" -and $_.location.code -eq "SHELF-B"
    })[0]
    $finalQuantity = [int]$finalBalance.quantity

    $results = [pscustomobject]@{
        initialQuantity = $initialQuantity
        finalQuantity = $finalQuantity
        workerConfirmationOutcome = $approveConfirmation.outcome
        workerApprovalBlocked = $workerApprovalBlocked
        approvalOutcome = $approval.outcome
        rejectionOutcome = $rejection.outcome
        recountOutcome = $recount.outcome
        rejectConfirmationOutcome = $rejectConfirmation.outcome
        recountConfirmationOutcome = $recountConfirmation.outcome
        stockUnchangedByRejectedAndRecount = $finalQuantity -eq $initialQuantity
        passed = (
            $approveConfirmation.outcome -eq "PENDING_REVIEW" -and
            $rejectConfirmation.outcome -eq "PENDING_REVIEW" -and
            $recountConfirmation.outcome -eq "PENDING_REVIEW" -and
            $workerApprovalBlocked -and
            $approval.outcome -eq "POSTED" -and
            $rejection.outcome -eq "REJECTED" -and
            $recount.outcome -eq "RECOUNT_REQUESTED" -and
            $finalQuantity -eq $initialQuantity
        )
    }
    $results | ConvertTo-Json -Depth 10 |
        Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (-not $results.passed) {
        throw "One or more confirmation and manager-review checks failed."
    }
    $verificationSucceeded = $true
    $results | Format-List
}
catch {
    Set-Content `
        -LiteralPath $statusPath `
        -Value "failed: $($_.Exception.Message)" `
        -Encoding UTF8
    throw
}
finally {
    if ($webClient) {
        try {
            $restoreAdmin = Invoke-RestMethod `
                -Method Post `
                -Uri "$keycloakBaseUrl/realms/master/protocol/openid-connect/token" `
                -ContentType "application/x-www-form-urlencoded" `
                -Body @{
                    client_id = "admin-cli"
                    grant_type = "password"
                    username = "nirka-admin"
                    password = "nirka-admin-dev"
                }
            $restoreHeaders = @{
                Authorization = "Bearer $($restoreAdmin.access_token)"
            }
            $webClient.directAccessGrantsEnabled = $false
            Invoke-RestMethod `
                -Method Put `
                -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
                -Headers $restoreHeaders `
                -ContentType "application/json" `
                -Body ($webClient | ConvertTo-Json -Depth 30)
        }
        catch {
            Write-Warning "The temporary Keycloak test setting could not be restored automatically."
        }
    }
    if ($verificationSucceeded) {
        Set-Content -LiteralPath $statusPath -Value "complete" -Encoding UTF8
    }
}
