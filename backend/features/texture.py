"""
Texture descriptor features (LBP + GLCM).

Local Binary Patterns (LBP) capture micro-texture patterns.  AI-generated
images tend to have smoother, less diverse texture distributions.

Grey-Level Co-occurrence Matrix (GLCM) captures second-order texture
statistics: contrast, dissimilarity, homogeneity, energy, and correlation.
"""

from __future__ import annotations

import cv2
import numpy as np
from numpy.typing import NDArray


def _local_binary_pattern(gray: NDArray, radius: int = 1, n_points: int = 8) -> NDArray:
    """Vectorized LBP computation using numpy roll/shift operations."""
    h, w = gray.shape
    code = np.zeros((h, w), dtype=np.int32)

    for k in range(n_points):
        angle = 2 * np.pi * k / n_points
        dy = int(round(radius * np.sin(angle)))
        dx = int(round(radius * np.cos(angle)))

        shifted = np.roll(np.roll(gray, -dy, axis=0), -dx, axis=1)
        code |= (shifted >= gray).astype(np.int32) << k

    return code.astype(np.float32)


def _graycomatrix_fast(
    gray: NDArray,
    distances: list[int] | None = None,
    angles: list[float] | None = None,
    levels: int = 32,
) -> NDArray:
    """Vectorized GLCM computation."""
    if distances is None:
        distances = [1, 3]
    if angles is None:
        angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]

    h, w = gray.shape
    glcm = np.zeros((levels, levels, len(distances), len(angles)), dtype=np.float32)

    for d_idx, d in enumerate(distances):
        for a_idx, a in enumerate(angles):
            dy = int(round(d * np.sin(a)))
            dx = int(round(d * np.cos(a)))

            src = gray[:h - abs(dy), :w - abs(dx)].astype(np.int32)
            if dy < 0:
                src = gray[-dy:, :w - abs(dx)].astype(np.int32)
                tgt = gray[:h + dy, abs(dx):].astype(np.int32) if dx >= 0 else gray[:h + dy, :w + dx].astype(np.int32)
            elif dx < 0:
                src = gray[:h - dy, -dx:].astype(np.int32)
                tgt = gray[dy:, :w + dx].astype(np.int32)
            else:
                src = gray[:h - dy, :w - dx].astype(np.int32)
                tgt = gray[dy:, dx:].astype(np.int32)

            # Flatten and bin
            s = src.ravel()
            t = tgt.ravel()
            valid = (s >= 0) & (s < levels) & (t >= 0) & (t < levels)
            s, t = s[valid], t[valid]
            indices = s * levels + t
            counts = np.bincount(indices, minlength=levels * levels).astype(np.float32)
            total = counts.sum()
            if total > 0:
                counts /= total
            glcm[:, :, d_idx, a_idx] = counts.reshape(levels, levels)

    return glcm


def _graycoprops_fast(glcm: NDArray, prop: str) -> NDArray:
    """Compute GLCM properties from a precomputed GLCM."""
    levels = glcm.shape[0]
    rows, cols = np.meshgrid(np.arange(levels), np.arange(levels), indexing='ij')
    nd, na = glcm.shape[2], glcm.shape[3]
    props = np.zeros((nd, na), dtype=np.float32)

    if prop == "contrast":
        diff_sq = (rows - cols).astype(np.float32) ** 2
        for d in range(nd):
            for a in range(na):
                props[d, a] = np.sum(diff_sq * glcm[:, :, d, a])
    elif prop == "dissimilarity":
        diff_abs = np.abs(rows - cols).astype(np.float32)
        for d in range(nd):
            for a in range(na):
                props[d, a] = np.sum(diff_abs * glcm[:, :, d, a])
    elif prop == "homogeneity":
        denom = (1.0 + (rows - cols).astype(np.float32) ** 2)
        for d in range(nd):
            for a in range(na):
                props[d, a] = np.sum(glcm[:, :, d, a] / denom)
    elif prop == "energy":
        for d in range(nd):
            for a in range(na):
                props[d, a] = np.sqrt(np.sum(glcm[:, :, d, a] ** 2))
    elif prop == "correlation":
        for d in range(nd):
            for a in range(na):
                cm = glcm[:, :, d, a]
                mu_r = np.sum(rows * cm)
                mu_c = np.sum(cols * cm)
                sig_r = np.sqrt(np.sum((rows - mu_r) ** 2 * cm) + 1e-10)
                sig_c = np.sqrt(np.sum((cols - mu_c) ** 2 * cm) + 1e-10)
                props[d, a] = np.sum((rows - mu_r) * (cols - mu_c) * cm) / (sig_r * sig_c + 1e-10)

    return props


def lbp_features(gray: NDArray, radius: int = 1, n_points: int = 8) -> dict[str, float]:
    """Compute LBP histogram features."""
    lbp = _local_binary_pattern(gray, radius, n_points)

    n_bins = n_points + 2
    hist, _ = np.histogram(lbp.ravel(), bins=n_bins, range=(0, n_bins), density=True)

    features: dict[str, float] = {}
    for i, v in enumerate(hist):
        features[f"lbp_bin_{i}"] = float(v)

    features["lbp_entropy"] = float(-np.sum(hist[hist > 0] * np.log2(hist[hist > 0])))
    features["lbp_uniformity"] = float(np.sum(hist ** 2))
    features["lbp_mean"] = float(lbp.mean())
    features["lbp_std"] = float(lbp.std())

    return features


def glcm_features(gray: NDArray) -> dict[str, float]:
    """Compute GLCM texture properties."""
    quantised = (gray // 8).astype(np.uint8)

    distances = [1, 3]
    angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
    glcm = _graycomatrix_fast(quantised, distances=distances, angles=angles, levels=32)

    props = ["contrast", "dissimilarity", "homogeneity", "energy", "correlation"]
    features: dict[str, float] = {}

    for prop in props:
        vals = _graycoprops_fast(glcm, prop)
        features[f"glcm_{prop}_mean"] = float(vals.mean())
        features[f"glcm_{prop}_std"] = float(vals.std())

    return features


def extract_texture_features(gray: NDArray) -> dict[str, float]:
    """Convenience wrapper: LBP + GLCM features."""
    feats: dict[str, float] = {}
    feats.update(lbp_features(gray))
    feats.update(glcm_features(gray))
    return feats
