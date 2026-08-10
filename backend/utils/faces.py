"""Face detection helpers for the face-check endpoint.

Uses OpenCV's YuNet (ONNX) face detector, which replaced the removed Haar
cascade API in OpenCV 5.x.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import cv2
import numpy as np

from config import (
    FACE_MIN_SIZE,
    FACE_SCORE_THRESHOLD,
    YUNET_INPUT_SIZE,
    YUNET_MODEL_PATH,
)

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _yunet() -> Any | None:
    """Create the YuNet face detector once."""
    try:
        det = cv2.FaceDetectorYN.create(
            str(YUNET_MODEL_PATH),
            "",
            (YUNET_INPUT_SIZE, YUNET_INPUT_SIZE),
            score_threshold=FACE_SCORE_THRESHOLD,
        )
        return det
    except Exception as exc:  # noqa: BLE001
        log.error("YuNet face detector unavailable: %s", exc)
        return None


def detect_faces(img_bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Return face bounding boxes [(x, y, w, h), ...] in BGR image coords."""
    det = _yunet()
    if det is None:
        return []
    h, w = img_bgr.shape[:2]
    if min(h, w) < 16:
        return []
    det.setInputSize((w, h))
    _ok, faces = det.detect(img_bgr)
    if faces is None or len(faces) == 0:
        return []
    boxes = []
    for face in faces:
        x, y, fw, fh = (float(v) for v in face[:4])
        if min(fw, fh) < FACE_MIN_SIZE:
            continue
        boxes.append((int(x), int(y), int(fw), int(fh)))
    return boxes


def face_crop_bytes(img_bgr: np.ndarray, box: tuple[int, int, int, int]) -> bytes | None:
    """Encode a padded face crop to JPEG bytes for the detector."""
    x, y, w, h = box
    pad_x, pad_y = int(0.25 * w), int(0.25 * h)
    x0 = max(0, x - pad_x)
    y0 = max(0, y - pad_y)
    x1 = min(img_bgr.shape[1], x + w + pad_x)
    y1 = min(img_bgr.shape[0], y + h + pad_y)
    crop = img_bgr[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not ok:
        return None
    return buf.tobytes()


def face_check_result(img_bgr: np.ndarray, detector: Any) -> dict:
    """Run the deep detector on each detected face.

    Returns a dict with per-face verdicts plus an aggregate. Honest labelling:
    this is AI-likelihood measured on face regions, NOT a dedicated deepfake
    classifier.
    """
    boxes = detect_faces(img_bgr)
    if not boxes:
        return {
            "face_count": 0,
            "faces": [],
            "aggregate": None,
            "disclaimer": "No faces were detected in this image.",
        }

    faces: list[dict] = []
    for box in boxes:
        crop_bytes = face_crop_bytes(img_bgr, box)
        if crop_bytes is None:
            continue
        out = detector.predict(crop_bytes)
        if not out.get("ok"):
            faces.append({"bbox": list(box), "error": out.get("error")})
            continue
        p_ai = float(out["p_ai"])
        classification = (
            "AI_GENERATED"
            if p_ai >= 0.65
            else ("REAL" if p_ai <= 0.35 else "UNCERTAIN")
        )
        faces.append(
            {
                "bbox": list(box),
                "ai_percent": round(p_ai * 100, 1),
                "classification": classification,
                "confidence": round(max(p_ai, float(out["p_real"])) * 100, 1),
            }
        )

    valid = [f for f in faces if "ai_percent" in f]
    aggregate = None
    if valid:
        mean_ai = sum(f["ai_percent"] for f in valid) / len(valid)
        aggregate = {
            "face_count": len(valid),
            "mean_ai_percent": round(mean_ai, 1),
            "max_ai_percent": round(max(f["ai_percent"] for f in valid), 1),
            "most_suspicious": max(valid, key=lambda f: f["ai_percent"])["ai_percent"],
        }

    return {
        "face_count": len(faces),
        "faces": faces,
        "aggregate": aggregate,
        "disclaimer": (
            "Face-level check runs the same deep detector on face regions. "
            "It is an AI-likelihood signal, not a dedicated deepfake detector."
        ),
    }
