param(
  [string]$Python = "C:\venvs\pothole\Scripts\python.exe",
  [int]$Port = 8001
)

if (-not (Test-Path -LiteralPath $Python)) {
  throw "Python executable not found: $Python. Create/install the pothole virtual environment first."
}

& $Python -m uvicorn main:app --app-dir $PSScriptRoot --host 127.0.0.1 --port $Port
