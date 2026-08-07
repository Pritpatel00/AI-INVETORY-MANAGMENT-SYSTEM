$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "reorder-workflow-test.json"
$statusPath = Join-Path $localDirectory "reorder-workflow-test.status"
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

    $beforeBalances = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/balances" `
        -Headers $managerHeaders
    $beforeItem402 = @($beforeBalances | Where-Object {
        $_.product.sku -eq "ITEM-402" -and $_.location.code -eq "SHELF-B"
    })[0]

    $firstRefresh = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/refresh" `
        -Headers $managerHeaders `
        -Body @{}
    $secondRefresh = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/refresh" `
        -Headers $managerHeaders `
        -Body @{}

    $item402Drafts = @($secondRefresh | Where-Object {
        $_.product.sku -eq "ITEM-402" -and
        $_.location.code -eq "SHELF-B" -and
        ($_.status -eq "DRAFT" -or $_.status -eq "APPROVED")
    })
    if ($item402Drafts.Count -ne 1) {
        throw "Duplicate prevention failed for the ITEM-402 reorder draft."
    }
    $item402Draft = $item402Drafts[0]

    $workerAccessBlocked = $false
    try {
        Invoke-RestMethod `
            -Method Get `
            -Uri "$apiBaseUrl/inventory/reorder-drafts" `
            -Headers $workerHeaders | Out-Null
    }
    catch {
        $workerAccessBlocked =
            [int]$_.Exception.Response.StatusCode -eq 403
    }

    $approvedDraft = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($item402Draft.id)/approve" `
        -Headers $managerHeaders `
        -Body @{ note = "Automated reorder approval verification." }

    # Approving the draft must create exactly one expected-receiving task in
    # the worker queue, linked to the purchase order and unassigned.
    $workerTasksAfterApproval = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/tasks" `
        -Headers $workerHeaders
    $receivingTask = @($workerTasksAfterApproval | Where-Object {
        $_.type -eq "RECEIVE" -and $_.sourceReorderDraftId -eq $item402Draft.id
    })
    if ($receivingTask.Count -gt 1) {
        throw "Approving a reorder draft must create exactly one expected-receiving task."
    }
    $receivingTask = $receivingTask[0]

    # Re-approving an approved draft is idempotent and must not duplicate the task.
    $reapprovedDraft = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($item402Draft.id)/approve" `
        -Headers $managerHeaders `
        -Body @{ note = "Automated reorder approval verification (retry)." }
    $workerTasksAfterReapproval = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/tasks" `
        -Headers $workerHeaders
    $receivingTaskCountAfterReapproval = @($workerTasksAfterReapproval | Where-Object {
        $_.type -eq "RECEIVE" -and $_.sourceReorderDraftId -eq $item402Draft.id
    }).Count

    # A warehouse executive can claim the unassigned receiving task by starting
    # it; the queue then records the claim on the task.
    $claimedTask = $null
    if ($receivingTask -and $receivingTask.status -eq "OPEN") {
        Invoke-RestMethod `
            -Method Post `
            -Uri "$apiBaseUrl/tasks/$($receivingTask.id)/start" `
            -Headers $workerHeaders | Out-Null
        $workerTasksAfterClaim = Invoke-RestMethod `
            -Method Get `
            -Uri "$apiBaseUrl/tasks" `
            -Headers $workerHeaders
        $claimedTask = @($workerTasksAfterClaim | Where-Object {
            $_.id -eq $receivingTask.id
        })[0]
    }

    $queuedDraft = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($item402Draft.id)/queue-email" `
        -Headers $managerHeaders `
        -Body @{}

    $packingDraft = @($secondRefresh | Where-Object {
        $_.product.sku -eq "ITEM-118" -and
        $_.location.code -eq "SHELF-B" -and
        $_.status -eq "DRAFT"
    })[0]
    $cancelledDraft = $null
    if ($packingDraft) {
        $cancelledDraft = Invoke-ApiPost `
            -Path "/inventory/reorder-drafts/$($packingDraft.id)/cancel" `
            -Headers $managerHeaders `
            -Body @{ note = "Automated reorder cancellation verification." }
    }

    $afterBalances = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/balances" `
        -Headers $managerHeaders
    $afterItem402 = @($afterBalances | Where-Object {
        $_.product.sku -eq "ITEM-402" -and $_.location.code -eq "SHELF-B"
    })[0]

    $supplierMinimum = 0
    if ($item402Draft.product.supplier) {
        $supplierMinimum = [int]$item402Draft.product.supplier.minimumOrderQuantity
    }

    $results = [pscustomobject]@{
        item402Available = [int]$beforeItem402.quantity -
            [int]$beforeItem402.reservedQuantity
        item402SafetyStock = [int]$item402Draft.safetyStock
        suggestedQuantity = [int]$item402Draft.suggestedQuantity
        supplierMinimumOrderQuantity = $supplierMinimum
        activeDraftCountAfterTwoRefreshes = $item402Drafts.Count
        workerAccessBlocked = $workerAccessBlocked
        approvalStatus = $approvedDraft.status
        receivingTaskCreated = [bool]$receivingTask
        receivingTaskType = if ($receivingTask) { $receivingTask.type } else { "NO_TASK" }
        receivingTaskUnassigned = if ($receivingTask) {
            [string]::IsNullOrWhiteSpace([string]$receivingTask.assignedToId)
        } else {
            $false
        }
        receivingTaskCountAfterReapproval = $receivingTaskCountAfterReapproval
        receivingTaskClaimedBy = if ($claimedTask) {
            $claimedTask.assignedTo.employeeId
        } else {
            "NOT_CLAIMED"
        }
        reapprovalStatus = $reapprovedDraft.status
        emailStatus = $queuedDraft.emailStatus
        supplierEmail = $queuedDraft.product.supplierEmail
        cancellationStatus = if ($cancelledDraft) {
            $cancelledDraft.status
        } else {
            "NO_PACKING_DRAFT"
        }
        stockUnchanged = [int]$beforeItem402.quantity -eq
            [int]$afterItem402.quantity
        passed = (
            $item402Drafts.Count -eq 1 -and
            $workerAccessBlocked -and
            $approvedDraft.status -eq "APPROVED" -and
            $reapprovedDraft.status -eq "APPROVED" -and
            [bool]$receivingTask -and
            $receivingTask.type -eq "RECEIVE" -and
            [string]::IsNullOrWhiteSpace([string]$receivingTask.assignedToId) -and
            $receivingTaskCountAfterReapproval -eq 1 -and
            ($null -ne $claimedTask -and
                $claimedTask.status -eq "IN_PROGRESS" -and
                $claimedTask.assignedTo.employeeId -eq "WORKER1") -and
            $queuedDraft.emailStatus -eq "QUEUED" -and
            -not [string]::IsNullOrWhiteSpace(
                [string]$queuedDraft.product.supplierEmail
            ) -and
            ($null -eq $cancelledDraft -or
                $cancelledDraft.status -eq "CANCELLED") -and
            [int]$beforeItem402.quantity -eq [int]$afterItem402.quantity -and
            [int]$item402Draft.suggestedQuantity -ge $supplierMinimum
        )
    }
    $results | ConvertTo-Json -Depth 10 |
        Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (-not $results.passed) {
        throw "One or more reorder workflow checks failed."
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
