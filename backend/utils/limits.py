"""
Simple in-memory rate limiting and daily freemium quotas.

Used by the API to enforce:
  - a per-key requests-per-minute limit, and
  - a per-key daily analysis quota (the "free scans per day" tier).

NOTE: These counters live in process memory. They reset on restart and are
not shared across workers. Swap for Redis if you scale to multiple instances.
"""

from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class _Bucket:
    window_start: float = 0.0
    count: int = 0


class SlidingWindowLimiter:
    """Fixed-window limiter with a configurable requests-per-window cap."""

    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str) -> bool:
        now = time.time()
        hits = self._hits[key]
        # Drop timestamps outside the window.
        cutoff = now - self.window_seconds
        while hits and hits[0] < cutoff:
            hits.pop(0)
        hits.append(now)
        return len(hits) <= self.limit

    def remaining(self, key: str) -> int:
        now = time.time()
        cutoff = now - self.window_seconds
        self._hits[key] = [t for t in self._hits[key] if t >= cutoff]
        return max(0, self.limit - len(self._hits[key]))


class DailyQuota:
    """Per-key daily counter used for the freemium scan allowance."""

    def __init__(self, default_limit: int, logged_in_limit: int) -> None:
        self.default_limit = default_limit
        self.logged_in_limit = logged_in_limit
        self._buckets: dict[str, _Bucket] = {}

    @staticmethod
    def _day_start(now: float | None = None) -> float:
        t = time.localtime(now or time.time())
        return time.mktime((t.tm_year, t.tm_mon, t.tm_mday, 0, 0, 0, 0, 0, -1))

    def limit_for(self, logged_in: bool) -> int:
        return self.logged_in_limit if logged_in else self.default_limit

    def used_today(self, key: str) -> int:
        bucket = self._buckets.get(key)
        if bucket is None or bucket.window_start != self._day_start():
            return 0
        return bucket.count

    def increment(self, key: str, logged_in: bool) -> int:
        """Count one analysis for the key; returns the new count."""
        today = self._day_start()
        bucket = self._buckets.get(key)
        if bucket is None or bucket.window_start != today:
            bucket = _Bucket(window_start=today)
            self._buckets[key] = bucket
        bucket.count += 1
        return bucket.count

    def status(self, key: str, logged_in: bool) -> dict:
        limit = self.limit_for(logged_in)
        used = self.used_today(key)
        return {
            "used": used,
            "limit": limit,
            "remaining": max(0, limit - used),
            "logged_in": logged_in,
            "resets_in_seconds": max(0, int(self._day_start() + 86400 - time.time())),
        }
