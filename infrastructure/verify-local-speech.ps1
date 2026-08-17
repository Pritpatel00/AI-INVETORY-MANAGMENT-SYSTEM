$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot ".local"
$audioPath = Join-Path $localDirectory "test-warehouse-speech.wav"
$resultPath = Join-Path $localDirectory "transcription-test.json"
$statusPath = Join-Path $localDirectory "transcription-test.status"
$keycloakBaseUrl = "http://localhost:8080"
$realmName = "nirka-inventory"
$webClientId = "nirka-inventory-web"

New-Item -ItemType Directory -Force -Path $localDirectory | Out-Null
Set-Content -LiteralPath $statusPath -Value "running" -Encoding UTF8
Remove-Item -LiteralPath $resultPath -Force -ErrorAction SilentlyContinue

$adminHeaders = $null
$webClient = $null
$originalDirectAccess = $false
$directAccessChanged = $false

try {
    Add-Type -AssemblyName System.Speech
    Add-Type -AssemblyName System.Net.Http
    $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
        $synthesizer.SetOutputToWaveFile($audioPath)
        $synthesizer.Speak(
            "Received five units of Cable."
        )
    }
    finally {
        $synthesizer.Dispose()
    }

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
        $directAccessChanged = $true
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

    $httpClient = New-Object System.Net.Http.HttpClient
    $httpClient.Timeout = [TimeSpan]::FromMinutes(5)
    $httpClient.DefaultRequestHeaders.Authorization =
        New-Object System.Net.Http.Headers.AuthenticationHeaderValue(
            "Bearer",
            $workerTokenResponse.access_token
        )
    $multipart = New-Object System.Net.Http.MultipartFormDataContent
    $audioStream = [System.IO.File]::OpenRead($audioPath)
    $audioContent = New-Object System.Net.Http.StreamContent($audioStream)
    $audioContent.Headers.ContentType =
        New-Object System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav")
    $multipart.Add(
        $audioContent,
        "audio",
        [System.IO.Path]::GetFileName($audioPath)
    )

    try {
        $response = $httpClient.PostAsync(
            "http://localhost:4000/api/speech/transcribe",
            $multipart
        ).GetAwaiter().GetResult()
        $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) {
            throw "Transcription API returned $([int]$response.StatusCode): $responseBody"
        }
    }
    finally {
        $audioStream.Dispose()
        $multipart.Dispose()
        $httpClient.Dispose()
    }

    $result = $responseBody | ConvertFrom-Json
    if (-not $result.text -or -not $result.evidenceId -or -not $result.storageKey) {
        throw "The transcription response is missing text or evidence information."
    }

    Set-Content -LiteralPath $resultPath -Value $responseBody -Encoding UTF8
    Set-Content -LiteralPath $statusPath -Value "complete" -Encoding UTF8
    Write-Host "Speech verification completed."
    Write-Host "Transcript: $($result.text)"
    Write-Host "Evidence ID: $($result.evidenceId)"
}
catch {
    Set-Content -LiteralPath $statusPath -Value "failed: $($_.Exception.Message)" -Encoding UTF8
    throw
}
finally {
    if ($directAccessChanged -and $webClient -and $adminHeaders) {
        try {
            $webClient.directAccessGrantsEnabled = $originalDirectAccess
            Invoke-RestMethod `
                -Method Put `
                -Uri "$keycloakBaseUrl/admin/realms/$realmName/clients/$($webClient.id)" `
                -Headers $adminHeaders `
                -ContentType "application/json" `
                -Body ($webClient | ConvertTo-Json -Depth 30)
        }
        catch {
            Write-Warning "The temporary Keycloak test setting could not be restored automatically."
        }
    }
}
