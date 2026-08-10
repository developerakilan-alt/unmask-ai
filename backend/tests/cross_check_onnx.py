"""
Cross-check our torch inference against the reference ONNX export of the
same model (Organika/sdxl-detector).

If both pipelines agree on every test image, our integration is faithful and
the measured accuracy reflects the model's genuine real-world behaviour.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from models.deep_detector import DeepImageDetector

TEST_DIR = Path(__file__).resolve().parent / "test_data"
ONNX_DIR = Path(__file__).resolve().parent.parent / "checkpoints" / "sdxl-detector" / "onnx"
REPORT = Path(__file__).resolve().parent / "reports" / "evaluation.json"


def preprocess_onnx(path: Path, size=224, mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)) -> np.ndarray:
    img = Image.open(path).convert("RGB")
    img = img.resize((size, size), Image.BILINEAR)
    x = np.asarray(img).astype(np.float32) / 255.0
    x = (x - np.array(mean, dtype=np.float32)) / np.array(std, dtype=np.float32)
    return x.transpose(2, 0, 1)[None]  # 1,3,H,W


def softmax(z):
    e = np.exp(z - z.max())
    return e / e.sum()


def main() -> int:
    torch_detector = DeepImageDetector()
    assert torch_detector.ready, f"torch detector not ready: {torch_detector.error}"

    sess = ort.InferenceSession(str(ONNX_DIR / "model.onnx"), providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name

    rows = json.loads(REPORT.read_text(encoding="utf-8"))["base_rows"]
    mismatches = 0
    print(f"{'file':42s} {'torch%':>8s} {'onnx%':>8s}  agree")
    for row in rows:
        path = TEST_DIR / row["file"]
        onnx_logits = sess.run(None, {input_name: preprocess_onnx(path)})[0][0]
        p_ai_onnx = float(softmax(onnx_logits)[0]) * 100

        image_bytes = path.read_bytes()
        with torch.no_grad():
            res = torch_detector.predict(image_bytes)
        p_ai_torch = res["p_ai"] * 100

        diff = abs(p_ai_onnx - p_ai_torch)
        agree = diff < 1.0
        mismatches += 0 if agree else 1
        print(f"{row['file']:42s} {p_ai_torch:8.2f} {p_ai_onnx:8.2f}  {agree}  (diff={diff:.3f})")

    print(f"\nimages checked: {len(rows)}, mismatches (>1pp): {mismatches}")
    return 1 if mismatches else 0


if __name__ == "__main__":
    sys.exit(main())
