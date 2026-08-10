"""
FastAPI application — the main entry point.

Run with::

    uvicorn main:app --host 0.0.0.0 --port 8000

The server exposes endpoints for AI-image forensics: single/batch/URL
analysis, a face-check tab, per-account scan history, shareable result
links, webhooks, API keys, moderation reports and GDPR data deletion.
"""

from __future__ import annotations

import asyncio
import ipaddress
import logging
import socket
import sys
import time
from pathlib import Path

# Ensure the backend package is on the path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import (
    API_HOST,
    API_PORT,
    CORS_ORIGINS,
    DAILY_FREE_SCANS,
    DAILY_LOGGED_IN_SCANS,
    MAX_IMAGE_BYTES,
    MODEL_REPO,
    RATE_LIMIT_PER_MINUTE,
)
from models.detector import DetectionUnavailable, Detector, ImageDecodeError
from utils import store
from utils.faces import face_check_result
from utils.forensics import extract_forensics
from utils.image import load_image_from_bytes
from utils.limits import DailyQuota, SlidingWindowLimiter

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
log = logging.getLogger("unmask")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Unmask AI",
    description="Production-grade AI image detection API",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Rate limiting / quotas
# ---------------------------------------------------------------------------
_rate_limiter = SlidingWindowLimiter(RATE_LIMIT_PER_MINUTE, window_seconds=60)
_daily_quota = DailyQuota(DAILY_FREE_SCANS, DAILY_LOGGED_IN_SCANS)


def _client_identity(request: Request) -> tuple[str, bool]:
    """Return (identity_key, logged_in) for quota/rate purposes.

    A logged-in client sends its user id via ``X-Client-Id``. Anonymous
    clients are keyed by client IP.
    """
    client_id = request.headers.get("X-Client-Id", "").strip()
    if client_id and len(client_id) <= 128:
        return client_id, True
    ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}", False


def _resolve_client(request: Request) -> tuple[str, bool]:
    """Identity resolution that also honours ``Authorization: Bearer`` API keys."""
    auth = request.headers.get("Authorization", "").strip()
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        if not token:
            raise HTTPException(status_code=401, detail="Missing API key.")
        record = store.api_key_by_sha(store.sha256(token))
        if not record:
            raise HTTPException(status_code=401, detail="Invalid or revoked API key.")
        return record["key"], True
    return _client_identity(request)


def _enforce_limits(request: Request) -> None:
    key, logged_in = _resolve_client(request)

    if not _rate_limiter.check(key):
        raise HTTPException(status_code=429, detail="Too many requests. Try again shortly.")

    used = _daily_quota.used_today(key)
    if used >= _daily_quota.limit_for(logged_in):
        raise HTTPException(
            status_code=429,
            detail="Daily free-scan limit reached. Log in for a higher quota.",
        )


def _consume_quota(request: Request) -> None:
    key, logged_in = _resolve_client(request)
    _daily_quota.increment(key, logged_in)

# ---------------------------------------------------------------------------
# Detector singleton (loaded once at startup)
# ---------------------------------------------------------------------------
_detector: Detector | None = None

APP_STARTED_AT = time.time()


def get_detector() -> Detector:
    global _detector
    if _detector is None:
        _detector = Detector()
    return _detector


@app.on_event("startup")
async def _startup() -> None:
    log.info("Starting Unmask AI backend …")
    detector = get_detector()
    if detector.deep.ready:
        log.info("Detector initialised successfully (model=%s).", detector.model_name)
    else:
        log.error(
            "Detector FAILED to initialise. Analyses will return "
            "'Detection unavailable' (503) instead of a guess. Error: %s",
            detector.deep.error,
        )


# ---------------------------------------------------------------------------
# Webhooks
# ---------------------------------------------------------------------------
async def _deliver_webhooks(key: str, payload: dict) -> None:
    hooks = store.webhooks_for(key)
    if not hooks:
        return
    body = {k: v for k, v in payload.items() if k != "heatmap"}
    async with __import__("httpx").AsyncClient(timeout=5) as client:
        for hook in hooks:
            if not hook.get("active", True):
                continue
            try:
                await client.post(hook["url"], json=body)
            except Exception as exc:  # noqa: BLE001
                log.warning("Webhook delivery failed for %s: %s", hook["id"], exc)


def _schedule_webhooks(key: str, payload: dict) -> None:
    asyncio.create_task(_deliver_webhooks(key, payload))


# ---------------------------------------------------------------------------
# Shared analysis pipeline
# ---------------------------------------------------------------------------
def _result_payload(result, detector: Detector) -> dict:
    return {
        "classification": result.classification,
        "verdict": result.verdict,
        "ai_percent": result.ai_percent,
        "real_percent": result.real_percent,
        "confidence": result.confidence,
        "indicators": [
            {
                "label": ind.label,
                "value": ind.value,
                "aiLikelihood": round(ind.ai_likelihood, 4),
                "detail": ind.detail,
            }
            for ind in result.indicators
        ],
        "heatmap": result.heatmap_base64,
        "feature_scores": result.feature_scores,
        "metadata": result.metadata,
        "debug": result.debug,
    }


async def _run_analysis(request: Request, image_bytes: bytes, filename: str = "") -> dict:
    """Full pipeline: enforce limits, detect, store scan, fire webhooks.

    Raises ImageDecodeError / DetectionUnavailable / HTTPException as needed.
    """
    _enforce_limits(request)
    detector = get_detector()
    result = detector.analyse(image_bytes, filename=filename or "")
    _consume_quota(request)

    payload = _result_payload(result, detector)
    payload["scan_id"] = store.new_id("scan")
    payload["forensics"] = extract_forensics(image_bytes)

    key, _ = _resolve_client(request)
    store.add_scan(
        {
            "id": payload["scan_id"],
            "key": key,
            "filename": filename or "",
            "created_at": time.time(),
            "classification": payload["classification"],
            "verdict": payload["verdict"],
            "ai_percent": payload["ai_percent"],
            "real_percent": payload["real_percent"],
            "confidence": payload["confidence"],
            "indicators": payload["indicators"],
            "feature_scores": payload.get("feature_scores"),
            "metadata": payload.get("metadata"),
            "model": (payload.get("debug") or {}).get("model"),
            "processing_time_ms": (payload.get("metadata") or {}).get("processing_time_ms"),
            "heatmap": payload.get("heatmap"),
            "forensics": payload["forensics"],
        }
    )
    store.record_scan_metric()
    _schedule_webhooks(key, payload)
    return payload


# ---------------------------------------------------------------------------
# Health / status
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    detector = get_detector()
    stats = store.get_stats()
    return {
        "status": "ok" if detector.deep.ready else "degraded",
        "model": detector.model_name,
        "deep_detector_ready": detector.deep.ready,
        "model_repo": MODEL_REPO,
        "privacy": "no images are stored on the server",
        "version": app.version,
        "uptime_seconds": int(time.time() - APP_STARTED_AT),
        "scans_total": stats.get("total_scans", 0),
    }


@app.get("/api/v1/stats")
async def public_stats():
    """Lightweight public counters for the status page."""
    stats = store.get_stats()
    return {
        "total_scans": stats.get("total_scans", 0),
        "scans_today": stats.get("scans_today", 0),
        "last_scan_at": stats.get("last_scan_at"),
        "service_started_at": stats.get("started_at"),
    }


@app.get("/api/v1/quota")
async def quota(request: Request):
    """Return the current client's daily scan allowance."""
    key, logged_in = _resolve_client(request)
    status = _daily_quota.status(key, logged_in)
    status["rate_limit_per_minute"] = RATE_LIMIT_PER_MINUTE
    status["rate_remaining"] = _rate_limiter.remaining(key)
    return status


# ---------------------------------------------------------------------------
# Analyse endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/analyze")
async def analyze(request: Request, file: UploadFile = File(...)):
    """Analyse an uploaded image for AI-generated content.

    Accepts JPEG, PNG, or WEBP images.  Returns a JSON payload with the
    classification (AI_GENERATED / REAL / UNCERTAIN), the model's own
    confidence, explainable forensic indicators, a heatmap, and a debug
    block with raw model output.

    If the detection model cannot produce a prediction, the API returns
    HTTP 503 with ``classification: "UNCERTAIN"`` and
    ``debug.processing_success: false`` — it NEVER guesses REAL/AI.
    """
    # --- Validate upload ---
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB).")

    try:
        payload = await _run_analysis(request, image_bytes, filename=file.filename or "")
    except ImageDecodeError as exc:
        log.warning("Could not decode upload: %s", exc)
        return JSONResponse(
            status_code=400,
            content={
                "detail": "Could not decode image — the file is not a valid image.",
                "classification": "UNCERTAIN",
                "verdict": "uncertain",
                "debug": {
                    "prediction": "UNCERTAIN",
                    "confidence": None,
                    "model": get_detector().model_name,
                    "processing_success": False,
                    "error": str(exc),
                },
            },
        )
    except DetectionUnavailable as exc:
        log.error("Detection unavailable: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Detection unavailable",
                "classification": "UNCERTAIN",
                "verdict": "uncertain",
                "debug": {
                    "prediction": "UNCERTAIN",
                    "confidence": None,
                    "model": get_detector().model_name,
                    "processing_success": False,
                    "error": str(exc),
                },
            },
        )
    except Exception as exc:  # noqa: BLE001
        log.exception("Detection failed")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Detection unavailable",
                "classification": "UNCERTAIN",
                "verdict": "uncertain",
                "debug": {
                    "prediction": "UNCERTAIN",
                    "confidence": None,
                    "model": get_detector().model_name,
                    "processing_success": False,
                    "error": f"{type(exc).__name__}: {exc}",
                },
            },
        )

    return JSONResponse(content=payload)


# ---------------------------------------------------------------------------
# Batch + URL analysis
# ---------------------------------------------------------------------------
MAX_BATCH_FILES = 10


@app.post("/api/v1/analyze-batch")
async def analyze_batch(request: Request, files: list[UploadFile] = File(...)):
    """Analyse up to 10 images in one request."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(status_code=413, detail=f"Batch limited to {MAX_BATCH_FILES} files.")

    results: list[dict] = []
    for f in files:
        filename = f.filename or ""
        try:
            data = await f.read()
            if len(data) == 0:
                results.append({"filename": filename, "error": "Empty file."})
            elif len(data) > MAX_IMAGE_BYTES:
                results.append({"filename": filename, "error": "File too large (max 20 MB)."})
            else:
                results.append(await _run_analysis(request, data, filename=filename))
        except ImageDecodeError:
            results.append({"filename": filename, "error": "Could not decode image."})
        except DetectionUnavailable as exc:
            results.append({"filename": filename, "error": f"Detection unavailable: {exc}"})
        except HTTPException as exc:
            results.append({"filename": filename, "error": str(exc.detail)})

    return {"count": len(results), "results": results}


def _safe_url_target(url: str) -> str:
    """Reject SSRF-ish URLs (private/loopback/link-local hosts)."""
    import httpx
    from urllib.parse import urlparse

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="URL must be http(s).")
    host = parsed.hostname or ""
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        try:
            infos = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        except socket.gaierror:
            raise HTTPException(status_code=400, detail="Could not resolve URL host.")
        ip = ipaddress.ip_address(infos[0][4][0])
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
        raise HTTPException(status_code=400, detail="URL host is not publicly routable.")
    return url


class UrlRequest(BaseModel):
    url: str = Field(..., description="Publicly accessible image URL")


@app.post("/api/v1/analyze-url")
async def analyze_url(request: Request, body: UrlRequest):
    """Analyse an image fetched from a public URL (SSRF-guarded)."""
    import httpx

    url = _safe_url_target(body.url.strip())
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20) as client:
            resp = await client.get(url)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Could not fetch URL: {exc}")

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"URL returned HTTP {resp.status_code}.")
    content_type = resp.headers.get("content-type", "")
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="URL does not point to an image.")
    if len(resp.content) == 0:
        raise HTTPException(status_code=400, detail="URL returned an empty body.")
    if len(resp.content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="URL image too large (max 20 MB).")

    payload = await _run_analysis(request, resp.content, filename=body.url)
    payload["source_url"] = body.url
    return JSONResponse(content=payload)


# ---------------------------------------------------------------------------
# Face check endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/face-check")
async def face_check(request: Request, file: UploadFile = File(...)):
    """Run the deep detector on detected face regions.

    This is an AI-likelihood check on faces, NOT a dedicated deepfake
    classifier. The response carries an explicit disclaimer.
    """
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB).")

    _enforce_limits(request)
    try:
        detector = get_detector()
        img_bgr = load_image_from_bytes(image_bytes)
    except ImageDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}") from exc
    except DetectionUnavailable as exc:
        raise HTTPException(status_code=503, detail=f"Detection unavailable: {exc}") from exc

    if not detector.deep.ready:
        raise HTTPException(status_code=503, detail="Detection unavailable")

    result = face_check_result(img_bgr, detector.deep)
    _consume_quota(request)
    return JSONResponse(content=result)


# ---------------------------------------------------------------------------
# Scan history (per account)
# ---------------------------------------------------------------------------
@app.get("/api/v1/scans")
async def list_scans(request: Request):
    key, _ = _resolve_client(request)
    scans = store.scans_for(key)
    for s in scans:
        s.pop("heatmap", None)  # keep the list light
        s.pop("key", None)
    scans.sort(key=lambda s: s.get("created_at", 0), reverse=True)
    return {"count": len(scans), "scans": scans}


@app.get("/api/v1/scans/{scan_id}")
async def get_scan(scan_id: str, request: Request):
    key, _ = _resolve_client(request)
    scan = store.scan_by_id(scan_id)
    if not scan or scan.get("key") != key:
        raise HTTPException(status_code=404, detail="Scan not found.")
    scan = dict(scan)
    scan.pop("key", None)
    return scan


@app.delete("/api/v1/scans/{scan_id}")
async def delete_scan(scan_id: str, request: Request):
    key, _ = _resolve_client(request)
    scan = store.scan_by_id(scan_id)
    if not scan or scan.get("key") != key:
        raise HTTPException(status_code=404, detail="Scan not found.")
    store.delete_scan(scan_id)
    return {"deleted": True, "scan_id": scan_id}


# ---------------------------------------------------------------------------
# Shareable result links
# ---------------------------------------------------------------------------
class ShareRequest(BaseModel):
    scan_id: str


@app.post("/api/v1/shares")
async def create_share(request: Request, body: ShareRequest):
    key, _ = _resolve_client(request)
    scan = store.scan_by_id(body.scan_id)
    if not scan or scan.get("key") != key:
        raise HTTPException(status_code=404, detail="Scan not found.")
    share_id = store.new_id("share")
    store.add_share(
        {
            "id": share_id,
            "scan_id": body.scan_id,
            "key": key,
            "created_at": time.time(),
            "expires_at": time.time() + 30 * 86400,
        }
    )
    return {"share_id": share_id, "share_url": f"/#/share/{share_id}"}


@app.get("/api/v1/shares/{share_id}")
async def get_share(share_id: str):
    """Public read-only share payload (no ownership required)."""
    share = store.share_by_id(share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share not found.")
    if share.get("expires_at", 0) < time.time():
        raise HTTPException(status_code=410, detail="Share has expired.")
    scan = store.scan_by_id(share["scan_id"])
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    result = dict(scan)
    result.pop("key", None)
    return {"share_id": share_id, "created_at": share.get("created_at"), "result": result}


@app.delete("/api/v1/shares/{share_id}")
async def delete_share(share_id: str, request: Request):
    key, _ = _resolve_client(request)
    share = store.share_by_id(share_id)
    if not share or share.get("key") != key:
        raise HTTPException(status_code=404, detail="Share not found.")
    store.delete_share(share_id)
    return {"deleted": True, "share_id": share_id}


# ---------------------------------------------------------------------------
# Webhooks
# ---------------------------------------------------------------------------
class WebhookRequest(BaseModel):
    url: str = Field(..., description="Endpoint that receives scan events")
    events: list[str] = Field(default_factory=lambda: ["scan.completed"])
    active: bool = True


@app.post("/api/v1/webhooks")
async def create_webhook(request: Request, body: WebhookRequest):
    if not body.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Webhook URL must be http(s).")
    key, _ = _resolve_client(request)
    webhook_id = store.new_id("hook")
    hook = {
        "id": webhook_id,
        "key": key,
        "url": body.url,
        "events": body.events or ["scan.completed"],
        "active": body.active,
        "created_at": time.time(),
    }
    store.add_webhook(hook)
    return hook


@app.get("/api/v1/webhooks")
async def list_webhooks(request: Request):
    key, _ = _resolve_client(request)
    hooks = store.webhooks_for(key)
    for h in hooks:
        h.pop("key", None)
    return {"count": len(hooks), "webhooks": hooks}


@app.delete("/api/v1/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, request: Request):
    key, _ = _resolve_client(request)
    hook = store.webhook_by_id(webhook_id)
    if not hook or hook.get("key") != key:
        raise HTTPException(status_code=404, detail="Webhook not found.")
    store.delete_webhook(webhook_id)
    return {"deleted": True, "webhook_id": webhook_id}


@app.post("/api/v1/webhooks/{webhook_id}/test")
async def test_webhook(webhook_id: str, request: Request):
    import httpx

    key, _ = _resolve_client(request)
    hook = store.webhook_by_id(webhook_id)
    if not hook or hook.get("key") != key:
        raise HTTPException(status_code=404, detail="Webhook not found.")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.post(
                hook["url"],
                json={"event": "test", "webhook_id": webhook_id, "message": "Unmask AI webhook test"},
            )
        return {"sent": True, "status_code": resp.status_code}
    except Exception as exc:  # noqa: BLE001
        return {"sent": False, "error": str(exc)}


# ---------------------------------------------------------------------------
# API keys
# ---------------------------------------------------------------------------
class ApiKeyRequest(BaseModel):
    name: str = Field(default="default", max_length=64)


@app.post("/api/v1/api-keys")
async def create_api_key(request: Request, body: ApiKeyRequest):
    key, _ = _resolve_client(request)
    raw = store.new_api_key()
    key_id = store.new_id("key")
    store.add_api_key(
        {
            "id": key_id,
            "key": key,
            "key_sha": store.sha256(raw),
            "key_prefix": raw[:16],
            "name": body.name or "default",
            "created_at": time.time(),
            "revoked": False,
        }
    )
    # The raw key is returned exactly once.
    return {"id": key_id, "name": body.name or "default", "key": raw, "created_at": time.time()}


@app.get("/api/v1/api-keys")
async def list_api_keys(request: Request):
    key, _ = _resolve_client(request)
    keys = []
    for k in store.api_keys_for(key):
        keys.append(
            {
                "id": k["id"],
                "name": k.get("name", "default"),
                "key_prefix": k.get("key_prefix", ""),
                "created_at": k.get("created_at"),
            }
        )
    return {"count": len(keys), "api_keys": keys}


@app.delete("/api/v1/api-keys/{key_id}")
async def revoke_api_key(key_id: str, request: Request):
    key, _ = _resolve_client(request)
    if not store.revoke_api_key(key, key_id):
        raise HTTPException(status_code=404, detail="API key not found.")
    return {"revoked": True, "key_id": key_id}


# ---------------------------------------------------------------------------
# Moderation reports
# ---------------------------------------------------------------------------
class ReportRequest(BaseModel):
    scan_id: str | None = None
    reason: str = Field(..., max_length=2000)
    contact: str | None = Field(default=None, max_length=200)


@app.post("/api/v1/report")
async def create_report(request: Request, body: ReportRequest):
    key, _ = _resolve_client(request)
    report_id = store.new_id("report")
    store.add_report(
        {
            "id": report_id,
            "key": key,
            "scan_id": body.scan_id,
            "reason": body.reason,
            "contact": body.contact,
            "created_at": time.time(),
        }
    )
    return {"report_id": report_id, "received": True}


# ---------------------------------------------------------------------------
# GDPR: delete my data
# ---------------------------------------------------------------------------
@app.delete("/api/v1/account/data")
async def delete_account_data(request: Request):
    key, _ = _resolve_client(request)
    removed = store.delete_account_data(key)
    return {"deleted": True, **removed}


# ---------------------------------------------------------------------------
# Local dev runner
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True)
