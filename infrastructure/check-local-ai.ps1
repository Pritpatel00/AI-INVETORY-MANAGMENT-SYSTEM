$ErrorActionPreference = "Stop"

$ollamaUrl = if ($env:OLLAMA_URL) { $env:OLLAMA_URL.Trim().TrimEnd('/') } else { "http://127.0.0.1:11434" }
$model = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { "qwen3:4b" }

try {
    $tags = Invoke-RestMethod `
        -Method Get `
        -Uri "$ollamaUrl/api/tags" `
        -TimeoutSec 10
}
catch {
    throw "Local Ollama is not reachable at '$ollamaUrl'. Start Ollama before starting the API."
}

if (-not ($tags.models | Where-Object { $_.name -eq $model })) {
    throw "Ollama is reachable, but model '$model' is not installed. Run: ollama pull $model"
}

Write-Host "Local Ollama AI is ready."
Write-Host "Inventory extraction model: $model"
