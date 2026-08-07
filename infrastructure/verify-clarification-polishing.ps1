$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "clarification-polish-test.json"
$statusPath = Join-Path $localDirectory "clarification-polish-test.status"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
Set-Content -LiteralPath $statusPath -Value "running" -Encoding UTF8
$webClient = $null
$verificationSucceeded = $false

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

    $worker = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = $webClientId
            grant_type = "password"
            username = "worker1"
            password = "Worker@123"
        }
    $workerHeaders = @{ Authorization = "Bearer $($worker.access_token)" }
    $context = "Item 402, fifty units at Shelf B."

    $cases = @(
        @{ Answer = "Cycle count"; Expected = "CYCLE_COUNT" },
        @{ Answer = "Shaikal Count"; Expected = "CYCLE_COUNT" },
        @{ Answer = "Cycle Account"; Expected = "CYCLE_COUNT" },
        # Build the accented word explicitly so Windows PowerShell 5.1 cannot
        # reinterpret a UTF-8 source file as the local ANSI code page.
        @{
            Answer = ("Sal colecci" + [char]0x00F3 + "n")
            Expected = "CYCLE_COUNT"
        },
        @{ Answer = "Purple banana"; Expected = $null }
    )

    $actionResults = foreach ($case in $cases) {
        $requestJson = @{
            transcript = "$context`nClarification answer to `"What inventory action did you perform?`": $($case.Answer)."
        } | ConvertTo-Json -Compress
        $requestBytes = [System.Text.Encoding]::UTF8.GetBytes($requestJson)
        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "http://localhost:4000/api/ai/extract-inventory" `
            -Headers $workerHeaders `
            -ContentType "application/json; charset=utf-8" `
            -Body $requestBytes `
            -TimeoutSec 180

        $passed = if ($null -eq $case.Expected) {
            $null -eq $response.fields.action -and
            -not $response.readyForConfirmation
        }
        else {
            $response.fields.action -eq $case.Expected -and
            $response.readyForConfirmation
        }

        [pscustomobject]@{
            field = "action"
            rawAnswer = $case.Answer
            polishedValue = $response.fields.action
            readyForConfirmation = $response.readyForConfirmation
            passed = $passed
        }
    }

    $locationContext = "Cycle count fifty units of Item 402."
    $locationCases = @(
        @{ Answer = "Shelf B"; Expected = "SHELF-B" },
        @{ Answer = "Shelby"; Expected = "SHELF-B" },
        @{ Answer = "self b"; Expected = "SHELF-B" },
        @{ Answer = "Purple warehouse"; Expected = $null }
    )
    $locationResults = foreach ($case in $locationCases) {
        $requestJson = @{
            transcript = "$locationContext`nClarification answer to `"Which location did the stock come from?`": $($case.Answer)."
        } | ConvertTo-Json -Compress
        $requestBytes = [System.Text.Encoding]::UTF8.GetBytes($requestJson)
        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "http://localhost:4000/api/ai/extract-inventory" `
            -Headers $workerHeaders `
            -ContentType "application/json; charset=utf-8" `
            -Body $requestBytes `
            -TimeoutSec 180

        $polishedLocation = $response.fields.sourceLocation.code
        $passed = if ($null -eq $case.Expected) {
            $null -eq $response.fields.sourceLocation -and
            -not $response.readyForConfirmation
        }
        else {
            $polishedLocation -eq $case.Expected -and
            $response.readyForConfirmation
        }

        [pscustomobject]@{
            field = "sourceLocation"
            rawAnswer = $case.Answer
            polishedValue = $polishedLocation
            readyForConfirmation = $response.readyForConfirmation
            passed = $passed
        }
    }

    $results = @($actionResults) + @($locationResults)
    $results | ConvertTo-Json -Depth 10 |
        Set-Content -LiteralPath $resultPath -Encoding UTF8
    if (@($results | Where-Object { -not $_.passed }).Count -gt 0) {
        throw "One or more clarification polishing checks failed."
    }
    $verificationSucceeded = $true
    $results |
        Format-Table field, rawAnswer, polishedValue, readyForConfirmation, passed
}
catch {
    Set-Content -LiteralPath $statusPath -Value "failed: $($_.Exception.Message)" -Encoding UTF8
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
