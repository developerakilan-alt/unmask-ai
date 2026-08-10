"""
Dedicated deep-learning detector for AI-generated images.

Uses a Swin Transformer fine-tuned specifically to separate
AI-generated ("artificial") images from real photographs ("human"):
    https://huggingface.co/Organika/sdxl-detector

Class semantics are taken from the model's own config.json (id2label)
and are verified at load time:
    index 0  ->  "artificial"  (AI-generated)
    index 1  ->  "human"       (real photograph)

The raw model logits are logged BEFORE any threshold is applied and the
class probabilities are computed with a numerically-stable softmax so the
caller can audit the mapping.

Classification is NOT performed here — this module only returns calibrated
probabilities.  The threshold / uncertainty logic lives in the Detector.
"""

from __future__ import annotations

import io
import logging
import time
from pathlib import Path

import numpy as np
from PIL import Image

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths / thresholds
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "checkpoints" / "sdxl-detector"

# AI probability thresholds (p_ai from the model's class-0 softmax output).
AI_THRESHOLD = 0.65    # p_ai >= this  -> AI_GENERATED
REAL_THRESHOLD = 0.35  # p_ai <= this  -> REAL (i.e. p_real >= 0.65)
# Between REAL_THRESHOLD and AI_THRESHOLD the prediction is UNCERTAIN.

EXPECTED_LABELS = {0: "artificial", 1: "human"}


class DeepImageDetector:
    """Torch-based Swin Transformer detector.

    Loads lazily so the API server can still boot even if the model cannot
    be initialised.  In that case ``ready`` is ``False`` and callers should
    return a "Detection unavailable" response rather than a guess.
    """

    name = "Swin-B (Organika/sdxl-detector)"

    def __init__(self, model_dir: str | Path = MODEL_DIR) -> None:
        self.model_dir = Path(model_dir)
        self.ready = False
        self.error: str | None = None
        self.id2label: dict[str, str] | None = None
        self._model = None
        self._processor = None
        self._device = None

        self._load()

    # ------------------------------------------------------------------
    # Loading
    # ------------------------------------------------------------------

    def _load(self) -> None:
        t0 = time.time()
        try:
            import torch
            from transformers import AutoImageProcessor, SwinForImageClassification

            if not self.model_dir.exists():
                raise FileNotFoundError(
                    f"Detector weights not found at {self.model_dir}. "
                    "Run the setup script or set UNMASK_MODEL_DIR."
                )

            self._device = torch.device("cpu")
            self._processor = AutoImageProcessor.from_pretrained(self.model_dir)
            self._model = SwinForImageClassification.from_pretrained(self.model_dir)
            self._model.to(self._device)
            self._model.eval()

            raw_labels = getattr(self._model.config, "id2label", {}) or {}
            self.id2label = {str(k): v for k, v in raw_labels.items()}
            self._verify_schema()

            self.ready = True
            log.info(
                "Deep detector ready in %.1fs (labels=%s) from %s",
                time.time() - t0,
                self.id2label,
                self.model_dir,
            )
        except Exception as exc:  # noqa: BLE001 - keep server alive, degrade gracefully
            self.ready = False
            self.error = f"{type(exc).__name__}: {exc}"
            log.exception("Deep detector initialisation failed: %s", exc)

    def _verify_schema(self) -> None:
        """Verify the model's own class mapping matches our expectation.

        If the mapping differs, the probabilities would be swapped and we
        would classify AI images as REAL — so we hard-fail on mismatch.
        """
        if self.id2label is None:
            raise RuntimeError("Model config has no id2label mapping.")
        for idx, expected in EXPECTED_LABELS.items():
            actual = self.id2label.get(str(idx))
            if actual != expected:
                raise RuntimeError(
                    f"Unexpected label for class {idx}: got {actual!r}, expected {expected!r}. "
                    "Refusing to run with an unverified label mapping."
                )
        log.info("Verified class mapping: %s", self.id2label)

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, image_bytes: bytes) -> dict:
        """Run inference and return probabilities.

        Returns
        -------
        {
          "ok": True,
          "p_ai": float,      # P(class 0 = "artificial")
          "p_real": float,    # P(class 1 = "human")
          "logits": [float, float],
          "raw_probs": [float, float],
          "id2label": {...},
        }
        or {"ok": False, "error": str} if inference fails.
        """
        if not self.ready or self._model is None:
            return {
                "ok": False,
                "error": self.error or "Deep detector is not ready.",
            }

        try:
            import torch

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            inputs = self._processor(images=img, return_tensors="pt")
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model(**inputs)

            logits = outputs.logits[0].detach().cpu().numpy().ravel()
            # Numerically stable softmax.
            exp = np.exp(logits - logits.max())
            probs = (exp / exp.sum()).astype(float)

            p_ai = float(probs[0])   # "artificial"
            p_real = float(probs[1]) # "human"

            # Log the RAW model output before any threshold is applied.
            log.info(
                "RAW model output — logits=%s probs=%s (class0=%r, class1=%r)",
                logits.tolist(),
                probs.tolist(),
                self.id2label.get("0"),
                self.id2label.get("1"),
            )

            return {
                "ok": True,
                "p_ai": p_ai,
                "p_real": p_real,
                "logits": logits.tolist(),
                "raw_probs": probs.tolist(),
                "id2label": dict(self.id2label or {}),
            }
        except Exception as exc:  # noqa: BLE001
            log.exception("Deep inference failed")
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
