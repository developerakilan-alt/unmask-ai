import type { AnalysisResult } from '../api';
import { hashDistance } from './image';

/**
 * Scan history. Results are persisted to localStorage immediately so they
 * survive reloads and work on any device. When Supabase is configured and
 * the user is signed in, entries are also mirrored to the `scan_history`
 * table (see supabase/migration.sql) so history follows the account across
 * devices. All sync calls are best-effort and never throw.
 */

export interface HistoryEntry {
  id: string;
  filename: string;
  created_at: number;
  classification: AnalysisResult['classification'];
  ai_percent: number;
  confidence: number;
  model?: string;
  local?: boolean;
  sourceUrl?: string;
  heatmap?: string;
  phash?: string | null;
  generator?: string | null;
}

const KEY = 'unmask-scan-history';

function readAll(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota errors */
  }
}

export function getLocalHistory(): HistoryEntry[] {
  return readAll().sort((a, b) => b.created_at - a.created_at);
}

export async function syncEntryToSupabase(entry: HistoryEntry): Promise<void> {
  try {
    const { getSupabase, isSupabaseConfigured } = await import('./supabase');
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return;
    await supabase.from('scan_history').upsert(entry, { onConflict: 'id' });
  } catch {
    /* table may not exist yet — local storage still covers history */
  }
}

export async function saveResult(result: AnalysisResult): Promise<HistoryEntry> {
  const entry: HistoryEntry = {
    id: result.scanId || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    filename: result.sourceUrl || 'image',
    created_at: Math.floor(Date.now() / 1000),
    classification: result.classification,
    ai_percent: result.aiPercent,
    confidence: result.confidence,
    model: result.modelUsed,
    local: result.local,
    sourceUrl: result.sourceUrl,
    heatmap: result.heatmap || undefined,
    phash: result.phash ?? null,
    generator: result.attribution?.generator ?? null,
  };
  writeAll([entry, ...readAll()].slice(0, 200));
  syncEntryToSupabase(entry);
  return entry;
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function removeLocalEntry(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id));
}

/**
 * Group history into day buckets for a timeline view. Returns entries sorted
 * newest-first keyed by their local calendar day label.
 */
export function groupHistoryByDay(entries: HistoryEntry[]): { day: string; entries: HistoryEntry[] }[] {
  const buckets = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const d = new Date(e.created_at * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const arr = buckets.get(key) || [];
    arr.push(e);
    buckets.set(key, arr);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, group]) => ({
      day,
      entries: group.sort((a, b) => b.created_at - a.created_at),
    }));
}

/** Find entries whose perceptual hash matches a target (dHash distance <= 6). */
export function findMatchingHistory(entries: HistoryEntry[], phash: string | null): HistoryEntry[] {
  if (!phash) return [];
  return entries.filter((e) => e.phash && e.phash !== phash && hashDistance(e.phash, phash) <= 6);
}
