# Start the Unmask AI backend using the 64-bit ML runtime.
#
# Usage:  pwsh -File backend\run_backend.ps1          (dev, reload)
#         pwsh -File backend\run_backend.ps1 -NoReload
#
# Run this from the repo root (or set the working dir to backend).

param([switch]$NoReload)

$ErrorActionPreference = "Stop"

$pyExe = Join-Path $env:LOCALAPPDATA "unmask-ai\runtime\py312\python.exe"
if (-not (Test-Path $pyExe)) {
    Write-Error "ML runtime not found at $pyExe. Run backend\setup_runtime.ps1 first."
    exit 1
}

Push-Location (Join-Path $PSScriptRoot ".")

if ($NoReload) {
    & $pyExe -m uvicorn main:app --host 127.0.0.1 --port 8000
} else {
    & $pyExe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
}
