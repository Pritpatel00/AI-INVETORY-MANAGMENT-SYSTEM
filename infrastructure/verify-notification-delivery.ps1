$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "notification-delivery-test.json"
$statusPath = Join-Path $localDirectory "notification-delivery-test.status"
$composePath = Join-Path $PSScriptRoot "compose.dev.yml"
$keycloakBaseUrl = "http://localhost:8080"
$apiBaseUrl = "http://localhost:4000/api"
$mailpitBaseUrl = "http://127.0.0.1:8025"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
Set-Content -LiteralPath $statusPath -Value "running" -Encoding UTF8
$webClient = $null
$mailpitWasStopped = $false
$verificationSucceeded = $false

function ConvertTo-Utf8JsonBytes {
    param([Parameter(Mandatory = $true)] $Value)
    $json = $Value | ConvertTo-Json -Depth 20 -Compress
    return ,[System.Text.Encoding]::UTF8.GetBytes($json)
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

function Get-ReorderDraft {
    param(
        [Parameter(Mandatory = $true)] [string] $DraftId,
        [Parameter(Mandatory = $true)] $Headers
    )
    $drafts = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/reorder-drafts" `
        -Headers $Headers `
        -TimeoutSec 30
    return @($drafts | Where-Object { $_.id -eq $DraftId })[0]
}

function Wait-ForDraftState {
    param(
        [Parameter(Mandatory = $true)] [string] $DraftId,
        [Parameter(Mandatory = $true)] [string] $EmailStatus,
        [Parameter(Mandatory = $true)] $Headers,
        [int] $MinimumAttempts = 0,
        [int] $TimeoutSeconds = 35
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        $draft = Get-ReorderDraft -DraftId $DraftId -Headers $Headers
        if (
            $draft.emailStatus -eq $EmailStatus -and
            [int]$draft.emailAttempts -ge $MinimumAttempts
        ) {
            return $draft
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    throw "Draft $DraftId did not reach $EmailStatus within $TimeoutSeconds seconds."
}

function Start-TestMailpit {
    docker compose -f $composePath start mailpit | Out-Null
    $deadline = (Get-Date).AddSeconds(20)
    do {
        try {
            Invoke-RestMethod `
                -Uri "$mailpitBaseUrl/api/v1/info" `
                -TimeoutSec 2 | Out-Null
            return
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)
    throw "The local test email inbox did not become ready."
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
    $mailBefore = Invoke-RestMethod `
        -Uri "$mailpitBaseUrl/api/v1/messages" `
        -TimeoutSec 10

    $drafts = Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/refresh" `
        -Headers $managerHeaders `
        -Body @{}
    $availableDrafts = @($drafts | Where-Object {
        $_.status -eq "DRAFT" -and
        -not [string]::IsNullOrWhiteSpace([string]$_.product.supplierEmail)
    })
    if ($availableDrafts.Count -lt 2) {
        throw "Two low-stock drafts are required for delivery and retry verification."
    }

    $successDraft = $availableDrafts[0]
    Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($successDraft.id)/approve" `
        -Headers $managerHeaders `
        -Body @{ note = "Notification success verification." } | Out-Null
    Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($successDraft.id)/queue-email" `
        -Headers $managerHeaders `
        -Body @{} | Out-Null
    $sentDraft = Wait-ForDraftState `
        -DraftId $successDraft.id `
        -EmailStatus "SENT" `
        -Headers $managerHeaders `
        -MinimumAttempts 1

    $mailAfterSuccess = Invoke-RestMethod `
        -Uri "$mailpitBaseUrl/api/v1/messages" `
        -TimeoutSec 10
    $successMessage = @($mailAfterSuccess.messages | Where-Object {
        @($_.To | Where-Object {
            $_.Address -eq $successDraft.product.supplierEmail
        }).Count -gt 0
    })[0]

    docker compose -f $composePath stop mailpit | Out-Null
    $mailpitWasStopped = $true

    $failureDraft = $availableDrafts[1]
    Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($failureDraft.id)/approve" `
        -Headers $managerHeaders `
        -Body @{ note = "Notification retry verification." } | Out-Null
    Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($failureDraft.id)/queue-email" `
        -Headers $managerHeaders `
        -Body @{} | Out-Null
    $failedDraft = Wait-ForDraftState `
        -DraftId $failureDraft.id `
        -EmailStatus "FAILED" `
        -Headers $managerHeaders `
        -MinimumAttempts 3

    $workerRetryBlocked = $false
    try {
        Invoke-ApiPost `
            -Path "/inventory/reorder-drafts/$($failureDraft.id)/retry-email" `
            -Headers $workerHeaders `
            -Body @{} | Out-Null
    }
    catch {
        $workerRetryBlocked = [int]$_.Exception.Response.StatusCode -eq 403
    }

    Start-TestMailpit
    $mailpitWasStopped = $false
    Invoke-ApiPost `
        -Path "/inventory/reorder-drafts/$($failureDraft.id)/retry-email" `
        -Headers $managerHeaders `
        -Body @{} | Out-Null
    $retriedDraft = Wait-ForDraftState `
        -DraftId $failureDraft.id `
        -EmailStatus "SENT" `
        -Headers $managerHeaders `
        -MinimumAttempts 4

    $afterBalances = Invoke-RestMethod `
        -Method Get `
        -Uri "$apiBaseUrl/inventory/balances" `
        -Headers $managerHeaders
    $stockUnchanged =
        ($beforeBalances | ConvertTo-Json -Depth 20 -Compress) -eq
        ($afterBalances | ConvertTo-Json -Depth 20 -Compress)

    $results = [pscustomobject]@{
        successfulDraftStatus = $sentDraft.status
        successfulEmailStatus = $sentDraft.emailStatus
        testInboxMessageAdded = [int]$mailAfterSuccess.total -gt [int]$mailBefore.total
        testInboxRecipientMatched = $null -ne $successMessage
        failedAttemptsBeforeRetry = [int]$failedDraft.emailAttempts
        failureRecorded = -not [string]::IsNullOrWhiteSpace(
            [string]$failedDraft.emailError
        )
        workerRetryBlocked = $workerRetryBlocked
        retriedDraftStatus = $retriedDraft.status
        retriedEmailStatus = $retriedDraft.emailStatus
        attemptsAfterRetry = [int]$retriedDraft.emailAttempts
        stockUnchanged = $stockUnchanged
        passed = (
            $sentDraft.status -eq "SENT" -and
            $sentDraft.emailStatus -eq "SENT" -and
            [int]$mailAfterSuccess.total -gt [int]$mailBefore.total -and
            $null -ne $successMessage -and
            [int]$failedDraft.emailAttempts -ge 3 -and
            -not [string]::IsNullOrWhiteSpace(
                [string]$failedDraft.emailError
            ) -and
            $workerRetryBlocked -and
            $retriedDraft.status -eq "SENT" -and
            $retriedDraft.emailStatus -eq "SENT" -and
            [int]$retriedDraft.emailAttempts -ge 4 -and
            $stockUnchanged
        )
    }
    $results | ConvertTo-Json -Depth 10 |
        Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (-not $results.passed) {
        throw "One or more notification delivery checks failed."
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
    if ($mailpitWasStopped) {
        try {
            Start-TestMailpit
        }
        catch {
            Write-Warning "The local test email inbox could not be restarted automatically."
        }
    }
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
