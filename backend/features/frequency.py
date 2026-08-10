"""
Frequency-domain feature extraction (FFT / DCT).

AI-generated images often exhibit unusual patterns in the frequency domain:
  - Missing or attenuated high-frequency content (over-smoothing).
  - Periodic spectral spikes from upsampling layers in GANs/diffusion models.
  - Abnormal energy distribution across frequency bands.

We compute:
  1. Radial energy spectrum of the 2-D FFT (binned into concentric rings).
  2. DCT coefficient statistics per 8x8 block.
  3. Spectral asymmetry and peak-to-mean ratio.
"""

from __future__ import annotations

import cv2
import numpy as np
from numpy.typing import NDArray


def _radial_profile(data: NDArray, centre: tuple[int, int]) -> NDArray:
    """Compute the azimuthally-averaged radial profile of a 2-D array."""
    y, x = np.indices(data.shape)
    r = np.sqrt((x - centre[0]) ** 2 + (y - centre[1]) ** 2).astype(int)
    max_r = min(data.shape) // 2
    tbin = np.bincount(r.ravel(), data.ravel())[:max_r]
    nr = np.bincount(r.ravel())[:max_r]
    return np.divide(tbin, nr, out=np.zeros_like(tbin, dtype=float), where=nr > 0)


def _dct_2d(block: NDArray) -> NDArray:
    """Compute 2D DCT-II on a single block using numpy (no scipy)."""
    N = block.shape[0]
    n = np.arange(N)
    k = n.reshape(-1, 1)
    cos_table = np.cos(np.pi * (2 * n + 1) * k / (2 * N))
    return cos_table @ block @ cos_table.T


def _dct_blocks(gray: NDArray, block_size: int = 8) -> NDArray:
    """Compute DCT on each non-overlapping block."""
    h, w = gray.shape
    h -= h % block_size
    w -= w % block_size
    n_blocks_h = h // block_size
    n_blocks_w = w // block_size

    coeffs = np.zeros((n_blocks_h * n_blocks_w, block_size, block_size), dtype=np.float32)
    idx = 0
    for by in range(0, h, block_size):
        for bx in range(0, w, block_size):
            block = gray[by:by+block_size, bx:bx+block_size].astype(np.float32)
            coeffs[idx] = _dct_2d(block)
            idx += 1
    return coeffs


def fft_features(gray: NDArray) -> dict[str, float]:
    """Extract features from the 2-D FFT magnitude spectrum."""
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    mag = np.log1p(np.abs(fshift))

    h, w = mag.shape
    cy, cx = h // 2, w // 2
    profile = _radial_profile(mag, (cx, cy))

    pmax = profile.max()
    if pmax > 0:
        profile = profile / pmax

    n_bins = 16
    bins = np.array_split(profile, n_bins)
    features: dict[str, float] = {}
    for i, b in enumerate(bins):
        features[f"fft_bin_{i}"] = float(np.mean(b)) if len(b) > 0 else 0.0

    total_energy = float(mag.sum())
    features["fft_total_energy"] = total_energy

    low = mag[cy - h // 8 : cy + h // 8, cx - w // 8 : cx + w // 8]
    features["fft_low_freq_ratio"] = float(low.sum() / (total_energy + 1e-10))

    features["fft_peak_to_mean"] = float(mag.max() / (mag.mean() + 1e-10))

    geo_mean = float(np.exp(np.mean(np.log(mag + 1e-10))))
    features["fft_spectral_flatness"] = geo_mean / (mag.mean() + 1e-10)

    return features


def dct_features(gray: NDArray, block_size: int = 8) -> dict[str, float]:
    """Compute DCT coefficient statistics over non-overlapping blocks."""
    h, w = gray.shape
    h -= h % block_size
    w -= w % block_size

    dct_coeffs = _dct_blocks(gray[:h, :w], block_size)

    features: dict[str, float] = {}
    features["dct_mean"] = float(np.mean(dct_coeffs))
    features["dct_std"] = float(np.std(dct_coeffs))

    flat = dct_coeffs.flatten()
    mu = flat.mean()
    sig = flat.std() + 1e-10
    features["dct_skew"] = float(np.mean(((flat - mu) / sig) ** 3))
    features["dct_kurtosis"] = float(np.mean(((flat - mu) / sig) ** 4) - 3)

    dc = dct_coeffs[:, 0, 0]
    total_energy = np.sum(dct_coeffs ** 2, axis=(1, 2))
    ac_energy = total_energy - dc ** 2
    features["dct_ac_energy_ratio"] = float(np.mean(ac_energy / (total_energy + 1e-10)))

    mask = np.triu(np.ones((block_size, block_size), dtype=bool), k=1)
    hf_energy = np.sum(dct_coeffs[:, mask] ** 2, axis=1)
    features["dct_hf_energy_ratio"] = float(np.mean(hf_energy / (total_energy + 1e-10)))

    return features


def extract_frequency_features(gray: NDArray) -> dict[str, float]:
    """Convenience wrapper: FFT + DCT features combined."""
    feats = {}
    feats.update(fft_features(gray))
    feats.update(dct_features(gray))
    return feats
