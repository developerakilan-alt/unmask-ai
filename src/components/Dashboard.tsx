import { useCallback, useEffect, useState } from 'react';
import {
  History,
  Gauge,
  KeyRound,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  Share2,
  Send,
  ShieldAlert,
  Copy,
  FileDown,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import {
  getScans,
  deleteScan,
  createShare,
  analyzeUrl,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  deleteMyData,
  getQuota,
  type ScanRecord,
  type QuotaInfo,
  type WebhookInfo,
  type ApiKeyInfo,
} from '../api';
import { CardSkeleton, ResultSkeleton } from './Skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);

  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookInfo[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [localOnly, setLocalOnly] = useState(false);

  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [hookUrl, setHookUrl] = useState('');
  const [keyName, setKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [resurfaced, setResurfaced] = useState<Record<string, number>>({});
  const [sources, setSources] = useState<Record<string, string>>({});
  const [fresh, setFresh] = useState<{ scanId: string; result: import('../api').AnalysisResult } | null>(null);
  const [rerunning, setRerunning] = useState<string | null>(null);

  const mergeLocalMetadata = useCallback(async () => {
    const { getLocalHistory, findMatchingHistory } = await import('../lib/history');
    const local = getLocalHistory();
    setResurfaced({});
    const byId = new Map(local.map((e) => [e.id, e]));
    setScans((prev) =>
      prev.map((s) => {
        const e = byId.get(s.id);
        return e ? { ...s, phash: e.phash ?? s.phash, generator: e.generator ?? s.generator } : s;
      }),
    );
    const srcMap: Record<string, string> = {};
    for (const e of local) if (e.sourceUrl) srcMap[e.id] = e.sourceUrl;
    setSources(srcMap);
    const map: Record<string, number> = {};
    for (const e of local) {
      const m = findMatchingHistory(local, e.phash ?? null);
      if (m.length > 0) map[e.id] = m.length;
    }
    setResurfaced(map);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, s, w, k] = await Promise.all([getQuota(), getScans(), listWebhooks(), listApiKeys()]);
      setQuota(q);
      setScans(s);
      setWebhooks(w);
      setApiKeys(k);
      setLocalOnly(false);
      mergeLocalMetadata();
    } catch (e) {
      push('error', 'Backend unavailable — showing local history', e instanceof Error ? e.message : undefined);
      const { getLocalHistory } = await import('../lib/history');
      setScans(
        getLocalHistory().map((h) => ({
          id: h.id,
          filename: h.filename,
          created_at: h.created_at,
          classification: h.classification,
          verdict: (h.classification === 'AI_GENERATED' ? 'ai' : h.classification === 'UNCERTAIN' ? 'uncertain' : 'real') as 'ai' | 'real' | 'uncertain',
          ai_percent: h.ai_percent,
          real_percent: 100 - h.ai_percent,
          confidence: h.confidence,
          model: h.model,
          phash: h.phash,
          generator: h.generator,
        })),
      );
      setLocalOnly(true);
      mergeLocalMetadata();
    } finally {
      setLoading(false);
    }
  }, [push, mergeLocalMetadata]);

  useEffect(() => {
    load();
  }, [load]);

  const onAddWebhook = async () => {
    if (!hookUrl.trim()) return;
    try {
      await createWebhook(hookUrl.trim());
      push('success', 'Webhook added');
      setHookUrl('');
      load();
    } catch (e) {
      push('error', 'Failed to add webhook', e instanceof Error ? e.message : undefined);
    }
  };

  const onTestWebhook = async (id: string) => {
    const r = await testWebhook(id);
    push(r.sent ? 'success' : 'error', r.sent ? `Webhook delivered (HTTP ${r.status_code})` : 'Delivery failed', r.error);
  };

  const onCreateKey = async () => {
    try {
      const r = await createApiKey(keyName.trim() || 'default');
      setRevealedKey(r.key);
      push('success', 'API key created — copy it now, it is shown once');
      setKeyName('');
      load();
    } catch (e) {
      push('error', 'Failed to create key', e instanceof Error ? e.message : undefined);
    }
  };

  const onShare = async (scanId: string) => {
    try {
      const s = await createShare(scanId);
      const url = `${window.location.origin}${s.share_url}`;
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'Unmask AI — authenticity scan', text: 'Check this image with Unmask AI', url });
          return;
        } catch {
          /* fall through to clipboard */
        }
      }
      await navigator.clipboard.writeText(url).catch(() => {});
      push('success', 'Share link copied', url);
    } catch (e) {
      push('error', 'Share failed', e instanceof Error ? e.message : undefined);
    }
  };

  const onReRun = async (scanId: string, url: string) => {
    if (rerunning) return;
    setRerunning(scanId);
    try {
      push('info', 'Re-running analysis…', url);
      const result = await analyzeUrl(url);
      setFresh({ scanId, result });
      setExpandedScan(scanId);
      push('success', 'Re-run complete', `Fresh verdict: ${result.classification === 'AI_GENERATED' ? 'AI-generated' : result.classification === 'REAL' ? 'real' : 'uncertain'} · ${result.aiPercent}% AI`);
    } catch (e) {
      push('error', 'Re-run failed', e instanceof Error ? e.message : undefined);
    } finally {
      setRerunning(null);
    }
  };

  const onDeleteData = async () => {
    if (!window.confirm('This permanently deletes all your scans, shares, webhooks and API keys. Continue?')) return;
    try {
      await deleteMyData();
      push('success', 'Your data has been deleted');
      load();
    } catch (e) {
      push('error', 'Delete failed', e instanceof Error ? e.message : undefined);
    }
  };

  const exportRows = () =>
    scans.map((s) => ({
      filename: s.filename,
      classification: s.classification,
      verdict: s.verdict,
      ai_percent: s.ai_percent,
      confidence: s.confidence,
      model: s.model || '',
      created_at: s.created_at,
      generator: s.generator ?? null,
      phash: s.phash ?? null,
    }));

  const exportCsv = async () => {
    const { rowsToCsv, downloadText } = await import('../lib/exportResults');
    downloadText(`unmask-ai-history-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(exportRows()));
  };

  const exportPdf = async () => {
    const { downloadRowsPdf } = await import('../lib/exportResults');
    await downloadRowsPdf(exportRows(), `unmask-ai-history-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const onDeleteScan = async (id: string) => {
    if (localOnly) {
      const { removeLocalEntry } = await import('../lib/history');
      removeLocalEntry(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      push('info', 'Scan deleted (this device)');
      return;
    }
    try {
      await deleteScan(id);
      push('info', 'Scan deleted');
      load();
    } catch (e) {
      push('error', 'Delete failed', e instanceof Error ? e.message : undefined);
    }
  };

  const groups = groupScansByDay(scans);

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ResultSkeleton />
          <ResultSkeleton />
        </div>
      </section>
    );
  }

  const pct = quota && quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0;
  const resetsIn = quota ? Math.round(quota.resets_in_seconds / 3600) : 0;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">
            {user ? user.email : 'Anonymous session — log in for a higher quota'}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {localOnly && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
          Backend is offline — showing history stored on this device. Scans made here won't sync to the cloud until the
          backend is reachable again.
        </div>
      )}

      {/* Usage meter */}
      {quota && (
        <div className="glass mt-6 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-white/60">
              <Gauge className="h-4 w-4 text-neon" /> Free scans today
            </span>
            <span className="text-sm font-bold text-white">
              {quota.used} / {quota.limit}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-neon" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40">
            {quota.remaining} remaining · rate limit {quota.rate_remaining}/{quota.rate_limit_per_minute} per min ·
            resets in ~{resetsIn}h
          </p>
        </div>
      )}

      {/* Scan history */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <History className="h-5 w-5 text-neon" /> Scan history
          </h2>
          {scans.length > 0 && (
            <div className="ml-auto flex gap-2">
              <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">
                <FileDown className="h-3.5 w-3.5" /> CSV
              </button>
              <button onClick={exportPdf} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          )}
        </div>
        {scans.length === 0 ? (
          <div className="glass mt-4 rounded-2xl p-10 text-center text-sm text-white/40">
            No scans yet. Analyze an image to see it here.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map((g) => (
              <div key={g.day}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    {formatDayLabel(g.day)}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-[10px] text-white/30">{g.items.length} scan(s)</span>
                </div>
                <div className="space-y-3">
                  {g.items.map((s) => {
                    const ai = s.classification === 'AI_GENERATED';
                    const unc = s.classification === 'UNCERTAIN';
                    const color = ai ? 'text-danger' : unc ? 'text-amber-400' : 'text-neon';
                    const dot = ai ? 'bg-danger' : unc ? 'bg-amber-400' : 'bg-neon';
                    const open = expandedScan === s.id;
                    const resurfacedCount = resurfaced[s.id];
                    return (
                      <div key={s.id} className="glass rounded-2xl">
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white/85">{s.filename || 'image'}</p>
                            <p className="text-xs text-white/40">
                              {new Date(s.created_at * 1000).toLocaleTimeString()} · {s.model || ''}
                            </p>
                          </div>
                          {resurfacedCount ? (
                            <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300" title="This image matches earlier scans">
                              <AlertTriangle className="h-3 w-3" /> Resurfaced
                            </span>
                          ) : null}
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color} ${ai ? 'bg-danger/10' : unc ? 'bg-amber-400/10' : 'bg-neon/10'}`}>
                            {s.classification === 'AI_GENERATED' ? 'AI' : s.classification === 'REAL' ? 'Real' : 'Uncertain'}
                          </span>
                          <span className="text-xs font-bold text-white/70">{s.ai_percent}% AI</span>
                          {s.generator && (
                            <span className="rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-medium text-neon">{s.generator}</span>
                          )}
                          <div className="flex gap-1.5">
                            {sources[s.id] && (
                              <button
                                onClick={() => onReRun(s.id, sources[s.id])}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-neon"
                                title="Re-run analysis on the original URL"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 ${rerunning === s.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedScan(open ? null : s.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onShare(s.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-white/5"
                              title="Copy share link"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteScan(s.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/60 hover:bg-danger/10 hover:text-danger"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {open && (
                          <>
                            {fresh?.scanId === s.id && <FreshDetail result={fresh.result} onClear={() => setFresh(null)} />}
                            <ScanDetail scan={s} />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Webhooks */}
        <div className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Send className="h-4 w-4 text-neon" /> Webhooks
          </h3>
          <div className="mt-3 flex gap-2">
            <input
              value={hookUrl}
              onChange={(e) => setHookUrl(e.target.value)}
              placeholder="https://your-app.com/hook"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-neon/40"
            />
            <button onClick={onAddWebhook} className="flex items-center gap-1.5 rounded-xl bg-neon px-3 py-2 text-sm font-bold text-black">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {webhooks.length === 0 ? (
            <p className="mt-4 text-xs text-white/40">No webhooks. We will POST the result JSON when a scan completes.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {webhooks.map((w) => (
                <div key={w.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className={`h-2 w-2 rounded-full ${w.active ? 'bg-neon' : 'bg-white/20'}`} />
                  <span className="min-w-0 flex-1 truncate text-xs text-white/70">{w.url}</span>
                  <button onClick={() => onTestWebhook(w.id)} className="text-white/50 hover:text-neon" title="Send test">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => { await deleteWebhook(w.id); load(); }}
                    className="text-white/50 hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API keys */}
        <div className="glass rounded-2xl p-5">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <KeyRound className="h-4 w-4 text-neon" /> API keys
          </h3>
          <div className="mt-3 flex gap-2">
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Key name (e.g. production)"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-neon/40"
            />
            <button onClick={onCreateKey} className="flex items-center gap-1.5 rounded-xl bg-neon px-3 py-2 text-sm font-bold text-black">
              <Plus className="h-4 w-4" /> Create
            </button>
          </div>
          {revealedKey && (
            <div className="mt-3 rounded-xl border border-neon/30 bg-neon/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-neon">Your new key (shown once)</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-white/80">{revealedKey}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(revealedKey); push('success', 'Copied'); }}
                  className="text-white/50 hover:text-neon"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          {apiKeys.length === 0 ? (
            <p className="mt-4 text-xs text-white/40">
              Use API keys to authenticate <code className="text-neon/70">Authorization: Bearer</code> requests from your own apps.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className="text-xs font-medium text-white/70">{k.name}</span>
                  <code className="min-w-0 flex-1 truncate text-xs text-white/40">{k.key_prefix}…</code>
                  <button
                    onClick={async () => { await revokeApiKey(k.id); push('info', 'Key revoked'); load(); }}
                    className="text-white/50 hover:text-danger"
                    title="Revoke"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-10 rounded-2xl border border-danger/30 bg-danger/[0.06] p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-danger">
          <ShieldAlert className="h-4 w-4" /> Danger zone
        </h3>
        <p className="mt-2 text-xs text-white/50">
          Delete all scan history, share links, webhooks, API keys and reports associated with this account. This cannot
          be undone.
        </p>
        <button
          onClick={onDeleteData}
          className="mt-3 flex items-center gap-2 rounded-xl border border-danger/40 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" /> Delete my data
        </button>
      </div>
    </section>
  );
}

function groupScansByDay(scans: ScanRecord[]): { day: string; items: ScanRecord[] }[] {
  const map = new Map<string, ScanRecord[]>();
  for (const s of scans) {
    const d = new Date(s.created_at * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const arr = map.get(key) || [];
    arr.push(s);
    map.set(key, arr);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => ({ day, items: items.sort((a, b) => b.created_at - a.created_at) }));
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yest)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

function FreshDetail({ result, onClear }: { result: import('../api').AnalysisResult; onClear: () => void }) {
  const isAI = result.classification === 'AI_GENERATED';
  const isUncertain = result.classification === 'UNCERTAIN';
  const color = isAI ? 'text-danger' : isUncertain ? 'text-amber-400' : 'text-neon';
  return (
    <div className="border-t border-white/[0.06] px-4 py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neon">
          <RefreshCw className="h-3 w-3" /> Fresh re-run result
        </p>
        <button onClick={onClear} className="text-[10px] text-white/40 hover:text-white/70">Dismiss</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${color} ${isAI ? 'bg-danger/10' : isUncertain ? 'bg-amber-400/10' : 'bg-neon/10'}`}>
          {isAI ? 'AI-Generated' : isUncertain ? 'Uncertain' : 'Real'}
        </span>
        <span className="text-sm font-bold text-white/85">{result.aiPercent}% AI</span>
        <span className="text-xs text-white/40">confidence {result.confidence.toFixed(1)}%</span>
        <span className="text-[10px] text-white/30">{new Date().toLocaleTimeString()}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.forensics?.noise && (
          <MiniStat label="Noise" value={result.forensics.noise.noise_level.toFixed(2)} />
        )}
        {result.forensics?.colour && (
          <MiniStat label="Saturation" value={`${(result.forensics.colour.saturation * 100).toFixed(1)}%`} />
        )}
        {result.processingTimeMs != null && (
          <MiniStat label="Time" value={`${(result.processingTimeMs / 1000).toFixed(2)}s`} />
        )}
        <MiniStat label="Model" value={(result.modelUsed || 'local').split('·').pop()?.trim() || 'local'} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs font-semibold text-white/80">{value}</p>
    </div>
  );
}

function ScanDetail({ scan }: { scan: ScanRecord }) {
  const [full, setFull] = useState<ScanRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { getScan } = await import('../api');
        const s = await getScan(scan.id);
        setFull(s);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [scan.id]);

  if (loading) return <div className="px-4 pb-4"><ResultSkeleton /></div>;
  if (error) return <div className="px-4 pb-4 text-xs text-danger">{error}</div>;
  if (!full) return null;

  const ai = full.classification === 'AI_GENERATED';
  const color = ai ? 'text-danger' : full.classification === 'UNCERTAIN' ? 'text-amber-400' : 'text-neon';

  return (
    <div className="border-t border-white/5 px-4 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {full.heatmap && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img src={`data:image/png;base64,${full.heatmap}`} alt="Heatmap" className="w-full object-cover" />
          </div>
        )}
        <div className="space-y-2">
          <p className={`text-sm font-bold ${color}`}>
            {full.ai_percent}% AI likelihood · confidence {full.confidence}%
          </p>
          {full.indicators?.slice(0, 5).map((ind) => (
            <div key={ind.label} className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs">
              <span className="text-white/50">{ind.label}</span>
              <span className="font-medium text-white/70">{(ind.aiLikelihood * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
