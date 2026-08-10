"""
Head-to-head comparison: Organika/sdxl-detector (deployed) vs
umm-maybe/AI-image-detector (its predecessor) on the same test images.

Both are Swin-B transformers sharing the same label schema and
preprocessing, so they are directly comparable.  Thresholds are identical.
"""

from __future__ import annotations

import sys
from pathlib import Path

import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from models.deep_detector import DeepImageDetector, AI_THRESHOLD, REAL_THRESHOLD

TEST_DIR = Path(__file__).resolve().parent / "test_data"
CP = Path(__file__).resolve().parent.parent / "checkpoints"


def classify(p_ai: float) -> str:
    if p_ai >= AI_THRESHOLD:
        return "AI_GENERATED"
    if p_ai <= REAL_THRESHOLD:
        return "REAL"
    return "UNCERTAIN"


def run(det: DeepImageDetector, path: Path) -> dict:
    with torch.no_grad():
        res = det.predict(path.read_bytes())
    return res


def metrics(rows: list[dict]) -> dict:
    tp = sum(1 for r in rows if r["true"] == "ai" and r["pred"] == "ai")
    fp = sum(1 for r in rows if r["true"] == "real" and r["pred"] == "ai")
    tn = sum(1 for r in rows if r["true"] == "real" and r["pred"] == "real")
    fn = sum(1 for r in rows if r["true"] == "ai" and r["pred"] == "real")
    unc = sum(1 for r in rows if r["pred"] == "uncertain")
    n = len(rows)
    acc = (tp + tn) / n if n else 0
    prec = tp / (tp + fp) if tp + fp else 0
    rec = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0
    return {"n": n, "acc": round(acc, 3), "prec": round(prec, 3), "rec": round(rec, 3),
            "f1": round(f1, 3), "fpr": round(fp / (fp + tn), 3) if fp + tn else None,
            "fnr": round(fn / (fn + tp), 3) if fn + tp else None, "unc": unc}


def main() -> int:
    sdxl = DeepImageDetector(MODEL_DIR := CP / "sdxl-detector")
    umm = DeepImageDetector(CP / "umm-maybe-ai-detector")
    print("sdxl ready:", sdxl.ready, "| umm ready:", umm.ready)
    if not (sdxl.ready and umm.ready):
        print("error:", sdxl.error, umm.error)
        return 1

    rows = []
    print(f"\n{'file':42s} {'true':4s} {'sdxl%':>7s} {'umm%':>7s}   sdxl->cls      umm->cls")
    for label, folder in (("ai", TEST_DIR / "ai"), ("real", TEST_DIR / "real")):
        for path in sorted(folder.iterdir()):
            a = run(sdxl, path)
            b = run(umm, path)
            pa, pb = a["p_ai"], b["p_ai"]
            ca, cb = classify(pa), classify(pb)
            rows.append({"file": f"{folder.name}/{path.name}", "true": label,
                         "sdxl_p_ai": pa, "umm_p_ai": pb, "sdxl_cls": ca, "umm_cls": cb,
                         "pred_sdxl": {"AI_GENERATED": "ai", "REAL": "real", "UNCERTAIN": "uncertain"}[ca],
                         "pred_umm": {"AI_GENERATED": "ai", "REAL": "real", "UNCERTAIN": "uncertain"}[cb]})
            print(f"{folder.name+'/'+path.name:42s} {label:4s} {pa*100:6.1f}% {pb*100:6.1f}%   {ca:<12s} {cb:<12s}")

    print("\n=== METRICS (ai-positive, uncertain counted as wrong) ===")
    for name, key in (("sdxl-detector ", "pred_sdxl"), ("umm-maybe     ", "pred_umm")):
        rows_k = [dict(r, pred=r[key]) for r in rows]
        m = metrics(rows_k)
        print(f"{name}: {m}")

    import json
    (Path(__file__).resolve().parent / "reports" / "model_comparison.json").write_text(
        json.dumps({"rows": rows}, indent=2), encoding="utf-8")

    print("\n=== DISAGREEMENTS ===")
    for r in rows:
        if r["pred_sdxl"] != r["pred_umm"]:
            print(f"  {r['file']:42s} sdxl={r['sdxl_cls']:<12s} umm={r['umm_cls']:<12s} "
                  f"(sdxl {r['sdxl_p_ai']*100:.1f}% vs umm {r['umm_p_ai']*100:.1f}%)")

    print("\n=== SCREENSHOTS (edge cases) ===")
    for path in sorted((TEST_DIR / "screenshots").iterdir()):
        a = run(sdxl, path)
        b = run(umm, path)
        print(f"  {path.name:24s} sdxl={classify(a['p_ai']):<12s} ({a['p_ai']*100:.1f}%)   umm={classify(b['p_ai']):<12s} ({b['p_ai']*100:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
