"""
Error Level Analysis (ELA).

ELA works by re-compressing the image at a known JPEG quality level and
measuring the pixel-wise difference.  In authentic photographs, compression
artefacts are spread fairly uniformly.  Manipulated or AI-generated regions
tend to show higher residual error because they lack the natural JPEG grid
alignment found in camera-original images.
"""

from __future__ import annotations

import io

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image


def compute_ela(
    img_bgr: NDArray,
    quality: int = 90,
) -> dict[str, float]:
    """Compute Error Level Analysis features.

    Parameters
    ----------
    img_bgr : BGR uint8 image
    quality : JPEG quality for re-compression (lower = more aggressive)

    Returns
    -------
    dict mapping feature name -> float value.
    """
    # Convert to PIL, re-compress, reload
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(img_rgb)

    buf = io.BytesIO()
    pil.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    reloaded = np.array(Image.open(buf).convert("RGB")).astype(np.float32)

    original = img_rgb.astype(np.float32)

    # Absolute error map
    ela_map = np.abs(original - reloaded)

    features: dict[str, float] = {}
    features["ela_mean"] = float(ela_map.mean())
    features["ela_std"] = float(ela_map.std())
    features["ela_max"] = float(ela_map.max())
    features["ela_median"] = float(np.median(ela_map))

    # Per-channel
    for ch, name in enumerate(["r", "g", "b"]):
        features[f"ela_{name}_mean"] = float(ela_map[:, :, ch].mean())

    # Spatial distribution: split into 4x4 grid and compute variance
    h, w = ela_map.shape[:2]
    grid_h, grid_w = h // 4, w // 4
    cell_vars = []
    for i in range(4):
        for j in range(4):
            cell = ela_map[i * grid_h : (i + 1) * grid_h, j * grid_w : (j + 1) * grid_w]
            cell_vars.append(float(cell.mean()))
    features["ela_grid_var"] = float(np.var(cell_vars))
    features["ela_grid_cv"] = float(
        np.std(cell_vars) / (np.mean(cell_vars) + 1e-10)
    )

    # High-error pixel ratio (pixels above a threshold)
    threshold = 20.0
    features["ela_high_error_ratio"] = float((ela_map.mean(axis=2) > threshold).mean())

    return features
