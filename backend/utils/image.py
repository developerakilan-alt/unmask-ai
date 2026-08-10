"""Image pre-processing utilities shared across the pipeline."""

from __future__ import annotations

import io
from typing import Optional

import cv2
import numpy as np
from PIL import Image


def load_image_from_bytes(data: bytes) -> np.ndarray:
    """Decode raw bytes into a BGR OpenCV image (H, W, 3)."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image from the supplied bytes.")
    return img


def load_pil_from_bytes(data: bytes) -> Image.Image:
    """Decode raw bytes into an RGB PIL Image."""
    return Image.open(io.BytesIO(data)).convert("RGB")


def resize_long_edge(img: np.ndarray, size: int) -> np.ndarray:
    """Resize so the longest edge equals *size*, preserving aspect ratio."""
    h, w = img.shape[:2]
    if max(h, w) <= size:
        return img
    scale = size / max(h, w)
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def to_rgb(img_bgr: np.ndarray) -> np.ndarray:
    """BGR -> RGB."""
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def to_gray(img: np.ndarray) -> np.ndarray:
    """BGR -> single-channel grayscale."""
    if len(img.shape) == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def normalise_uint8(img: np.ndarray) -> np.ndarray:
    """Clip and scale to [0, 255] uint8."""
    img = np.clip(img, 0, None)
    mx = img.max()
    if mx > 0:
        img = (img / mx * 255).astype(np.uint8)
    return img
