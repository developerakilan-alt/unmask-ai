# Setup the 64-bit ML runtime (torch CPU + transformers + model weights).
#
# The default Python on this machine is 32-bit, which cannot run PyTorch.
# This bootstraps a portable 64-bit Python 3.12 under
#   %LOCALAPPDATA%\unmask-ai\runtime\py312
# and installs everything needed to run the real synthetic-image detector.
#
# Usage:  pwsh -File backend\setup_runtime.ps1

$ErrorActionPreference = "Stop"

$rt  = Join-Path $env:LOCALAPPDATA "unmask-ai\runtime"
$py  = Join-Path $rt "py312"
$pyExe = Join-Path $py "python.exe"

if (-not (Test-Path $pyExe)) {
    Write-Host "==> Downloading 64-bit Python 3.12 embeddable …"
    New-Item -ItemType Directory -Force -Path $rt | Out-Null
    $zip = Join-Path $rt "py312-embed.zip"
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip" -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $py -Force
    Set-Content -Path (Join-Path $py "python312._pth") -Value @("python312.zip", ".", "Lib\site-packages", "import site") -Encoding ascii
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile (Join-Path $rt "get-pip.py") -UseBasicParsing
    & $pyExe (Join-Path $rt "get-pip.py") --quiet
}

Write-Host "==> Installing / upgrading pip …"
& $pyExe -m pip install --upgrade pip --quiet

Write-Host "==> Installing PyTorch (CPU) …"
& $pyExe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

Write-Host "==> Installing API + ML dependencies …"
& $pyExe -m pip install -r (Join-Path $PSScriptRoot "requirements-ml.txt")

Write-Host "==> Downloading detector model weights …"
& $pyExe (Join-Path $PSScriptRoot "download_model.py")

Write-Host "Runtime ready: $pyExe"
