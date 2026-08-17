param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [Parameter(Mandatory = $true)]
    [string]$Statement
)

$ErrorActionPreference = "Stop"

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    # A slightly slower rate produces clearer warehouse terminology for the
    # local Whisper model and mirrors the recommended worker speaking pace.
    $synthesizer.Rate = -1
    $synthesizer.SetOutputToWaveFile($OutputPath)
    $synthesizer.Speak($Statement)
}
finally {
    $synthesizer.Dispose()
}
