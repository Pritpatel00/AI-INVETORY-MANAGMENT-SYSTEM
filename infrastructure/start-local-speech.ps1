$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$speechDirectory = Join-Path $projectRoot "services\speech"
$packageDirectory = Join-Path $speechDirectory ".python-packages"
$bundledPython = "C:\Users\Prit Patel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$systemPython = Get-Command python -ErrorAction SilentlyContinue
$stdout = Join-Path $projectRoot ".local\speech.log"
$stderr = Join-Path $projectRoot ".local\speech-error.log"

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
$env:WHISPER_DEVICE = "cpu"
$env:WHISPER_COMPUTE_TYPE = "int8"
$env:WHISPER_MODEL_CACHE = Join-Path $projectRoot ".local\whisper-models"

Start-Process `
    -FilePath $python `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "5001") `
    -WorkingDirectory $speechDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden
