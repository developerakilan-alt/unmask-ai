"""
Global configuration for the Unmask AI backend.

All tuneable knobs live here so the rest of the codebase stays clean.

Values can be overridden via environment variables or a ``.env`` file in
this directory (see ``.env.example``).
"""

import os
from pathlib import Path

import numpy as np

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

# Optional .env support (works with or without python-dotenv installed).
try:  # pragma: no cover - trivial import guard
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

MODEL_DIR = BASE_DIR / "checkpoints"
MODEL_DIR.mkdir(exist_ok=True)

# Persistent JSON data (scan history, shares, webhooks, API keys, reports).
DATA_DIR = Path(os.getenv("UNMASK_DATA_DIR", str(BASE_DIR / "data")))
DATA_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
BACKBONE: str = os.getenv("UNMASK_BACKBONE", "handcrafted_fusion")

CHECKPOINT_PATH: str | None = os.getenv("UNMASK_CHECKPOINT", None)

# Dedicated deep-learning synthetic-image detector (Swin Transformer).
MODEL_REPO: str = os.getenv("UNMASK_MODEL_REPO", "Organika/sdxl-detector")
MODEL_DIR: Path = BASE_DIR / "checkpoints" / "sdxl-detector"

# AI probability thresholds (P(class 0 = "artificial")).
#   p_ai >= AI_THRESHOLD   -> AI_GENERATED
#   p_ai <= REAL_THRESHOLD -> REAL
#   otherwise              -> UNCERTAIN
AI_THRESHOLD: float = float(os.getenv("UNMASK_AI_THRESHOLD", "0.65"))
REAL_THRESHOLD: float = float(os.getenv("UNMASK_REAL_THRESHOLD", "0.35"))

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

INPUT_SIZE = 224

# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------
COLOR_HIST_BINS = 64

LBP_RADIUS = 1
LBP_N_POINTS = 8

GLCM_DISTANCES = [1, 2, 3]
GLCM_ANGLES = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]

ELA_QUALITY = 90

# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------
DEVICE: str = "cpu"
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB upload limit

# ---------------------------------------------------------------------------
# Heatmap
# ---------------------------------------------------------------------------
HEATMAP_COLORMAP = "jet"

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
API_HOST = os.getenv("UNMASK_HOST", "0.0.0.0")
API_PORT = int(os.getenv("UNMASK_PORT", "8000"))

# CORS. Comma-separated list of allowed origins. "*" only for local dev.
_CORS_DEFAULT = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("UNMASK_CORS_ORIGINS", _CORS_DEFAULT).split(",")
    if o.strip()
]

# ---------------------------------------------------------------------------
# Rate limiting & freemium quotas (per-process, in-memory)
# ---------------------------------------------------------------------------
# NOTE: in-memory counters reset on restart and don't scale across workers.
# Swap for Redis before running multiple instances in production.
RATE_LIMIT_PER_MINUTE = int(os.getenv("UNMASK_RATE_LIMIT", "60"))

# Freemium: free scans per day. Authenticated clients (send X-Client-Id
# with their user id) get a larger quota.
DAILY_FREE_SCANS = int(os.getenv("UNMASK_DAILY_FREE_SCANS", "10"))
DAILY_LOGGED_IN_SCANS = int(os.getenv("UNMASK_DAILY_LOGGED_IN_SCANS", "100"))

# ---------------------------------------------------------------------------
# Face check (deepfake-style tab)
# ---------------------------------------------------------------------------
# Runs the same deep detector on detected face regions. Honest label: this is
# AI-likelihood on faces, not a dedicated deepfake model.
# Uses OpenCV's YuNet (ONNX) face detector.
YUNET_MODEL_PATH = os.getenv(
    "UNMASK_YUNET_MODEL",
    str(BASE_DIR / "checkpoints" / "yunet" / "face_detection_yunet_2023mar.onnx"),
)
YUNET_INPUT_SIZE = 320  # long edge hint for YuNet scoring input
FACE_MIN_SIZE = int(os.getenv("UNMASK_FACE_MIN_SIZE", "60"))
FACE_SCORE_THRESHOLD = float(os.getenv("UNMASK_FACE_SCORE_THRESHOLD", "0.6"))
