"""
Feature-based heatmap generation (torch-free).

Produces a spatial heatmap highlighting regions of the image that show
anomalous patterns (noise, frequency, edge, or texture anomalies) which
contribute to the AI classification.
"""

from __future__ import annotations

import io
import base64
from typing import Optional

import cv2
import numpy as np
from numpy.typing import NDArray

from config import HEATMAP_COLORMAP


def generate_anomaly_heatmap(
    img_bgr: NDArray,
    feature_dict: dict[str, float],
    ai_prob: float,
) -> NDArray:
    """Generate a spatial heatmap from handcrafted feature anomalies.

    Uses multiple feature maps combined:
    1. Noise residual map (high-pass filter)
    2. Edge anomaly map (Canny edges)
    3. Frequency anomaly map (FFT spectral residual)
    4. ELA map

    The maps are weighted by their AI likelihood scores and combined.

    Parameters
    ----------
    img_bgr       : BGR uint8 image (H, W, 3)
    feature_dict  : extracted feature values
    ai_prob       : overall AI probability [0, 1]

    Returns
    -------
    heatmap : float32 array (H, W) with values in [0, 1]
    """
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)

    maps = []

    # --- Noise residual map ---
    noise_weight = feature_dict.get("noise_mean_residual", 0.5)
    blur = cv2.GaussianBlur(gray, (21, 21), 0)
    noise = np.abs(gray - blur)
    noise_norm = _normalise(noise)
    maps.append((noise_norm, noise_weight))

    # --- Edge anomaly map ---
    edge_weight = feature_dict.get("edge_density", 0.5)
    edges = cv2.Canny(gray.astype(np.uint8), 50, 150).astype(np.float32)
    edge_norm = _normalise(edges)
    # Dilate to make edges thicker
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    edge_thick = cv2.dilate(edge_norm, kernel, iterations=2)
    maps.append((edge_thick, edge_weight))

    # --- Frequency spectral residual ---
    freq_weight = feature_dict.get("fft_spectral_flatness", 0.5)
    freq_map = _spectral_residual_map(gray)
    maps.append((freq_map, freq_weight))

    # --- ELA map ---
    ela_weight = feature_dict.get("ela_mean", 0.5)
    ela_map = _ela_map(img_bgr)
    maps.append((ela_map, ela_weight))

    # --- Texture variance map ---
    tex_weight = feature_dict.get("lbp_entropy", 0.5)
    tex_map = _texture_variance_map(gray)
    maps.append((tex_map, tex_weight))

    # Weighted combination
    total_weight = sum(w for _, w in maps) or 1.0
    combined = np.zeros((h, w), dtype=np.float32)
    for map_arr, weight in maps:
        if map_arr.shape != (h, w):
            map_arr = cv2.resize(map_arr, (w, h), interpolation=cv2.INTER_LINEAR)
        combined += map_arr * (weight / total_weight)

    # Modulate by overall AI probability
    combined = combined * ai_prob + 0.1 * (1 - ai_prob)

    return _normalise(combined)


def _normalise(arr: NDArray) -> NDArray:
    """Normalise to [0, 1]."""
    mn, mx = arr.min(), arr.max()
    if mx - mn > 1e-10:
        return ((arr - mn) / (mx - mn)).astype(np.float32)
    return np.zeros_like(arr, dtype=np.float32)


def _spectral_residual_map(gray: NDArray) -> NDArray:
    """Compute spectral residual in the frequency domain."""
    h, w = gray.shape
    max_fft = 256
    if max(h, w) > max_fft:
        scale = max_fft / max(h, w)
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    h, w = gray.shape
    # Pad to power of 2 for FFT efficiency
    ph = 1 << int(np.ceil(np.log2(max(h, 2))))
    pw = 1 << int(np.ceil(np.log2(max(w, 2))))
    padded = np.zeros((ph, pw), dtype=np.float32)
    padded[:h, :w] = gray

    fft = np.fft.fft2(padded)
    magnitude = np.abs(fft) + 1e-10
    log_mag = np.log(magnitude)

    # Spectral residual
    avg_log = cv2.blur(log_mag, (3, 3))
    sr = log_mag - avg_log

    # Inverse FFT
    sr_complex = np.exp(sr) * np.exp(1j * np.angle(fft))
    residual = np.abs(np.fft.ifft2(sr_complex))

    # Crop back to original size
    residual = residual[:h, :w]
    return _normalise(residual)


def _ela_map(img_bgr: NDArray) -> NDArray:
    """Generate Error Level Analysis map."""
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, 90]
    _, buf = cv2.imencode(".jpg", img_bgr, encode_params)
    recompressed = cv2.imdecode(buf, cv2.IMREAD_COLOR)

    if recompressed is None:
        return np.zeros(img_bgr.shape[:2], dtype=np.float32)

    diff = cv2.absdiff(img_bgr, recompressed).astype(np.float32)
    diff_gray = cv2.cvtColor(diff.astype(np.uint8), cv2.COLOR_BGR2GRAY)
    return _normalise(diff_gray)


def _texture_variance_map(gray: NDArray) -> NDArray:
    """Compute local texture variance map."""
    # Use Laplacian to highlight texture regions
    laplacian = cv2.Laplacian(gray, cv2.CV_32F)
    abs_lap = np.abs(laplacian)
    # Local variance via sliding window
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    local_var = cv2.blur(abs_lap ** 2, (15, 15)) - cv2.blur(abs_lap, (15, 15)) ** 2
    local_var = np.maximum(local_var, 0)
    return _normalise(np.sqrt(local_var))


def heatmap_to_base64(
    heatmap: NDArray,
    original_bgr: NDArray,
    alpha: float = 0.45,
    max_dim: int = 800,
) -> str:
    """Overlay the heatmap on the original image and return as base64 JPEG.

    Parameters
    ----------
    heatmap       : float32 (h, w) in [0, 1]
    original_bgr  : BGR uint8 image
    alpha         : blend factor
    max_dim       : max dimension for the output overlay

    Returns
    -------
    base64-encoded data URI string
    """
    h, w = original_bgr.shape[:2]
    # Cap overlay size to save memory/bandwidth
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        h, w = int(h * scale), int(w * scale)
    heat_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
    orig_rgb = cv2.cvtColor(cv2.resize(original_bgr, (w, h), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)

    # Apply colormap
    heat_uint8 = (heat_resized * 255).astype(np.uint8)
    coloured = cv2.applyColorMap(heat_uint8, cv2.COLORMAP_JET)
    coloured_rgb = cv2.cvtColor(coloured, cv2.COLOR_BGR2RGB)

    # Overlay
    overlay = cv2.addWeighted(orig_rgb, 1 - alpha, coloured_rgb, alpha, 0)

    # Encode
    overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
    _, buf = cv2.imencode(".jpg", overlay_bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"
