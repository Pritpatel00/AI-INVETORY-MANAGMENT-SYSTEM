$ErrorActionPreference = "Stop"

$model = if ($env:RUNPOD_MODEL) { $env:RUNPOD_MODEL } else { "Qwen/Qwen3-4B" }
$endpointId = if ($env:RUNPOD_ENDPOINT_ID) { $env:RUNPOD_ENDPOINT_ID.Trim() } else { "" }
$apiKey = if ($env:RUNPOD_API_KEY) { $env:RUNPOD_API_KEY.Trim() } else { "" }
if (-not $endpointId -or -not $apiKey) {
    throw "RUNPOD_ENDPOINT_ID and RUNPOD_API_KEY must be set to check Runpod AI."
}

try {
    Invoke-WebRequest `
        -Method Get `
        -Uri "https://api.runpod.ai/v2/$endpointId/health" `
        -Headers @{ Authorization = "Bearer $apiKey" } `
        -TimeoutSec 10
}
catch {
    throw "Runpod AI endpoint '$endpointId' is not reachable or is not healthy."
}

Write-Host "Runpod AI is ready."
Write-Host "Inventory extraction model: $model"
