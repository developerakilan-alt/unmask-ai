"""Download the dedicated synthetic-image detector weights into checkpoints/."""

from __future__ import annotations

import sys
from pathlib import Path

from huggingface_hub import snapshot_download

TARGET = Path(__file__).resolve().parent / "checkpoints" / "sdxl-detector"

if __name__ == "__main__":
    print("Downloading Organika/sdxl-detector weights …")
    snapshot_download(
        repo_id="Organika/sdxl-detector",
        local_dir=str(TARGET),
        allow_patterns=[
            "model.safetensors",
            "config.json",
            "preprocessor_config.json",
            "README.md",
        ],
    )
    print("Model downloaded to", TARGET)
