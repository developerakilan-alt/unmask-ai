/**
 * Anonymous local quota for offline / playground scans. A simple daily
 * allowance tracked in localStorage so the API playground keeps working
 * (and stays honest about limits) when the backend is unreachable.
 */

const KEY = 'unmask-local-quota';
const DAILY_LIMIT = 20;

interface QuotaState {
  date: string;
  used: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): QuotaState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { date: today(), used: 0 };
    const s = JSON.parse(raw) as QuotaState;
    if (s.date !== today()) return { date: today(), used: 0 };
    return s;
  } catch {
    return { date: today(), used: 0 };
  }
}

function write(s: QuotaState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota errors */
  }
}

export interface LocalQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  logged_in: boolean;
  resets_in_seconds: number;
  rate_limit_per_minute: number;
  rate_remaining: number;
}

export function getLocalQuota(): LocalQuotaInfo {
  const s = read();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return {
    used: s.used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - s.used),
    logged_in: false,
    resets_in_seconds: Math.max(0, Math.round((endOfDay.getTime() - Date.now()) / 1000)),
    rate_limit_per_minute: 5,
    rate_remaining: Math.max(0, 5 - lastMinuteCount()),
  };
}

const MINUTE_KEY = 'unmask-local-rate';

function lastMinuteCount(): number {
  try {
    const raw = JSON.parse(localStorage.getItem(MINUTE_KEY) || '[]') as number[];
    const now = Date.now();
    return raw.filter((t) => now - t < 60_000).length;
  } catch {
    return 0;
  }
}

function stampMinute(): void {
  try {
    const raw = JSON.parse(localStorage.getItem(MINUTE_KEY) || '[]') as number[];
    const now = Date.now();
    const recent = raw.filter((t) => now - t < 60_000);
    recent.push(now);
    localStorage.setItem(MINUTE_KEY, JSON.stringify(recent.slice(-10)));
  } catch {
    /* ignore */
  }
}

/** Consume one local scan. Returns false when the daily allowance is spent. */
export function consumeLocalScan(): boolean {
  const s = read();
  if (s.used >= DAILY_LIMIT) return false;
  write({ date: today(), used: s.used + 1 });
  stampMinute();
  return true;
}
