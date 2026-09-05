param(
  [string]$Python = "C:\venvs\pothole\Scripts\python.exe",
  [int]$Port = 8001
)

if (-not (Test-Path -LiteralPath $Python)) {
  throw "Python executable not found: $Python. Create/install the pothole virtual environment first."
}

$runtimeRoot = Join-Path $env:TEMP 'AeroPatch-runtime'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

# Node and Python share this user-writable evidence directory. It avoids a
# locked project runtime folder preventing the CV service from booting.
$env:CV_RUNTIME_DIR = $runtimeRoot
$env:VIDEO_UPLOAD_ROOT = Join-Path $runtimeRoot 'video-uploads'
$env:VIDEO_RESULTS_ROOT = Join-Path $runtimeRoot 'video-results'
$env:LIVE_OUTPUT_ROOT = Join-Path $runtimeRoot 'live'
$env:DETECTION_LOG_PATH = Join-Path $runtimeRoot 'detections.json'

& $Python -m uvicorn main:app --app-dir $PSScriptRoot --host 127.0.0.1 --port $Port
