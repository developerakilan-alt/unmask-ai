"""
Colour histogram statistics.

AI-generated images often exhibit less natural colour variation than real
photographs.  We compute per-channel histograms and derive statistical
descriptors from them.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def colour_features(rgb: NDArray, n_bins: int = 64) -> dict[str, float]:
    """Compute colour histogram features.

    Parameters
    ----------
    rgb : uint8 RGB image (H, W, 3)
    n_bins : number of bins per channel

    Returns
    -------
    dict mapping feature name -> float value.
    """
    features: dict[str, float] = {}

    for ch, name in enumerate(["r", "g", "b"]):
        channel = rgb[:, :, ch].flatten().astype(np.float32)
        hist, _ = np.histogram(channel, bins=n_bins, range=(0, 256), density=True)

        # Basic statistics
        features[f"color_{name}_mean"] = float(channel.mean())
        features[f"color_{name}_std"] = float(channel.std())
        features[f"color_{name}_skew"] = float(
            np.mean(((channel - channel.mean()) / (channel.std() + 1e-10)) ** 3)
        )
        features[f"color_{name}_kurtosis"] = float(
            np.mean(((channel - channel.mean()) / (channel.std() + 1e-10)) ** 4) - 3
        )

        # Histogram shape
        features[f"color_{name}_hist_entropy"] = float(
            -np.sum(hist[hist > 0] * np.log2(hist[hist > 0]))
        )
        features[f"color_{name}_hist_uniformity"] = float(np.sum(hist ** 2))

    # Inter-channel correlations
    r = rgb[:, :, 0].flatten().astype(np.float32)
    g = rgb[:, :, 1].flatten().astype(np.float32)
    b = rgb[:, :, 2].flatten().astype(np.float32)
    features["color_rg_corr"] = float(np.corrcoef(r, g)[0, 1])
    features["color_rb_corr"] = float(np.corrcoef(r, b)[0, 1])
    features["color_gb_corr"] = float(np.corrcoef(g, b)[0, 1])

    return features
