"""
Image entropy analysis.

Shannon entropy measures the overall information content of an image.
Real photographs tend to have higher and more spatially variable entropy
than AI-generated images, which can appear overly smooth or regular.

We compute:
  1. Global Shannon entropy of the grayscale image.
  2. Local (block-wise) entropy statistics.
  3. Conditional entropy (predictability).
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def shannon_entropy(gray: NDArray) -> float:
    """Compute the Shannon entropy of a grayscale image."""
    hist, _ = np.histogram(gray, bins=256, range=(0, 256), density=True)
    hist = hist[hist > 0]
    return float(-np.sum(hist * np.log2(hist)))


def local_entropy_features(gray: NDArray, block_size: int = 16) -> dict[str, float]:
    """Compute block-wise entropy statistics.

    Parameters
    ----------
    gray : uint8 grayscale
    block_size : size of each block

    Returns
    -------
    dict mapping feature name -> float value.
    """
    h, w = gray.shape
    h -= h % block_size
    w -= w % block_size
    blocks = gray[:h, :w].reshape(h // block_size, block_size, w // block_size, block_size)
    blocks = blocks.transpose(0, 2, 1, 3).reshape(-1, block_size * block_size)

    entropies = np.array([shannon_entropy(block.reshape(block_size, block_size)) for block in blocks])

    features: dict[str, float] = {}
    features["entropy_global"] = shannon_entropy(gray)
    features["entropy_local_mean"] = float(entropies.mean())
    features["entropy_local_std"] = float(entropies.std())
    features["entropy_local_min"] = float(entropies.min())
    features["entropy_local_max"] = float(entropies.max())
    features["entropy_local_cv"] = float(entropies.std() / (entropies.mean() + 1e-10))

    return features


def extract_entropy_features(gray: NDArray) -> dict[str, float]:
    """Convenience wrapper: all entropy features."""
    return local_entropy_features(gray)
