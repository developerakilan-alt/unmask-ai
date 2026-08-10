"""
Noise residual analysis.

Real camera images contain sensor noise that is approximately Gaussian and
follows a predictable pattern linked to the sensor hardware.  AI-generated
images tend to have much lower or artificially uniform noise.

We compute:
  1. Median-filter residual (difference between original and median-filtered).
  2. Noise-level estimate per channel.
  3. Noise correlation between colour channels.
  4. Local noise variance map statistics.
"""

from __future__ import annotations

import cv2
import numpy as np
from numpy.typing import NDArray


def median_residual(gray: NDArray, ksize: int = 3) -> NDArray:
    """Return the absolute residual after median filtering."""
    median = cv2.medianBlur(gray, ksize)
    return np.abs(gray.astype(np.float32) - median.astype(np.float32))


def noise_features(gray: NDArray, rgb: NDArray | None = None) -> dict[str, float]:
    """Compute noise residual features.

    Parameters
    ----------
    gray : uint8 grayscale
    rgb : optional BGR colour image (for per-channel noise)

    Returns
    -------
    dict mapping feature name -> float value.
    """
    features: dict[str, float] = {}

    # --- Grayscale noise residual ---
    residual = median_residual(gray)
    features["noise_mean_residual"] = float(residual.mean())
    features["noise_std_residual"] = float(residual.std())
    features["noise_median_residual"] = float(np.median(residual))
    features["noise_max_residual"] = float(residual.max())

    # Estimate noise level via MAD (median absolute deviation)
    # This is a robust estimate of the standard deviation of Gaussian noise
    mad = float(np.median(np.abs(residual - np.median(residual))))
    features["noise_mad"] = mad
    features["noise_sigma_mad"] = mad * 1.4826  # consistent with Gaussian assumption

    # --- Block-wise noise variance ---
    block = 16
    h, w = residual.shape
    h -= h % block
    w -= w % block
    blocks = residual[:h, :w].reshape(h // block, block, w // block, block)
    block_vars = blocks.var(axis=(1, 3))
    features["noise_block_var_mean"] = float(block_vars.mean())
    features["noise_block_var_std"] = float(block_vars.std())
    features["noise_block_var_cv"] = float(
        block_vars.std() / (block_vars.mean() + 1e-10)
    )

    # --- Per-channel noise (if colour image provided) ---
    if rgb is not None and len(rgb.shape) == 3:
        for ch, name in enumerate(["b", "g", "r"]):
            ch_residual = median_residual(rgb[:, :, ch])
            features[f"noise_{name}_mean"] = float(ch_residual.mean())
            features[f"noise_{name}_std"] = float(ch_residual.std())

        # Cross-channel noise correlation
        r_res = median_residual(rgb[:, :, 2]).flatten()
        g_res = median_residual(rgb[:, :, 1]).flatten()
        b_res = median_residual(rgb[:, :, 0]).flatten()
        features["noise_rg_corr"] = float(np.corrcoef(r_res, g_res)[0, 1])
        features["noise_rb_corr"] = float(np.corrcoef(r_res, b_res)[0, 1])
        features["noise_gb_corr"] = float(np.corrcoef(g_res, b_res)[0, 1])

    return features
