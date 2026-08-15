import { useState } from 'react';
import { Copy, Send, TerminalSquare } from 'lucide-react';
import { getLocalQuota } from '../lib/quota';

type Preset = { label: string; method: 'GET' | 'POST' | 'DELETE'; path: string; mode: 'file' | 'url' | 'none' };

const PRESETS: Preset[] = [
  { label: 'analyze (file)', method: 'POST', path: '/api/v1/analyze', mode: 'file' },
  { label: 'analyze-url', method: 'POST', path: '/api/v1/analyze-url', mode: 'url' },
  { label: 'scans', method: 'GET', path: '/api/v1/scans', mode: 'none' },
  { label: 'stats', method: 'GET', path: '/api/v1/stats', mode: 'none' },
  { label: 'health', method: 'GET', path: '/health', mode: 'none' },
  { label: 'quota', method: 'GET', path: '/api/v1/quota', mode: 'none' },
];

export default function PlaygroundPage() {
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/api/v1/analyze');
  const [mode, setMode] = useState<'file' | 'url' | 'none'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);

  const applyPreset = (p: Preset) => {
    setMethod(p.method);
    setPath(p.path);
    setMode(p.mode);
    setResponse(null);
    setError(null);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      let init: RequestInit = { method, headers };
      if (mode === 'file' && file) {
        const fd = new FormData();
        fd.append('file', file);
        init = { method, headers, body: fd };
      } else if (mode === 'url') {
        headers['Content-Type'] = 'application/json';
        init = { method, headers, body: JSON.stringify({ url }) };
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${path}`, init);
        let body: string;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('image')) body = `[binary image, ${(await res.arrayBuffer()).byteLength} bytes]`;
        else body = JSON.stringify(await res.json(), null, 2).slice(0, 12000);
        setResponse({ status: res.status, body });
      } catch {
        await runLocalFallback();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const runLocalFallback = async () => {
    const { getLocalQuota, consumeLocalScan } = await import('../lib/quota');
    if (!consumeLocalScan()) {
      const q = getLocalQuota();
      setError(`Anonymous offline quota exhausted (${q.limit}/day). Add an API key or try again tomorrow.`);
      return;
    }
    let blob: Blob | null = null;
    if (mode === 'file' && file) blob = file;
    else if (mode === 'url' && url.trim()) {
      const { fetchImageViaProxy } = await import('../api');
      blob = await fetchImageViaProxy(url.trim());
    }
    if (!blob) {
      setError('No image provided for the offline analyzer.');
      return;
    }
    const { localDetectImage } = await import('../lib/localDetect');
    const r = await localDetectImage(blob);
    const body = JSON.stringify(
      {
        prediction: r.verdict,
        classification: r.classification,
        ai_score: r.aiPercent / 100,
        real_score: r.realPercent / 100,
        confidence: r.confidence / 100,
        indicators: r.indicators,
        metadata: {
          model_used: r.modelUsed,
          processing_time_ms: r.processingTimeMs,
          local: true,
          offline_fallback: true,
        },
        attribution: r.attribution,
      },
      null,
      2,
    );
    setResponse({ status: 200, body });
    const q = getLocalQuota();
    push(`offline result — ${q.remaining} offline scans left today`);
  };

  const push = (message: string) => {
    /* quiet inline notice (avoid importing the toast store for a playground) */
    setError(null);
    setOfflineNote(message);
  };

  const copy = () => {
    if (response) navigator.clipboard?.writeText(response.body).catch(() => undefined);
  };

  const getQuotaDisplay = () => {
    const q = getLocalQuota();
    return `${q.remaining} / ${q.limit} today`;
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <TerminalSquare className="h-6 w-6 text-neon" /> API Playground
      </h1>
      <p className="mt-2 text-sm text-white/50">Call the public API right from the browser. No account required.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
        <span className="rounded-full border border-white/10 px-2.5 py-1">
          Offline scans: <span className="font-semibold text-neon">{getQuotaDisplay()}</span>
        </span>
        <span className="text-white/30">If the backend is offline, file &amp; URL analysis runs on-device (locally, never uploaded).</span>
      </div>

      {offlineNote && (
        <div className="mt-3 rounded-xl border border-neon/30 bg-neon/10 px-4 py-3 text-xs text-neon">{offlineNote}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.path + p.method}
            onClick={() => applyPreset(p)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              path === p.path && method === p.method
                ? 'border-neon bg-neon/15 text-neon'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-white outline-none focus:border-neon"
          >
            <option>GET</option>
            <option>POST</option>
            <option>DELETE</option>
          </select>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-neon"
            placeholder="/api/v1/analyze"
          />
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm font-bold text-black transition hover:bg-neon/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {loading ? 'Sending…' : 'Send'}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon"
            placeholder="API key (optional — otherwise anonymous quota applies)"
          />
          {mode === 'url' && (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-neon"
              placeholder="https://example.com/image.jpg"
            />
          )}
          {mode === 'file' && (
            <label className="block cursor-pointer rounded-lg border border-dashed border-white/20 px-3 py-3 text-center text-xs text-white/50 hover:border-neon">
              {file ? `Selected: ${file.name}` : 'Click to choose an image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
      )}

      {response && (
        <div className="glass mt-4 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                response.status < 300 ? 'bg-neon/15 text-neon' : 'bg-danger/15 text-danger'
              }`}
            >
              {response.status}
            </span>
            <button onClick={copy} className="flex items-center gap-1 text-xs text-white/40 hover:text-white">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <pre className="code-block max-h-96 overflow-auto p-4 text-xs leading-relaxed text-neon-100">{response.body}</pre>
        </div>
      )}
    </section>
  );
}
