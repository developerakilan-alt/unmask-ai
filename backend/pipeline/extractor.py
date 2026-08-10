"""
Combined feature extraction pipeline.

Orchestrates all individual feature modules and produces a single
fixed-length handcrafted feature vector that can be fed into the
fusion network alongside the deep-learning embedding.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from features.frequency import extract_frequency_features
from features.noise import noise_features
from features.ela import compute_ela
from features.edge import extract_edge_features
from features.texture import extract_texture_features
from features.color import colour_features
from features.entropy import extract_entropy_features
from features.compression import jpeg_artifact_features
from features.metadata import extract_metadata_features
from utils.image import to_rgb, to_gray


class FeatureExtractor:
    """Runs every feature module and returns a serialised vector + dict.

    The *feature_dict* is useful for explainability; the *feature_vector*
    is what the model consumes.
    """

    def __init__(self) -> None:
        # Build a sorted list of all feature names by doing a dry run
        # with a synthetic image so we know the exact ordering.
        dummy = np.random.randint(0, 256, (64, 64, 3), dtype=np.uint8)
        self._feature_names = sorted(self._extract_all(dummy, b"").keys())
        self.feature_dim = len(self._feature_names)
        self._name_to_idx = {n: i for i, n in enumerate(self._feature_names)}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def __call__(
        self, img_bgr: NDArray, jpeg_bytes: bytes | None = None
    ) -> tuple[np.ndarray, dict[str, float]]:
        """Extract features from an image.

        Parameters
        ----------
        img_bgr     : BGR uint8 image (H, W, 3)
        jpeg_bytes  : raw file bytes (for EXIF)

        Returns
        -------
        feature_vector : float32 array of shape (feature_dim,)
        feature_dict   : {name: value} for explainability
        """
        feat_dict = self._extract_all(img_bgr, jpeg_bytes or b"")

        vec = np.zeros(self.feature_dim, dtype=np.float32)
        for name, val in feat_dict.items():
            if name in self._name_to_idx:
                vec[self._name_to_idx[name]] = float(val)

        return vec, feat_dict

    def get_vector(self, img_bgr: NDArray, jpeg_bytes: bytes | None = None) -> np.ndarray:
        """Return only the feature vector (for model input)."""
        vec, _ = self(img_bgr, jpeg_bytes)
        return vec

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_all(img_bgr: NDArray, jpeg_bytes: bytes) -> dict[str, float]:
        """Run all feature modules and merge results."""
        gray = to_gray(img_bgr)
        rgb = to_rgb(img_bgr)

        feats: dict[str, float] = {}

        # Frequency-domain features
        feats.update(extract_frequency_features(gray))

        # Noise residuals
        feats.update(noise_features(gray, rgb))

        # Error Level Analysis
        feats.update(compute_ela(img_bgr))

        # Edge consistency
        feats.update(extract_edge_features(gray))

        # Texture descriptors (LBP + GLCM)
        feats.update(extract_texture_features(gray))

        # Colour histogram statistics
        feats.update(colour_features(rgb))

        # Entropy
        feats.update(extract_entropy_features(gray))

        # JPEG compression artefacts
        feats.update(jpeg_artifact_features(gray))

        # EXIF metadata
        feats.update(extract_metadata_features(jpeg_bytes))

        return feats
