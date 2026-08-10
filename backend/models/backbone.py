"""
Handcrafted feature-based backbone (numpy-only, no sklearn/torch).

Uses weighted feature scoring to produce AI probability scores.
When a checkpoint is available it can load a simple numpy-based model.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from config import CHECKPOINT_PATH

log = logging.getLogger(__name__)


class HandcraftedBackbone:
    """Feature-based backbone using weighted scoring.

    Produces (ai_prob, real_prob) and a feature importance embedding.
    """

    name = "handcrafted_fusion"

    def __init__(self) -> None:
        self._loaded = False
        self._weights: dict[str, float] | None = None
        self._bias: float = 0.0

        if CHECKPOINT_PATH and Path(CHECKPOINT_PATH).is_file():
            self._load_checkpoint(CHECKPOINT_PATH)
        else:
            log.info("No checkpoint — using heuristic scoring.")

    def _load_checkpoint(self, path: str) -> None:
        try:
            import pickle
            with open(path, "rb") as f:
                data = pickle.load(f)
            if "weights" in data and "bias" in data:
                self._weights = data["weights"]
                self._bias = data["bias"]
                self._loaded = True
                log.info("Loaded numpy weights from %s", path)
            elif "coef_" in data and "intercept_" in data:
                self._weights = {
                    name: float(data["coef_"][0][i])
                    for i, name in enumerate(data.get("feature_names", []))
                }
                self._bias = float(data["intercept_"][0])
                self._loaded = True
                log.info("Loaded sklearn weights from %s", path)
        except Exception as exc:
            log.warning("Could not load checkpoint: %s", exc)

    def predict_from_features(
        self, feature_vec: NDArray, feature_dict: dict[str, float]
    ) -> tuple[float, float, NDArray]:
        """Predict AI probability from handcrafted features.

        Returns
        -------
        ai_prob : float in [0, 1]
        real_prob : float in [0, 1]
        embedding : feature vector
        """
        if self._loaded and self._weights is not None:
            score = self._bias
            for name, weight in self._weights.items():
                val = feature_dict.get(name, 0.0)
                score += val * weight
            ai_prob = float(1.0 / (1.0 + np.exp(-np.clip(score, -20, 20))))
            real_prob = 1.0 - ai_prob
            return ai_prob, real_prob, feature_vec

        ai_prob = self._heuristic_score(feature_dict)
        real_prob = 1.0 - ai_prob
        return ai_prob, real_prob, feature_vec

    @staticmethod
    def _heuristic_score(fd: dict[str, float]) -> float:
        """Compute AI probability from handcrafted feature values.

        Each feature is normalised to [0, 1] where 1 = definitely AI,
        0 = definitely real.  Features where "higher raw value = more real"
        are explicitly inverted.
        """

        def _clamp01(v: float) -> float:
            return max(0.0, min(1.0, v))

        def _sigmoid(x: float, midpoint: float, steepness: float = 1.0) -> float:
            return 1.0 / (1.0 + np.exp(-steepness * (x - midpoint)))

        # ----------------------------------------------------------------
        # Metadata (strongest signal — binary / categorical)
        # ----------------------------------------------------------------
        meta_ai_sw = fd.get("meta_ai_software_match", 0.0)
        meta_has_exif = fd.get("meta_has_exif", 0.0)
        meta_known_maker = fd.get("meta_known_maker", 0.0)

        # AI software tag found → almost certainly AI
        ai_score = float(meta_ai_sw) * 5.0
        ai_weight = 5.0

        # No EXIF at all → likely AI (real cameras always embed EXIF)
        no_exif = 1.0 - float(meta_has_exif)
        ai_score += no_exif * 3.0
        ai_weight += 3.0

        # Unknown camera maker → likely AI
        unknown_maker = 1.0 - float(meta_known_maker)
        ai_score += unknown_maker * 2.0
        ai_weight += 2.0

        # ----------------------------------------------------------------
        # Noise — real camera images have MORE sensor noise
        # Lower noise → more likely AI
        # ----------------------------------------------------------------
        noise_mean = float(fd.get("noise_mean_residual", 10.0))
        # Typical real range: 5-40.  Sigmoid: midpoint at 8, AI below.
        noise_ai = 1.0 - _sigmoid(noise_mean, midpoint=8.0, steepness=0.3)
        ai_score += noise_ai * 2.5
        ai_weight += 2.5

        noise_sigma = float(fd.get("noise_sigma_mad", 8.0))
        # Typical real range: 3-25.
        noise_sig_ai = 1.0 - _sigmoid(noise_sigma, midpoint=5.0, steepness=0.3)
        ai_score += noise_sig_ai * 2.0
        ai_weight += 2.0

        noise_cv = float(fd.get("noise_block_var_cv", 0.5))
        # High block-var CV → varied noise → real.  Low CV → uniform → AI.
        noise_cv_ai = 1.0 - _sigmoid(noise_cv, midpoint=0.6, steepness=3.0)
        ai_score += noise_cv_ai * 1.5
        ai_weight += 1.5

        # ----------------------------------------------------------------
        # Frequency — AI images have flatter / abnormal spectra
        # ----------------------------------------------------------------
        fft_flat = float(fd.get("fft_spectral_flatness", 0.5))
        # Higher flatness → more AI (over-smoothed spectrum)
        fft_flat_ai = _clamp01(fft_flat)
        ai_score += fft_flat_ai * 1.5
        ai_weight += 1.5

        fft_pk = float(fd.get("fft_peak_to_mean", 10.0))
        # High peak-to-mean → strong spectral peaks → may be AI upsampling artefact
        fft_pk_ai = _sigmoid(fft_pk, midpoint=30.0, steepness=0.05)
        ai_score += fft_pk_ai * 1.0
        ai_weight += 1.0

        dct_hf = float(fd.get("dct_hf_energy_ratio", 0.3))
        # Low HF energy ratio → missing high freq → AI over-smoothing
        dct_hf_ai = 1.0 - _sigmoid(dct_hf, midpoint=0.25, steepness=5.0)
        ai_score += dct_hf_ai * 1.0
        ai_weight += 1.0

        # ----------------------------------------------------------------
        # ELA — AI images lack natural JPEG grid alignment
        # ----------------------------------------------------------------
        ela_mean = float(fd.get("ela_mean", 5.0))
        # Unusually low or high ELA error can signal AI
        ela_ai = abs(ela_mean - 6.0) / 20.0
        ai_score += _clamp01(ela_ai) * 1.2
        ai_weight += 1.2

        ela_cv = float(fd.get("ela_grid_cv", 0.5))
        # High grid CV → inconsistent compression → AI
        ela_cv_ai = _sigmoid(ela_cv, midpoint=0.6, steepness=3.0)
        ai_score += ela_cv_ai * 1.0
        ai_weight += 1.0

        # ----------------------------------------------------------------
        # Edge — AI images have abnormal edge profiles
        # ----------------------------------------------------------------
        edge_dens = float(fd.get("edge_density", 0.1))
        # Very low edge density → over-smoothed → AI
        edge_low_ai = 1.0 - _sigmoid(edge_dens, midpoint=0.05, steepness=30.0)
        ai_score += edge_low_ai * 0.8
        ai_weight += 0.8

        sobel_coh = float(fd.get("sobel_direction_coherence", 0.3))
        # Very high coherence → unnaturally uniform → AI
        sobel_ai = _sigmoid(sobel_coh, midpoint=0.6, steepness=5.0)
        ai_score += sobel_ai * 0.8
        ai_weight += 0.8

        lap_var = float(fd.get("laplacian_var", 500.0))
        # Very low Laplacian variance → over-smoothed → AI
        lap_ai = 1.0 - _sigmoid(lap_var, midpoint=200.0, steepness=0.01)
        ai_score += lap_ai * 0.7
        ai_weight += 0.7

        # ----------------------------------------------------------------
        # Texture — AI images have smoother / less diverse texture
        # ----------------------------------------------------------------
        lbp_ent = float(fd.get("lbp_entropy", 2.5))
        # Low LBP entropy → less texture diversity → AI
        lbp_ai = 1.0 - _sigmoid(lbp_ent, midpoint=2.0, steepness=2.0)
        ai_score += lbp_ai * 1.2
        ai_weight += 1.2

        lbp_uni = float(fd.get("lbp_uniformity", 0.15))
        # High uniformity → less texture variety → AI
        lbp_uni_ai = _sigmoid(lbp_uni, midpoint=0.2, steepness=10.0)
        ai_score += lbp_uni_ai * 0.8
        ai_weight += 0.8

        glcm_homog = float(fd.get("glcm_homogeneity_mean", 0.5))
        # Very high homogeneity → unnaturally smooth → AI
        glcm_ai = _sigmoid(glcm_homog, midpoint=0.7, steepness=5.0)
        ai_score += glcm_ai * 0.7
        ai_weight += 0.7

        # ----------------------------------------------------------------
        # Colour — AI images have less natural colour variation
        # ----------------------------------------------------------------
        color_r_std = float(fd.get("color_r_std", 40.0))
        color_g_std = float(fd.get("color_g_std", 40.0))
        # Low colour std → fewer tones → AI
        color_std_avg = (color_r_std + color_g_std) / 2.0
        color_ai = 1.0 - _sigmoid(color_std_avg, midpoint=30.0, steepness=0.1)
        ai_score += color_ai * 0.6
        ai_weight += 0.6

        # ----------------------------------------------------------------
        # Entropy — real images have higher information content
        # ----------------------------------------------------------------
        entropy_g = float(fd.get("entropy_global", 6.5))
        # Low global entropy → less information → AI
        ent_ai = 1.0 - _sigmoid(entropy_g, midpoint=6.0, steepness=0.5)
        ai_score += ent_ai * 1.5
        ai_weight += 1.5

        ent_cv = float(fd.get("entropy_local_cv", 0.15))
        # Low local entropy CV → uniform complexity → AI
        ent_cv_ai = 1.0 - _sigmoid(ent_cv, midpoint=0.15, steepness=10.0)
        ai_score += ent_cv_ai * 1.0
        ai_weight += 1.0

        # ----------------------------------------------------------------
        # Final score
        # ----------------------------------------------------------------
        if ai_weight > 0:
            score = ai_score / ai_weight
        else:
            score = 0.5

        return float(np.clip(score, 0.0, 1.0))
