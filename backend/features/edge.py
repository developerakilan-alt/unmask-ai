"""
Edge consistency analysis.

Real photographs captured through a physical lens produce edges with
consistent characteristics: gradual intensity fall-off, natural depth-of-field
blur, and coherent gradient directions.  AI-generated images often show
inconsistent edge profiles, abrupt transitions, or unnaturally sharp/soft
boundaries.

We compute:
  1. Canny edge density and spatial distribution.
  2. Sobel gradient magnitude statistics.
  3. Edge direction coherence (circular variance of gradient angles).
  4. Laplacian variance (focus/blur measure).
"""

from __future__ import annotations

import cv2
import numpy as np
from numpy.typing import NDArray


def canny_edge_features(gray: NDArray) -> dict[str, float]:
    """Features based on Canny edge detection."""
    edges = cv2.Canny(gray, 100, 200)
    total_px = edges.size

    features: dict[str, float] = {}
    features["edge_density"] = float(edges.sum() / (255 * total_px))

    # Spatial distribution: 4x4 grid
    h, w = edges.shape
    gh, gw = h // 4, w // 4
    densities = []
    for i in range(4):
        for j in range(4):
            cell = edges[i * gh : (i + 1) * gh, j * gw : (j + 1) * gw]
            densities.append(float(cell.sum() / (255 * cell.size)))
    features["edge_density_var"] = float(np.var(densities))
    features["edge_density_cv"] = float(np.std(densities) / (np.mean(densities) + 1e-10))

    return features


def sobel_gradient_features(gray: NDArray) -> dict[str, float]:
    """Gradient magnitude and direction statistics from Sobel operator."""
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)

    magnitude = np.sqrt(gx ** 2 + gy ** 2)
    angle = np.arctan2(gy, gx)  # [-pi, pi]

    features: dict[str, float] = {}
    features["sobel_mag_mean"] = float(magnitude.mean())
    features["sobel_mag_std"] = float(magnitude.std())
    features["sobel_mag_max"] = float(magnitude.max())

    # Direction coherence:  1 = perfectly aligned, 0 = random
    # Uses the resultant vector length of unit vectors weighted by magnitude
    weights = magnitude / (magnitude.sum() + 1e-10)
    cos_sum = float(np.sum(weights * np.cos(angle)))
    sin_sum = float(np.sum(weights * np.sin(angle)))
    resultant = np.sqrt(cos_sum ** 2 + sin_sum ** 2)
    features["sobel_direction_coherence"] = float(resultant)

    # Circular variance: 0 = all aligned, 1 = uniform
    features["sobel_circular_variance"] = float(1 - resultant)

    return features


def laplacian_features(gray: NDArray) -> dict[str, float]:
    """Laplacian-based focus / texture measure."""
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    features: dict[str, float] = {}
    features["laplacian_var"] = float(lap.var())
    features["laplacian_mean_abs"] = float(np.abs(lap).mean())

    return features


def extract_edge_features(gray: NDArray) -> dict[str, float]:
    """Convenience wrapper: all edge-related features."""
    feats: dict[str, float] = {}
    feats.update(canny_edge_features(gray))
    feats.update(sobel_gradient_features(gray))
    feats.update(laplacian_features(gray))
    return feats
