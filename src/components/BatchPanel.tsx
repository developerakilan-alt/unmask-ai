import { useRef, useState } from 'react';
import { Folder, Layers, Link2, Loader2, Upload, X, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { analyzeImageWithFallback, type AnalysisResult } from '../api';
import { useToast } from '../lib/toast';

type BatchItem = { filename: string } & (
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string }
);

export default function BatchPanel() {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => /image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (imgs.length === 0) return;
    setFiles((prev) => [...prev, ...imgs].slice(0, 10));
    setItems([]);
  };

  const importCsv = async (file: File) => {
    try {
      const text = await file.text();
      const list = text
        .split(/\r?\n/)
        .map((l) => l.trim().split(',')[0]?.trim())
        .filter((l) => l && /^https?:\/\//i.test(l));
      if (list.length === 0) {
        push('error', 'No valid URLs found in that file');
        return;
      }
      setUrls((prev) => [...prev, ...list].slice(0, 10));
      setItems([]);
      push('success', 'Imported', `${list.length} URL(s) added`);
    } catch {
      push('error', 'Could not read file');
    }
  };

  const run = async () => {
    if (files.length === 0 && urls.length === 0) return;
    setRunning(true);
    setItems([]);
    try {
      const targets: { filename: string; run: () => Promise<AnalysisResult> }[] = [
        ...files.map((f) => ({ filename: f.name, run: () => analyzeImageWithFallback(f) })),
        ...urls.map((u) => ({
          filename: u,
          run: async () => {
            const { fetchImageViaProxy } = await import('../api');
            const { localDetectImage } = await import('../lib/localDetect');
            return localDetectImage(await fetchImageViaProxy(u));
          },
        })),
      ];
      const results = await Promise.all(
        targets.map(async ({ filename, run: fn }) => {
          try {
            return { filename, ok: true as const, result: await fn() };
          } catch (e) {
            return { filename, ok: false as const, error: e instanceof Error ? e.message : 'Failed' };
          }
        }),
      );
      setItems(results);
      push('success', 'Batch complete', `${results.length} image(s) analyzed`);
    } catch (e) {
      push('error', 'Batch failed', e instanceof Error ? e.message : undefined);
      setItems([]);
    } finally {
      setRunning(false);
    }
  };

  const clear = () => {
    setFiles([]);
    setUrls([]);
    setItems([]);
  };

  const verdictUi = (item: BatchItem) => {
    if (!item.ok) return { color: 'text-white/50', badge: 'Error', cls: 'bg-white/10 text-white/60', pct: 0 };
    const r = item.result;
    if (r.classification === 'AI_GENERATED')
      return { color: 'text-danger', badge: 'AI', cls: 'bg-danger/10 text-danger', pct: r.aiPercent };
    if (r.classification === 'UNCERTAIN')
      return { color: 'text-amber-400', badge: 'Uncertain', cls: 'bg-amber-400/10 text-amber-400', pct: r.aiPercent };
    return { color: 'text-neon', badge: 'Real', cls: 'bg-neon/10 text-neon', pct: r.aiPercent };
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
          <Layers className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">Batch scanner</h3>
          <p className="text-xs text-white/45">Analyze up to 10 images in one request</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          <Upload className="h-4 w-4" /> Add images
        </button>
        <button
          onClick={() => folderRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          title="Pick a folder"
        >
          <Folder className="h-4 w-4" /> Folder
        </button>
        <button
          onClick={() => csvRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          title="Import a CSV of image URLs"
        >
          <Link2 className="h-4 w-4" /> CSV
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      <input ref={folderRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} />
      <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])} />

      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {files.map((f) => (
            <span key={f.name + f.size} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/60">
              {f.name}
              <button
                onClick={() => {
                  setFiles((prev) => prev.filter((x) => x !== f));
                  setItems([]);
                }}
                className="text-white/40 hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {urls.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {urls.map((u) => (
            <span key={u} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/60">
              <Link2 className="h-3 w-3 text-neon" />
              {u}
              <button
                onClick={() => {
                  setUrls((prev) => prev.filter((x) => x !== u));
                  setItems([]);
                }}
                className="text-white/40 hover:text-danger"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {(files.length > 0 || urls.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex-1" />
          <button onClick={clear} className="text-xs text-white/40 hover:text-white">Clear</button>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-2 rounded-xl bg-neon px-4 py-2 text-sm font-bold text-black hover:bg-neon/90 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Analyze {files.length + urls.length} {files.length + urls.length === 1 ? 'item' : 'items'}
          </button>
        </div>
      )}

      {running && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {files.map((f) => (
            <div key={f.name + f.size} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-neon" />
              <p className="min-w-0 flex-1 truncate text-sm text-white/60">{f.name}</p>
              <span className="text-xs text-white/30">analyzing…</span>
            </div>
          ))}
          {urls.map((u) => (
            <div key={u} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-neon" />
              <p className="min-w-0 flex-1 truncate text-sm text-white/60">{u}</p>
              <span className="text-xs text-white/30">fetching…</span>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item, i) => {
            const ui = verdictUi(item);
            return (
              <div key={item.filename + i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ui.cls}`}>
                  {!item.ok ? <X className="h-4 w-4" /> : item.result.classification === 'AI_GENERATED' ? <ShieldAlert className="h-4 w-4" /> : item.result.classification === 'UNCERTAIN' ? <Activity className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">{item.filename}</p>
                  {item.ok && item.result.forensics?.noise && (
                    <p className="text-[10px] text-white/35">
                      noise {item.result.forensics.noise.noise_level.toFixed(2)} · sharpness {item.result.forensics.noise.sharpness.toFixed(1)}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 text-sm font-bold ${ui.color}`}>
                  {item.ok ? `${ui.pct.toFixed(1)}%` : 'failed'}
                </span>                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ui.cls}`}>{ui.badge}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
