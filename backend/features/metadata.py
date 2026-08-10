"""
EXIF metadata analysis.

Camera-generated images carry rich EXIF metadata (camera make, model,
lens settings, exposure, etc.).  AI-generated images typically lack this
metadata entirely, or contain suspicious software tags.

We extract and score metadata features without relying on a simple
present/absent binary — the distribution of metadata fields itself carries
signal.
"""

from __future__ import annotations

import io
from typing import Any

import piexif
from numpy.typing import NDArray


# Software strings commonly found in AI-generated images
AI_SOFTWARE_TAGS = [
    "dall-e", "midjourney", "stable diffusion", "sd ", "sdxl",
    "firefly", "craiyon", "deepai", "nightcafe", "runway",
    "leonardo", "playground", "bing image", "copilot",
    "generated", "synthetic", "artificial", "comfyui",
    "automatic1111", "invoke", "fooocus",
]

# Known camera manufacturers
KNOWN_MAKERS = [
    "canon", "nikon", "sony", "fuji", "olympus", "panasonic",
    "samsung", "apple", "google", "huawei", "xiaomi", "leica",
    "pentax", "hasselblad", "phase one", "sigma",
]


def extract_metadata_features(jpeg_bytes: bytes | None) -> dict[str, float]:
    """Extract features from EXIF metadata.

    Parameters
    ----------
    jpeg_bytes : raw JPEG file bytes (None if not JPEG)

    Returns
    -------
    dict mapping feature name -> float value.
    """
    features: dict[str, float] = {}

    if jpeg_bytes is None:
        # Not a JPEG — no metadata possible
        features["meta_has_exif"] = 0.0
        features["meta_has_make"] = 0.0
        features["meta_has_model"] = 0.0
        features["meta_has_software"] = 0.0
        features["meta_has_gps"] = 0.0
        features["meta_has_exposure"] = 0.0
        features["meta_has_focal"] = 0.0
        features["meta_has_iso"] = 0.0
        features["meta_ai_software_match"] = 0.0
        features["meta_known_maker"] = 0.0
        features["meta_tag_count"] = 0.0
        return features

    try:
        exif_dict = piexif.load(io.BytesIO(jpeg_bytes))
    except Exception:
        features["meta_has_exif"] = 0.0
        features["meta_has_make"] = 0.0
        features["meta_has_model"] = 0.0
        features["meta_has_software"] = 0.0
        features["meta_has_gps"] = 0.0
        features["meta_has_exposure"] = 0.0
        features["meta_has_focal"] = 0.0
        features["meta_has_iso"] = 0.0
        features["meta_ai_software_match"] = 0.0
        features["meta_known_maker"] = 0.0
        features["meta_tag_count"] = 0.0
        return features

    ifd0 = exif_dict.get("0th", {})
    exif_ifd = exif_dict.get("Exif", {})
    gps_ifd = exif_dict.get("GPS", {})

    # Decode helper
    def _decode(val: Any) -> str:
        if isinstance(val, bytes):
            try:
                return val.decode("utf-8", errors="ignore").strip("\x00").strip()
            except Exception:
                return ""
        if isinstance(val, str):
            return val
        return str(val)

    make = _decode(ifd0.get(piexif.ImageIFD.Make, "")).lower()
    model = _decode(ifd0.get(piexif.ImageIFD.Model, "")).lower()
    software = _decode(ifd0.get(piexif.ImageIFD.Software, "")).lower()

    features["meta_has_exif"] = 1.0
    features["meta_has_make"] = 1.0 if make else 0.0
    features["meta_has_model"] = 1.0 if model else 0.0
    features["meta_has_software"] = 1.0 if software else 0.0
    features["meta_has_gps"] = 1.0 if gps_ifd else 0.0
    features["meta_has_exposure"] = 1.0 if exif_ifd.get(piexif.ExifIFD.ExposureTime) else 0.0
    features["meta_has_focal"] = 1.0 if exif_ifd.get(piexif.ExifIFD.FocalLength) else 0.0
    features["meta_has_iso"] = 1.0 if exif_ifd.get(piexif.ExifIFD.ISOSpeedRatings) else 0.0

    # AI software tag match
    ai_match = any(tag in software for tag in AI_SOFTWARE_TAGS)
    features["meta_ai_software_match"] = 1.0 if ai_match else 0.0

    # Known camera maker
    features["meta_known_maker"] = 1.0 if any(m in make for m in KNOWN_MAKERS) else 0.0

    # Total tag count (normalised)
    tag_count = sum(len(v) for v in [ifd0, exif_ifd, gps_ifd] if isinstance(v, dict))
    features["meta_tag_count"] = min(tag_count / 30.0, 1.0)

    return features
