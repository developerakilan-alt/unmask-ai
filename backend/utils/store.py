"""Tiny JSON-file backed store for account-scoped records.

Collections (each a JSON list in ``config.DATA_DIR``):
    scans      - per-key scan history (metadata only; original images are
                 never stored, matching the privacy promise)
    shares     - public read-only result links
    webhooks   - per-key webhook subscriptions
    api_keys   - per-key API credentials (only a sha256 is stored)
    reports    - "report a scan" moderation flags
    stats      - counters (total scans, uptime)

Concurrency: single-process, guarded by a threading lock.
"""

from __future__ import annotations

import hashlib
import json
import secrets
import threading
import time
import uuid
from pathlib import Path
from typing import Any

from config import DATA_DIR

_lock = threading.RLock()

MAX_SCANS_PER_KEY = 100
MAX_SHARES_PER_KEY = 100
SCAN_RETENTION_DAYS = 60
SHARE_TTL_DAYS = 30


def _path(name: str) -> Path:
    return DATA_DIR / f"{name}.json"


def _read(name: str) -> list[dict]:
    path = _path(name)
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _write(name: str, rows: list[dict]) -> None:
    path = _path(name)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    tmp.replace(path)


def all_rows(name: str) -> list[dict]:
    with _lock:
        return _read(name)


def add_row(name: str, record: dict) -> dict:
    with _lock:
        rows = _read(name)
        rows.append(record)
        _write(name, rows)
    return record


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def new_api_key() -> str:
    return f"sk_unmask_{secrets.token_hex(24)}"


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def replace_rows(name: str, rows: list[dict]) -> None:
    with _lock:
        _write(name, rows)


# ---------------------------------------------------------------------------
# Scans
# ---------------------------------------------------------------------------
def add_scan(scan: dict) -> None:
    with _lock:
        rows = _read("scans")
        rows.append(scan)
        # Keep the most recent MAX_SCANS_PER_KEY per key.
        rows = sorted(rows, key=lambda r: r.get("created_at", 0), reverse=True)
        seen: dict[str, int] = {}
        kept: list[dict] = []
        for r in rows:
            k = r.get("key", "")
            seen[k] = seen.get(k, 0) + 1
            if seen[k] <= MAX_SCANS_PER_KEY:
                kept.append(r)
        _write("scans", kept)


def scans_for(key: str) -> list[dict]:
    return [s for s in all_rows("scans") if s.get("key") == key]


def scan_by_id(scan_id: str) -> dict | None:
    return next((s for s in all_rows("scans") if s.get("id") == scan_id), None)


def delete_scan(scan_id: str) -> bool:
    with _lock:
        rows = _read("scans")
        kept = [s for s in rows if s.get("id") != scan_id]
        if len(kept) == len(rows):
            return False
        _write("scans", kept)
        return True


# ---------------------------------------------------------------------------
# Shares
# ---------------------------------------------------------------------------
def add_share(share: dict) -> None:
    with _lock:
        rows = _read("shares")
        rows.append(share)
        rows = sorted(rows, key=lambda r: r.get("created_at", 0), reverse=True)
        seen: dict[str, int] = {}
        kept: list[dict] = []
        for r in rows:
            k = r.get("key", "")
            seen[k] = seen.get(k, 0) + 1
            if seen[k] <= MAX_SHARES_PER_KEY:
                kept.append(r)
        _write("shares", kept)


def share_by_id(share_id: str) -> dict | None:
    return next((s for s in all_rows("shares") if s.get("id") == share_id), None)


def delete_share(share_id: str) -> bool:
    with _lock:
        rows = _read("shares")
        kept = [s for s in rows if s.get("id") != share_id]
        if len(kept) == len(rows):
            return False
        _write("shares", kept)
        return True


# ---------------------------------------------------------------------------
# Webhooks
# ---------------------------------------------------------------------------
def webhooks_for(key: str) -> list[dict]:
    return [w for w in all_rows("webhooks") if w.get("key") == key]


def webhook_by_id(webhook_id: str) -> dict | None:
    return next((w for w in all_rows("webhooks") if w.get("id") == webhook_id), None)


def add_webhook(webhook: dict) -> None:
    add_row("webhooks", webhook)


def update_webhook(webhook_id: str, patch: dict) -> dict | None:
    with _lock:
        rows = _read("webhooks")
        for w in rows:
            if w.get("id") == webhook_id:
                w.update(patch)
                _write("webhooks", rows)
                return w
    return None


def delete_webhook(webhook_id: str) -> bool:
    with _lock:
        rows = _read("webhooks")
        kept = [w for w in rows if w.get("id") != webhook_id]
        if len(kept) == len(rows):
            return False
        _write("webhooks", kept)
        return True


# ---------------------------------------------------------------------------
# API keys
# ---------------------------------------------------------------------------
def api_keys_for(key: str) -> list[dict]:
    return [k for k in all_rows("api_keys") if k.get("key") == key and not k.get("revoked")]


def api_key_by_sha(key_sha: str) -> dict | None:
    return next(
        (k for k in all_rows("api_keys") if k.get("key_sha") == key_sha and not k.get("revoked")),
        None,
    )


def add_api_key(api_key: dict) -> None:
    add_row("api_keys", api_key)


def revoke_api_key(key_owner: str, key_id: str) -> bool:
    with _lock:
        rows = _read("api_keys")
        for k in rows:
            if k.get("id") == key_id and k.get("key") == key_owner:
                k["revoked"] = True
                _write("api_keys", rows)
                return True
    return False


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
def add_report(report: dict) -> None:
    add_row("reports", report)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
def _stats() -> dict:
    with _lock:
        rows = _read("stats")
        if not rows:
            rows = [
                {
                    "id": "main",
                    "started_at": time.time(),
                    "total_scans": 0,
                    "scans_today": 0,
                    "today_day": time.strftime("%Y-%m-%d"),
                    "last_scan_at": None,
                }
            ]
            _write("stats", rows)
        return rows[0]


def record_scan_metric() -> dict:
    with _lock:
        stats = _stats()
        stats["total_scans"] += 1
        day = time.strftime("%Y-%m-%d")
        if stats.get("today_day") != day:
            stats["today_day"] = day
            stats["scans_today"] = 0
        stats["scans_today"] += 1
        stats["last_scan_at"] = time.time()
        _write("stats", [stats])
        return stats


def get_stats() -> dict:
    with _lock:
        return dict(_stats())


def reset() -> None:
    with _lock:
        for name in (
            "scans",
            "shares",
            "webhooks",
            "api_keys",
            "reports",
            "stats",
        ):
            path = _path(name)
            if path.exists():
                path.unlink()


# ---------------------------------------------------------------------------
# Account data deletion (GDPR-style "delete my data")
# ---------------------------------------------------------------------------
def delete_account_data(owner: str) -> dict:
    """Remove every record belonging to ``owner``; returns a count summary."""
    removed = {
        "scans": 0,
        "shares": 0,
        "webhooks": 0,
        "api_keys": 0,
        "reports": 0,
    }
    with _lock:
        for name, key_field in (
            ("scans", "key"),
            ("shares", "key"),
            ("webhooks", "key"),
            ("api_keys", "key"),
            ("reports", "key"),
        ):
            rows = _read(name)
            kept = [r for r in rows if r.get(key_field) != owner]
            removed[name] = len(rows) - len(kept)
            _write(name, kept)
    return removed
