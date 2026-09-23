$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$speechDirectory = Join-Path $projectRoot "backend\speech"
$packageDirectory = Join-Path $speechDirectory ".python-packages"
$bundledPython = "C:\Users\Prit Patel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$systemPython = Get-Command python -ErrorAction SilentlyContinue
$stdout = Join-Path $projectRoot ".local\speech.log"
$stderr = Join-Path $projectRoot ".local\speech-error.log"
$healthUrl = "http://127.0.0.1:5001/health"

try {
    $existingHealth = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
    if ($existingHealth.status -eq "ok") {
        Write-Host "Speech-to-text is already online at $healthUrl"
        exit 0
    }
} catch {
    # No healthy service is running; start a new instance below.
}

if ($systemPython) {
    $python = $systemPython.Source
} elseif (Test-Path -LiteralPath $bundledPython) {
    $python = $bundledPython
} else {
    throw "Python 3.12 is required to start the speech service."
}

if (-not (Test-Path -LiteralPath $packageDirectory)) {
    throw "Speech dependencies are not installed. Run npm run speech:setup first."
}

$env:PYTHONPATH = $packageDirectory
$env:WHISPER_MODEL = "base"
$env:WHISPER_PREVIEW_MODEL = "tiny.en"
$env:WHISPER_DEVICE = "cpu"
$env:WHISPER_COMPUTE_TYPE = "int8"
$env:WHISPER_MODEL_CACHE = Join-Path $projectRoot ".local\whisper-models"
$env:WHISPER_BEAM_SIZE = "3"
$env:WHISPER_PREVIEW_BEAM_SIZE = "1"
$env:WHISPER_INITIAL_PROMPT = "Warehouse inventory. Actions: receive, ship, transfer, cycle count, damage. Items: cable, helmet, gloves, tape, box, bottle, bolt, bearing. Locations: receiving, dispatch, packing, storage one, storage two, storage three."

$speechProcess = Start-Process `
    -FilePath $python `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "5001") `
    -WorkingDirectory $speechDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

for ($attempt = 1; $attempt -le 30; $attempt++) {
    if ($speechProcess.HasExited) {
        $details = if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr -Tail 20 | Out-String } else { "No error log was created." }
        throw "Speech-to-text stopped during startup.`n$details"
    }
    try {
        $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        if ($health.status -eq "ok") {
            Write-Host "Speech-to-text is online at $healthUrl (model: $($health.model))."
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 500
    }
}

Stop-Process -Id $speechProcess.Id -Force -ErrorAction SilentlyContinue
throw "Speech-to-text did not become healthy within 15 seconds. Check $stderr."
