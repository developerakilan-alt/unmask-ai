"""
Evaluate the detection pipeline against the labelled test-set.

POSTs every test image to the running backend and reports metrics.

Usage (backend must be running on port 8000)::

    pwsh> & "$env:LOCALAPPDATA/unmask-ai/runtime/py312/python.exe" backend/tests/run_evaluation.py
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

import httpx

TEST_DIR = Path(__file__).resolve().parent / "test_data"
API = "http://127.0.0.1:8000/api/v1/analyze"
HEALTH = "http://127.0.0.1:8000/health"
REPORT_DIR = Path(__file__).resolve().parent / "reports"


def load_image(path: Path) -> bytes:
    return path.read_bytes()


def predict(client: httpx.Client, data: bytes, client_id: str) -> dict:
    r = client.post(
        API,
        files={"file": ("img.png", data, "image/png")},
        headers={"X-Client-Id": client_id},
        timeout=120,
    )
    return {"status": r.status_code, **r.json()}


def to_metrics(rows: list[dict]) -> dict:
    tp = sum(1 for r in rows if r["true"] == "ai" and r["pred"] == "ai")
    fp = sum(1 for r in rows if r["true"] == "real" and r["pred"] == "ai")
    tn = sum(1 for r in rows if r["true"] == "real" and r["pred"] == "real")
    fn = sum(1 for r in rows if r["true"] == "ai" and r["pred"] == "real")
    unc = sum(1 for r in rows if r["pred"] == "uncertain")
    n = len(rows)
    acc = (tp + tn) / n if n else 0.0
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {
        "n": n,
        "tp": tp, "fp": fp, "tn": tn, "fn": fn, "uncertain": unc,
        "accuracy": round(acc, 4), "precision": round(prec, 4),
        "recall": round(rec, 4), "f1": round(f1, 4),
        "fpr": round(fp / (fp + tn), 4) if (fp + tn) else None,
        "fnr": round(fn / (fn + tp), 4) if (fn + tp) else None,
    }


def main() -> int:
    client = httpx.Client(timeout=180)
    try:
        health = client.get(HEALTH, timeout=20).json()
        print("health:", json.dumps(health, indent=2))
        if health.get("status") != "ok" or not health.get("deep_detector_ready"):
            print("!! backend detector not ready — aborting.")
            return 1
    except Exception as e:
        print(f"!! backend not reachable on {API}: {e}")
        return 1

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    # The backend enforces a per-client daily quota, so each section of the
    # eval uses its own stable client id to stay under the logged-in limit.
    base_id = "eval-runner"
    variant_id = "eval-runner-variants"
    base_rows: list[dict] = []
    variant_by_kind: dict[str, list[dict]] = defaultdict(list)
    screenshot_rows: list[dict] = []
    edge_rows: list[dict] = []

    # 1) base images
    for label, folder in (("ai", TEST_DIR / "ai"), ("real", TEST_DIR / "real")):
        for path in sorted(folder.iterdir()):
            res = predict(client, load_image(path), base_id)
            cls = res.get("classification", "ERROR")
            pred = {"AI_GENERATED": "ai", "REAL": "real", "UNCERTAIN": "uncertain"}.get(cls, "error")
            row = {
                "file": f"{folder.name}/{path.name}", "true": label, "pred": pred,
                "classification": cls, "ai_percent": res.get("ai_percent"),
                "confidence": res.get("confidence"), "status": res.get("status"),
            }
            base_rows.append(row)
            print(f"base  {label:4s} {path.name:38s} -> {cls:<12s} ai%={res.get('ai_percent')} conf={res.get('confidence')}")

    # 2) variants (each inherits the class of its base image)
    for path in sorted((TEST_DIR / "variants").iterdir()):
        stem = path.name
        kind = next((k for k in ("jpeg-q85", "jpeg-q60", "png", "down-50pct", "up-200pct") if k in stem), "other")
        base_name = stem.replace(f"-{kind}", "")
        src_folder = TEST_DIR / "ai" if (TEST_DIR / "ai" / base_name).exists() else TEST_DIR / "real"
        true_label = "ai" if src_folder == TEST_DIR / "ai" else "real"
        res = predict(client, load_image(path), variant_id)
        cls = res.get("classification", "ERROR")
        pred = {"AI_GENERATED": "ai", "REAL": "real", "UNCERTAIN": "uncertain"}.get(cls, "error")
        row = {"file": f"variants/{stem}", "true": true_label, "pred": pred, "classification": cls}
        variant_by_kind[kind].append(row)

    # 3) screenshots (edge cases, reported separately)
    for path in sorted((TEST_DIR / "screenshots").iterdir()):
        res = predict(client, load_image(path), base_id)
        screenshot_rows.append({"file": path.name, "classification": res.get("classification"),
                                "ai_percent": res.get("ai_percent"), "confidence": res.get("confidence"),
                                "status": res.get("status")})
        print(f"edge  {path.name:38s} -> {res.get('classification')} ai%={res.get('ai_percent')} conf={res.get('confidence')}")

    # 4) corrupt input (must fail closed, no guess)
    try:
        res = client.post(
            API,
            files={"file": ("corrupt.png", b"\x00\x01not-an-image\xff", "image/png")},
            headers={"X-Client-Id": base_id},
            timeout=120,
        )
        edge_rows.append({"case": "corrupt-file", "status": res.status_code, "classification": res.json().get("classification"), "detail": str(res.json().get("detail"))[:80]})
        print(f"edge  corrupt-file -> {res.status_code} {res.json()}")
    except Exception as e:
        edge_rows.append({"case": "corrupt-file", "error": str(e)})
        print("edge  corrupt-file -> EXCEPTION", e)

    metrics = to_metrics(base_rows)
    print("\n==== BASE-SET METRICS (ai-positive) ====")
    print(json.dumps(metrics, indent=2))

    report = {"metrics_base": metrics, "base_rows": base_rows, "screenshots": screenshot_rows, "edge": edge_rows}
    for kind, rows in sorted(variant_by_kind.items()):
        m = to_metrics(rows)
        report[f"variants_{kind}"] = m
        print(f"variant {kind:10s} n={m['n']:3d} acc={m['accuracy']} prec={m['precision']} rec={m['recall']} f1={m['f1']} fpr={m['fpr']} fnr={m['fnr']} unc={m['uncertain']}")
        report[f"variants_{kind}_rows"] = rows

    out = REPORT_DIR / "evaluation.json"
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nreport written to {out}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
