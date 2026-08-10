"""
Main detection orchestrator.

Ties together:
  - Dedicated deep-learning synthetic-image detector (PRIMARY classifier)
    using a Swin Transformer fine-tuned for AI-image detection.
  - Handcrafted feature extractor (forensic indicators / heatmap only)
  - Confidence & uncertainty logic (AI_GENERATED / REAL / UNCERTAIN)

The classification is driven by the deep detector's calibrated class
probabilities.  Handcrafted features are used for explainability but do
NOT decide the verdict.  If the deep detector cannot produce a prediction
the analyser raises ``DetectionUnavailable`` instead of guessing.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from config import BACKBONE
from models.deep_detector import (
    AI_THRESHOLD,
    REAL_THRESHOLD,
    DeepImageDetector,
)
from models.fusion import FeatureFusion
from pipeline.extractor import FeatureExtractor
from pipeline.heatmap import (
    generate_anomaly_heatmap,
    heatmap_to_base64,
)

log = logging.getLogger(__name__)


# -------------------------------------------------------------------
# Exceptions
# -------------------------------------------------------------------

class DetectionUnavailable(Exception):
    """Raised when the detection engine cannot produce a prediction."""


class ImageDecodeError(Exception):
    """Raised when the uploaded bytes cannot be decoded as an image."""


# -------------------------------------------------------------------
# Classification logic
# -------------------------------------------------------------------

def classify(p_ai: float, ai_threshold: float = AI_THRESHOLD, real_threshold: float = REAL_THRESHOLD) -> str:
    """Map AI probability to a three-way class.

    - ``p_ai >= ai_threshold``    -> AI_GENERATED
    - ``p_ai <= real_threshold``  -> REAL
    - otherwise                   -> UNCERTAIN

    The thresholds define an honest uncertainty band so low-confidence
    predictions are never forced into AI or REAL.
    """
    if p_ai >= ai_threshold:
        return "AI_GENERATED"
    if p_ai <= real_threshold:
        return "REAL"
    return "UNCERTAIN"


VERDICT_MAP = {
    "AI_GENERATED": "ai",
    "REAL": "real",
    "UNCERTAIN": "uncertain",
}


# -------------------------------------------------------------------
# Data classes
# -------------------------------------------------------------------

@dataclass
class Indicator:
    label: str
    value: str
    ai_likelihood: float
    detail: str


@dataclass
class DetectionResult:
    verdict: str  # "real" | "ai" | "uncertain"
    classification: str  # "AI_GENERATED" | "REAL" | "UNCERTAIN"
    ai_percent: float
    real_percent: float
    confidence: float
    indicators: list[Indicator]
    heatmap_base64: str
    feature_scores: dict[str, float]
    metadata: dict[str, Any]
    raw_logits: list[float] = field(default_factory=list)
    raw_probs: list[float] = field(default_factory=list)
    debug: dict[str, Any] = field(default_factory=dict)


# -------------------------------------------------------------------
# Detector
# -------------------------------------------------------------------

class Detector:
    """End-to-end image detector.

    Usage::

        detector = Detector()
        result   = detector.analyse(image_bytes, filename="photo.jpg")
    """

    def __init__(self) -> None:
        log.info("Initialising detector (backbone=%s)", BACKBONE)

        # Handcrafted features (forensic indicators / heatmap only).
        self.extractor = FeatureExtractor()
        self.hc_dim = self.extractor.feature_dim

        # Kept for compatibility with the feature-scoring path, but it does
        # NOT decide the verdict anymore.
        self.fusion = FeatureFusion(hc_dim=self.hc_dim)

        # PRIMARY classifier: dedicated deep-learning synthetic-image detector.
        self.deep = DeepImageDetector()
        if self.deep.ready:
            self.model_name = self.deep.name
        else:
            self.model_name = f"{BACKBONE} (deep detector unavailable)"
            log.error("Deep detector unavailable — analyses will fail closed: %s", self.deep.error)

        log.info(
            "Detector ready.  Handcrafted feature dim = %d, classifier = %s",
            self.hc_dim,
            self.model_name,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyse(self, image_bytes: bytes, filename: str = "") -> DetectionResult:
        """Analyse a single image and return a full detection report.

        Parameters
        ----------
        image_bytes : raw file bytes (JPEG / PNG / WEBP)
        filename    : original filename (for metadata lookup)

        Returns
        -------
        DetectionResult with verdict, scores, indicators, and heatmap.

        Raises
        ------
        DetectionUnavailable if the deep detector cannot produce a prediction.
        """
        t0 = time.time()

        # --- Decode image ---
        from utils.image import load_image_from_bytes, resize_long_edge
        try:
            img_bgr = load_image_from_bytes(image_bytes)
        except ValueError as exc:
            raise ImageDecodeError("Could not decode image from the supplied bytes.") from exc

        # Resize for feature extraction (keep original for heatmap)
        MAX_FEATURE_SIZE = 512
        img_small = resize_long_edge(img_bgr, MAX_FEATURE_SIZE)

        # --- Handcrafted features (explainability, not the verdict) ---
        hc_vec, hc_dict = self.extractor(img_small, image_bytes)

        # --- PRIMARY classification: deep-learning detector ---
        deep_out = self.deep.predict(image_bytes)
        if not deep_out.get("ok"):
            # Fail closed — never return REAL / AI_GENERATED when we could not run the model.
            raise DetectionUnavailable(
                f"Deep detector failed: {deep_out.get('error', 'unknown error')}"
            )

        p_ai = float(deep_out["p_ai"])
        p_real = float(deep_out["p_real"])
        raw_logits = deep_out["logits"]
        raw_probs = deep_out["raw_probs"]

        classification = classify(p_ai)
        verdict = VERDICT_MAP[classification]

        # Confidence is the model's own probability — never fabricated.
        confidence = round(max(p_ai, p_real) * 100, 2)

        # --- Anomaly heatmap (forensic map from handcrafted features) ---
        heatmap = generate_anomaly_heatmap(img_small, hc_dict, p_ai)
        heatmap_b64 = heatmap_to_base64(heatmap, img_bgr)

        # --- Forensic indicators (handcrafted features ranked by AI signal) ---
        indicators = self._build_indicators(hc_dict, p_ai)

        # --- Feature scores (normalised to [0,1] for explainability) ---
        feature_scores = {k: float(np.clip(v, 0, 1)) for k, v in hc_dict.items()}

        elapsed_ms = (time.time() - t0) * 1000
        metadata = {
            "model_used": self.model_name,
            "features_analyzed": self.hc_dim,
            "processing_time_ms": round(elapsed_ms, 1),
            "device": "cpu",
        }

        debug = {
            "prediction": classification,
            "confidence": confidence,
            "model": self.model_name,
            "processing_success": True,
            "error": None,
            "raw_logits": raw_logits,
            "raw_probabilities": raw_probs,
            "label_mapping": dict(deep_out.get("id2label", {})),
            "thresholds": {"ai": AI_THRESHOLD, "real": REAL_THRESHOLD},
        }

        return DetectionResult(
            verdict=verdict,
            classification=classification,
            ai_percent=round(p_ai * 100, 1),
            real_percent=round(p_real * 100, 1),
            confidence=confidence,
            indicators=indicators,
            heatmap_base64=heatmap_b64,
            feature_scores=feature_scores,
            metadata=metadata,
            raw_logits=raw_logits,
            raw_probs=raw_probs,
            debug=debug,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_indicators(hc_dict: dict[str, float], ai_prob: float) -> list[Indicator]:
        """Select the most informative features and build explainable indicators.

        Each feature is normalised to [0, 1] where 1 = AI signal, 0 = real signal
        before averaging within a group.
        """

        def _clamp01(v: float) -> float:
            return max(0.0, min(1.0, v))

        def _sigmoid(x: float, mid: float, steep: float = 1.0) -> float:
            return 1.0 / (1.0 + np.exp(-steep * (x - mid)))

        # --- Individual feature → AI-signal normalisation ---
        norm: dict[str, float] = {}

        # Metadata (already 0-1 with correct direction)
        norm["meta_ai_software_match"] = _clamp01(hc_dict.get("meta_ai_software_match", 0.0))
        norm["meta_has_exif"] = 1.0 - _clamp01(hc_dict.get("meta_has_exif", 0.0))
        norm["meta_known_maker"] = 1.0 - _clamp01(hc_dict.get("meta_known_maker", 0.0))

        # Noise (lower = AI)
        norm["noise_mean_residual"] = 1.0 - _sigmoid(hc_dict.get("noise_mean_residual", 10.0), 8.0, 0.3)
        norm["noise_sigma_mad"] = 1.0 - _sigmoid(hc_dict.get("noise_sigma_mad", 8.0), 5.0, 0.3)
        norm["noise_block_var_cv"] = 1.0 - _sigmoid(hc_dict.get("noise_block_var_cv", 0.5), 0.6, 3.0)

        # Frequency
        norm["fft_spectral_flatness"] = _clamp01(hc_dict.get("fft_spectral_flatness", 0.5))
        norm["fft_peak_to_mean"] = _sigmoid(hc_dict.get("fft_peak_to_mean", 10.0), 30.0, 0.05)
        norm["fft_low_freq_ratio"] = _clamp01(hc_dict.get("fft_low_freq_ratio", 0.3))
        norm["dct_ac_energy_ratio"] = _clamp01(hc_dict.get("dct_ac_energy_ratio", 0.7))
        norm["dct_hf_energy_ratio"] = 1.0 - _sigmoid(hc_dict.get("dct_hf_energy_ratio", 0.3), 0.25, 5.0)

        # ELA
        norm["ela_mean"] = _clamp01(abs(hc_dict.get("ela_mean", 5.0) - 6.0) / 20.0)
        norm["ela_grid_cv"] = _sigmoid(hc_dict.get("ela_grid_cv", 0.5), 0.6, 3.0)
        norm["ela_high_error_ratio"] = _clamp01(hc_dict.get("ela_high_error_ratio", 0.1))

        # Edge
        norm["edge_density"] = 1.0 - _sigmoid(hc_dict.get("edge_density", 0.1), 0.05, 30.0)
        norm["sobel_direction_coherence"] = _sigmoid(hc_dict.get("sobel_direction_coherence", 0.3), 0.6, 5.0)
        norm["laplacian_var"] = 1.0 - _sigmoid(hc_dict.get("laplacian_var", 500.0), 200.0, 0.01)

        # Texture
        norm["lbp_entropy"] = 1.0 - _sigmoid(hc_dict.get("lbp_entropy", 2.5), 2.0, 2.0)
        norm["lbp_uniformity"] = _sigmoid(hc_dict.get("lbp_uniformity", 0.15), 0.2, 10.0)
        norm["glcm_contrast_mean"] = _clamp01(hc_dict.get("glcm_contrast_mean", 10.0) / 50.0)
        norm["glcm_homogeneity_mean"] = _sigmoid(hc_dict.get("glcm_homogeneity_mean", 0.5), 0.7, 5.0)

        # Colour
        color_avg = (hc_dict.get("color_r_std", 40.0) + hc_dict.get("color_g_std", 40.0)) / 2.0
        norm["color_r_std"] = 1.0 - _sigmoid(color_avg, 30.0, 0.1)
        norm["color_g_std"] = norm["color_r_std"]
        norm["color_rg_corr"] = _clamp01(abs(hc_dict.get("color_rg_corr", 0.5) - 0.7) / 0.3)

        # Entropy
        norm["entropy_global"] = 1.0 - _sigmoid(hc_dict.get("entropy_global", 6.5), 6.0, 0.5)
        norm["entropy_local_cv"] = 1.0 - _sigmoid(hc_dict.get("entropy_local_cv", 0.15), 0.15, 10.0)

        GROUPS = {
            "frequency": {
                "label": "Frequency Analysis",
                "features": ["fft_spectral_flatness", "fft_peak_to_mean", "dct_hf_energy_ratio"],
                "real": "Natural frequency distribution consistent with camera capture.",
                "ai": "Unusual frequency spectrum — possible upsampling or diffusion artefacts.",
            },
            "noise": {
                "label": "Noise Residuals",
                "features": ["noise_mean_residual", "noise_sigma_mad", "noise_block_var_cv"],
                "real": "Sensor noise pattern consistent with physical camera hardware.",
                "ai": "Noise profile abnormally clean or uniformly distributed — AI signature.",
            },
            "ela": {
                "label": "Compression Analysis",
                "features": ["ela_mean", "ela_grid_cv", "ela_high_error_ratio"],
                "real": "JPEG compression artefacts distributed naturally across the image.",
                "ai": "Unusual compression pattern — image may lack natural JPEG encoding.",
            },
            "edge": {
                "label": "Edge Consistency",
                "features": ["edge_density", "sobel_direction_coherence", "laplacian_var"],
                "real": "Edge profiles consistent with optical lens capture.",
                "ai": "Edge coherence inconsistent — possible generative artefacts.",
            },
            "texture": {
                "label": "Texture Analysis",
                "features": ["lbp_entropy", "lbp_uniformity", "glcm_homogeneity_mean"],
                "real": "Rich micro-texture consistent with real-world surfaces.",
                "ai": "Texture patterns abnormally smooth or regular — synthetic generation.",
            },
            "color": {
                "label": "Colour Distribution",
                "features": ["color_r_std", "color_rg_corr"],
                "real": "Natural colour variation and inter-channel correlation.",
                "ai": "Unusual colour statistics — fewer tones or abnormal channel relationships.",
            },
            "entropy": {
                "label": "Image Entropy",
                "features": ["entropy_global", "entropy_local_cv"],
                "real": "High information content with natural spatial variation.",
                "ai": "Lower-than-expected entropy — possible synthetic smoothing.",
            },
            "metadata": {
                "label": "EXIF Metadata",
                "features": ["meta_has_exif", "meta_known_maker", "meta_ai_software_match"],
                "real": "Camera metadata present and consistent.",
                "ai": "Missing or suspicious metadata — AI generation indicators.",
            },
        }

        indicators: list[Indicator] = []
        for group_name, group in GROUPS.items():
            vals = [norm.get(f, 0.5) for f in group["features"]]
            group_ai = float(np.mean(vals))
            group_ai = max(0.0, min(1.0, group_ai))

            is_ai = group_ai > 0.5
            detail = group["ai"] if is_ai else group["real"]

            indicators.append(Indicator(
                label=group["label"],
                value=f"Score: {group_ai:.3f}",
                ai_likelihood=group_ai,
                detail=detail,
            ))

        indicators.sort(key=lambda ind: abs(ind.ai_likelihood - 0.5), reverse=True)

        return indicators
