"""Forensic signal extraction for the result "Forensics" tab.

These are lightweight, interpretable signals computed on top of the deep
detector: EXIF metadata, image noise, sharpness, and colour statistics.
They complement (and never replace) the model prediction.
"""

from __future__ import annotations

import io
from typing import Any

import cv2
import numpy as np

# piexif is optional at runtime (used only for EXIF extraction).
try:
    import piexif
    _HAS_PIEXIF = True
except Exception:  # noqa: BLE001
    piexif = None
    _HAS_PIEXIF = False

_EXIF_0TH_NAMES = {
    0x010F: "Make",
    0x0110: "Model",
    0x0131: "Software",
    0x0132: "DateTime",
    0x013E: "WhitePoint",
    0x8298: "Copyright",
    0x8827: "ISO",
    0x9003: "DateTimeOriginal",
    0x9004: "DateTimeDigitized",
}
_EXIF_IFD_NAMES = {
    0x829A: "ExposureTime",
    0x829D: "FNumber",
    0x8822: "ExposureProgram",
    0x8827: "ISOSpeedRatings",
    0x9201: "ShutterSpeedValue",
    0x9202: "ApertureValue",
    0x9204: "ExposureBiasValue",
    0x9205: "MaxApertureValue",
    0x9207: "MeteringMode",
    0x9209: "Flash",
    0x920A: "FocalLength",
    0xA402: "ExposureMode",
    0xA403: "WhiteBalance",
    0xA405: "FocalLengthIn35mmFilm",
    0xA432: "LensInfo",
    0xA433: "LensMake",
    0xA434: "LensModel",
    0xA435: "LensSerialNumber",
}
_GPS_KEYS = {"GPSLatitude", "GPSLongitude", "GPSAltitude"}


def _fmt(value: Any) -> str:
    """Best-effort stringify of an EXIF value."""
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8", errors="replace").strip("\x00")
        except Exception:  # noqa: BLE001
            return "<binary>"
    if isinstance(value, (list, tuple)):
        # Rational pairs -> "num/den"
        parts = []
        for v in value:
            if isinstance(v, tuple) and len(v) == 2:
                den = int(v[1])
                parts.append(f"{int(v[0]) / den:.2f}" if den else str(v[0]))
            else:
                parts.append(str(v))
        return ", ".join(parts)
    return str(value)


def extract_exif(image_bytes: bytes) -> dict:
    """Return a readable, sanitised subset of the EXIF tags."""
    if not _HAS_PIEXIF:
        return {"present": False, "note": "EXIF library unavailable"}
    try:
        exif = piexif.load(image_bytes)
    except Exception as exc:  # noqa: BLE001  (piexif raises on PNGs etc.)
        return {"present": False, "note": "No EXIF data"}

    out: dict[str, str] = {}
    for tag_id, name in _EXIF_0TH_NAMES.items():
        if tag_id in exif.get("0th", {}):
            out[name] = _fmt(exif["0th"][tag_id])
    for tag_id, name in _EXIF_IFD_NAMES.items():
        if tag_id in exif.get("Exif", {}):
            out[name] = _fmt(exif["Exif"][tag_id])
    gps = exif.get("GPS", {})
    for key in gps:
        if key in _GPS_KEYS:
            out[key] = _fmt(gps[key])
    return {
        "present": bool(out),
        "tags": out,
    }


def extract_noise_profile(img_gray: np.ndarray) -> dict:
    """Grayscale noise / sharpness statistics via the Laplacian."""
    if img_gray is None or img_gray.size == 0:
        return {"noise_level": 0.0, "sharpness": 0.0}
    lap = cv2.Laplacian(img_gray, cv2.CV_64F)
    noise = float(np.std(lap))
    sharpness = float(np.var(lap))
    return {
        "noise_level": round(noise, 3),
        "sharpness": round(sharpness, 1),
    }


def extract_colour_stats(img_rgb: np.ndarray) -> dict:
    """Per-channel statistics and a coarse colour entropy estimate."""
    if img_rgb is None or img_rgb.size == 0:
        return {"entropy": 0.0, "saturation": 0.0, "channels": {}}
    channels = {}
    for i, name in enumerate(("R", "G", "B")):
        ch = img_rgb[..., i].astype(np.float32)
        hist, _ = np.histogram(ch, bins=16, range=(0, 256))
        hist = hist / max(1, hist.sum())
        entropy = -float(np.sum(hist * np.log2(hist + 1e-12)))
        channels[name] = {
            "mean": round(float(ch.mean()), 1),
            "std": round(float(ch.std()), 1),
            "entropy": round(entropy, 3),
        }
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    return {
        "channels": channels,
        "saturation": round(float(hsv[..., 1].mean()), 1),
        "value": round(float(hsv[..., 2].mean()), 1),
    }


def extract_forensics(image_bytes: bytes) -> dict:
    """Compute the full forensics payload for a scan."""
    forensics: dict[str, Any] = {"exif": {}, "noise": {}, "colour": {}}
    try:
        forensics["exif"] = extract_exif(image_bytes)
    except Exception as exc:  # noqa: BLE001
        forensics["exif"] = {"present": False, "note": f"EXIF error: {exc}"}
    try:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            forensics["noise"] = extract_noise_profile(gray)
            forensics["colour"] = extract_colour_stats(rgb)
    except Exception as exc:  # noqa: BLE001
        forensics["note"] = f"Signal analysis error: {exc}"
    return forensics
