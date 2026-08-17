$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$resultPath = Join-Path $localDirectory "ai-extraction-test.json"
$statusPath = Join-Path $localDirectory "ai-extraction-test.status"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
Set-Content -LiteralPath $statusPath -Value "running" -Encoding UTF8
Remove-Item -LiteralPath $resultPath -Force -ErrorAction SilentlyContinue

$adminHeaders = $null
$webClient = $null
$originalDirectAccess = $false
$verificationSucceeded = $false

try {
    $adminTokenResponse = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/master/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = "admin-cli"
            grant_type = "password"
            username = "nirka-admin"
            password = "nirka-admin-dev"
        }
    $adminHeaders = @{
        Authorization = "Bearer $($adminTokenResponse.access_token)"
    }

    $encodedClientId = [System.Uri]::EscapeDataString($webClientId)
    $clients = Invoke-RestMethod `
        -Method Get `
        -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients?clientId=$encodedClientId" `
        -Headers $adminHeaders
    $webClient = @($clients)[0]
    if (-not $webClient) {
        throw "The Keycloak web client was not found."
    }

    $originalDirectAccess = [bool]$webClient.directAccessGrantsEnabled
    if (-not $originalDirectAccess) {
        $webClient.directAccessGrantsEnabled = $true
        Invoke-RestMethod `
            -Method Put `
            -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
            -Headers $adminHeaders `
            -ContentType "application/json" `
            -Body ($webClient | ConvertTo-Json -Depth 30)
    }

    $workerTokenResponse = Invoke-RestMethod `
        -Method Post `
        -Uri "$keycloakBaseUrl/realms/$realmName/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            client_id = $webClientId
            grant_type = "password"
            username = "worker1"
            password = "Worker@123"
        }
    $workerHeaders = @{
        Authorization = "Bearer $($workerTokenResponse.access_token)"
    }

    $cases = @(
        @{
            Name = "receive"
            Transcript = "Received five units of item 402 at Shelf B from Supplier X."
            ExpectedAction = "RECEIVE"
            ExpectedSource = $null
            ExpectedDestination = "SHELF-B"
        },
        @{
            Name = "receive-put-at"
            Transcript = "Received five units of item 402 and put them at Shelf B."
            ExpectedAction = "RECEIVE"
            ExpectedSource = $null
            ExpectedDestination = "SHELF-B"
        },
        @{
            Name = "receive-add-to"
            Transcript = "I received five units of item 402 and added them to Shelf B."
            ExpectedAction = "RECEIVE"
            ExpectedSource = $null
            ExpectedDestination = "SHELF-B"
        },
        @{
            Name = "ship"
            Transcript = "Shipped three units of item 402 from Shelf B for Order 102."
            ExpectedAction = "SHIP"
            ExpectedSource = "SHELF-B"
            ExpectedDestination = $null
        },
        @{
            Name = "transfer"
            Transcript = "Transferred ten units of item 402 from Shelf B to Receiving Area."
            ExpectedAction = "TRANSFER"
            ExpectedSource = "SHELF-B"
            ExpectedDestination = "RECEIVING"
        },
        @{
            Name = "cycle-count"
            Transcript = "Counted fifty units of item 402 at Shelf B."
            ExpectedAction = "CYCLE_COUNT"
            ExpectedSource = "SHELF-B"
            ExpectedDestination = $null
        },
        @{
            Name = "damage"
            Transcript = "Five units of item 402 are damaged at Shelf B."
            ExpectedAction = "DAMAGE"
            ExpectedSource = "SHELF-B"
            ExpectedDestination = $null
        }
    )

    $results = foreach ($case in $cases) {
        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "http://localhost:4000/api/ai/extract-inventory" `
            -Headers $workerHeaders `
            -ContentType "application/json" `
            -Body (@{ transcript = $case.Transcript } | ConvertTo-Json) `
            -TimeoutSec 180

        $passed =
            $response.fields.action -eq $case.ExpectedAction -and
            $response.fields.product.sku -eq "ITEM-402" -and
            $null -ne $response.fields.quantity -and
            $response.fields.sourceLocation.code -eq $case.ExpectedSource -and
            $response.fields.destinationLocation.code -eq $case.ExpectedDestination

        [pscustomobject]@{
            name = $case.Name
            transcript = $case.Transcript
            expectedAction = $case.ExpectedAction
            actualAction = $response.fields.action
            product = $response.fields.product.sku
            quantity = $response.fields.quantity
            source = $response.fields.sourceLocation.code
            destination = $response.fields.destinationLocation.code
            readyForConfirmation = $response.readyForConfirmation
            confidence = $response.confidence
            passed = $passed
        }
    }

    if (@($results | Where-Object { -not $_.passed }).Count -gt 0) {
        throw "One or more AI extraction cases did not match the expected controlled fields."
    }

    $safetyCases = @(
        @{
            Name = "incomplete"
            Transcript = "Received some stock."
            ExpectedMissing = "product"
        },
        @{
            Name = "unknown-product"
            Transcript = "Received five units of item 999 at Shelf B."
            ExpectedMissing = "product"
        }
    )

    $safetyResults = foreach ($case in $safetyCases) {
        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "http://localhost:4000/api/ai/extract-inventory" `
            -Headers $workerHeaders `
            -ContentType "application/json" `
            -Body (@{ transcript = $case.Transcript } | ConvertTo-Json) `
            -TimeoutSec 180

        $passed =
            -not $response.readyForConfirmation -and
            @($response.missingFields) -contains $case.ExpectedMissing

        [pscustomobject]@{
            name = $case.Name
            transcript = $case.Transcript
            readyForConfirmation = $response.readyForConfirmation
            missingFields = @($response.missingFields)
            clarificationQuestions = @($response.clarificationQuestions)
            passed = $passed
        }
    }

    $actionContext = "Item 402, fifty units at Shelf B."
    $actionInitial = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4000/api/ai/extract-inventory" `
        -Headers $workerHeaders `
        -ContentType "application/json" `
        -Body (@{ transcript = $actionContext } | ConvertTo-Json) `
        -TimeoutSec 180
    $actionRefined = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4000/api/ai/extract-inventory" `
        -Headers $workerHeaders `
        -ContentType "application/json" `
        -Body (@{
            transcript = "$actionContext`nClarification answer to `"Which inventory action did you perform?`": Cycle count."
        } | ConvertTo-Json) `
        -TimeoutSec 180

    $multiContext = "Received some stock."
    $multiProductContext =
        "$multiContext`nClarification answer to `"Which item or SKU does this update apply to?`": Item 402."
    $multiProduct = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4000/api/ai/extract-inventory" `
        -Headers $workerHeaders `
        -ContentType "application/json" `
        -Body (@{ transcript = $multiProductContext } | ConvertTo-Json) `
        -TimeoutSec 180
    $multiQuantityContext =
        "$multiProductContext`nClarification answer to `"What quantity should be recorded?`": Five units."
    $multiQuantity = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4000/api/ai/extract-inventory" `
        -Headers $workerHeaders `
        -ContentType "application/json" `
        -Body (@{ transcript = $multiQuantityContext } | ConvertTo-Json) `
        -TimeoutSec 180
    $multiDestinationContext =
        "$multiQuantityContext`nClarification answer to `"Which location should receive the stock?`": Shelf B."
    $multiDestination = Invoke-RestMethod `
        -Method Post `
        -Uri "http://localhost:4000/api/ai/extract-inventory" `
        -Headers $workerHeaders `
        -ContentType "application/json" `
        -Body (@{ transcript = $multiDestinationContext } | ConvertTo-Json) `
        -TimeoutSec 180

    $clarificationFlows = @(
        [pscustomobject]@{
            name = "missing-action-only"
            firstQuestion = $actionInitial.clarificationQuestions[0]
            finalAction = $actionRefined.fields.action
            finalReady = $actionRefined.readyForConfirmation
            passed =
                @($actionInitial.missingFields).Count -eq 1 -and
                $actionInitial.missingFields[0] -eq "action" -and
                $actionRefined.fields.action -eq "CYCLE_COUNT" -and
                $actionRefined.readyForConfirmation
        },
        [pscustomobject]@{
            name = "three-separate-answers"
            afterProductMissing = @($multiProduct.missingFields)
            afterQuantityMissing = @($multiQuantity.missingFields)
            finalReady = $multiDestination.readyForConfirmation
            passed =
                @($multiProduct.missingFields) -contains "quantity" -and
                @($multiProduct.missingFields) -contains "destinationLocation" -and
                @($multiQuantity.missingFields).Count -eq 1 -and
                $multiQuantity.missingFields[0] -eq "destinationLocation" -and
                $multiDestination.readyForConfirmation
        }
    )

    $imperfectActionAnswers = @(
        "Shaikal Count",
        "Cycle Account",
        "Sal colección"
    )
    foreach ($imperfectAnswer in $imperfectActionAnswers) {
        $polishedAction = Invoke-RestMethod `
            -Method Post `
            -Uri "http://localhost:4000/api/ai/extract-inventory" `
            -Headers $workerHeaders `
            -ContentType "application/json" `
            -Body (@{
                transcript = "$actionContext`nClarification answer to `"Which inventory action did you perform?`": $imperfectAnswer."
            } | ConvertTo-Json) `
            -TimeoutSec 180

        $clarificationFlows += [pscustomobject]@{
            name = "polish-$imperfectAnswer"
            rawAnswer = $imperfectAnswer
            finalAction = $polishedAction.fields.action
            finalReady = $polishedAction.readyForConfirmation
            passed =
                $polishedAction.fields.action -eq "CYCLE_COUNT" -and
                $polishedAction.readyForConfirmation
        }
    }

    [pscustomobject]@{
        validCases = @($results)
        safetyCases = @($safetyResults)
        clarificationFlows = @($clarificationFlows)
    } | ConvertTo-Json -Depth 10 |
        Set-Content -LiteralPath $resultPath -Encoding UTF8

    if (@($safetyResults | Where-Object { -not $_.passed }).Count -gt 0) {
        throw "One or more AI safety cases did not request the expected clarification."
    }
    if (@($clarificationFlows | Where-Object { -not $_.passed }).Count -gt 0) {
        throw "One or more incremental clarification flows did not preserve previous details."
    }

    $verificationSucceeded = $true
    Write-Host "AI extraction verification completed."
    $results | Format-Table name, actualAction, product, quantity, passed
    $safetyResults | Format-Table name, readyForConfirmation, missingFields, passed
    $clarificationFlows | Format-Table name, firstQuestion, finalReady, passed
}
catch {
    Set-Content -LiteralPath $statusPath -Value "failed: $($_.Exception.Message)" -Encoding UTF8
    throw
}
finally {
    if ($webClient -and $adminHeaders) {
        try {
            $restoreAdminToken = Invoke-RestMethod `
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
                Authorization = "Bearer $($restoreAdminToken.access_token)"
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
