$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$speechDirectory = Join-Path $projectRoot "services\speech"
$packageDirectory = Join-Path $speechDirectory ".python-packages"
$bundledPython = "C:\Users\Prit Patel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$systemPython = Get-Command python -ErrorAction SilentlyContinue

if ($systemPython) {
    $python = $systemPython.Source
} elseif (Test-Path -LiteralPath $bundledPython) {
    $python = $bundledPython
} else {
    throw "Python 3.12 is required to set up the speech service."
}

New-Item -ItemType Directory -Force -Path $packageDirectory | Out-Null
& $python -m pip install `
    --upgrade `
    --target $packageDirectory `
    -r (Join-Path $speechDirectory "requirements.txt")
