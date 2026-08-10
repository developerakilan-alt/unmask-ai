"""
Feature fusion module (torch-free).

Combines handcrafted features with a weighted scoring approach to produce
the final AI/real probability.  When a trained model is available, it is
loaded; otherwise we use the backbone's heuristic scoring.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from models.backbone import HandcraftedBackbone


class FeatureFusion:
    """Fuse deep-learning embeddings with handcrafted features.

    Without torch, this delegates to the HandcraftedBackbone which
    scores using weighted feature heuristics or a trained sklearn model.
    """

    def __init__(self, hc_dim: int = 0) -> None:
        self.hc_dim = hc_dim
        self.backbone = HandcraftedBackbone()

    def predict(
        self,
        feature_vec: NDArray,
        feature_dict: dict[str, float],
    ) -> tuple[float, float, NDArray]:
        """Run prediction.

        Returns
        -------
        ai_prob, real_prob : class probabilities
        embedding : feature vector (used for heatmap generation)
        """
        return self.backbone.predict_from_features(feature_vec, feature_dict)
