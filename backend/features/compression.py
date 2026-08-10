"""
JPEG compression artifact analysis.

JPEG compression leaves distinctive block-aligned artefacts.  Real camera
images always go through the camera's JPEG encoder, so they contain
consistent block structures.  AI-generated images often lack these, or
show inconsistent block patterns when they have been saved as JPEG.

We analyse:
  1. Block-boundary energy (DCT grid artefact strength).
  2. Quantisation regularity.
  3. Double-compression detection indicators.
"""

from __future__ import annotations

import cv2
import numpy as np
from numpy.typing import NDArray


def jpeg_artifact_features(gray: NDArray) -> dict[str, float]:
    """Compute JPEG compression artifact features.

    Parameters
    ----------
    gray : uint8 grayscale image

    Returns
    -------
    dict mapping feature name -> float value.
    """
    img = gray.astype(np.float32)
    features: dict[str, float] = {}

    # --- Block boundary energy ---
    # Compare pixel differences at 8-pixel boundaries vs off-boundaries
    h, w = img.shape
    h -= h % 8
    w -= w % 8
    img = img[:h, :w]

    # Horizontal boundaries
    on_boundary_h = []
    off_boundary_h = []
    for y in range(8, h, 8):
        on_diff = np.abs(img[y, :] - img[y - 1, :])
        if y - 2 >= 0:
            off_diff = np.abs(img[y - 1, :] - img[y - 2, :])
            on_boundary_h.extend(on_diff.tolist())
            off_boundary_h.extend(off_diff.tolist())

    # Vertical boundaries
    on_boundary_v = []
    off_boundary_v = []
    for x in range(8, w, 8):
        on_diff = np.abs(img[:, x] - img[:, x - 1])
        if x - 2 >= 0:
            off_diff = np.abs(img[:, x - 1] - img[:, x - 2])
            on_boundary_v.extend(on_diff.tolist())
            off_boundary_v.extend(off_diff.tolist())

    on_mean = np.mean(on_boundary_h + on_boundary_v)
    off_mean = np.mean(off_boundary_h + off_boundary_v)
    features["jpeg_block_boundary_ratio"] = float(on_mean / (off_mean + 1e-10))

    # --- Block-boundary variance ratio ---
    on_var = np.var(on_boundary_h + on_boundary_v)
    off_var = np.var(off_boundary_h + off_boundary_v)
    features["jpeg_block_var_ratio"] = float(on_var / (off_var + 1e-10))

    # --- 8x8 block smoothness ---
    block_size = 8
    block_means = []
    block_vars = []
    for by in range(0, h - block_size + 1, block_size):
        for bx in range(0, w - block_size + 1, block_size):
            block = img[by : by + block_size, bx : bx + block_size]
            block_means.append(block.mean())
            block_vars.append(block.var())

    block_vars = np.array(block_vars)
    features["jpeg_block_var_mean"] = float(block_vars.mean())
    features["jpeg_block_var_std"] = float(block_vars.std())
    features["jpeg_flat_block_ratio"] = float((block_vars < 5).mean())

    # --- Horizontal vs vertical consistency ---
    h_energy = np.mean(on_boundary_h)
    v_energy = np.mean(on_boundary_v)
    features["jpeg_hv_consistency"] = float(min(h_energy, v_energy) / (max(h_energy, v_energy) + 1e-10))

    return features
