$ErrorActionPreference = "Stop"

$model = "qwen3:4b"
$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaCommand) {
    throw "Ollama is not installed or is not available in PATH."
}

try {
    $tags = Invoke-RestMethod `
        -Method Get `
        -Uri "http://127.0.0.1:11434/api/tags" `
        -TimeoutSec 10
}
catch {
    throw "Ollama is installed but its local service is not running."
}

$availableModels = @($tags.models | ForEach-Object { $_.name })
if ($availableModels -notcontains $model) {
    throw "The required local model '$model' is not installed. Run: ollama pull $model"
}

Write-Host "Ollama is ready."
Write-Host "Inventory extraction model: $model"
