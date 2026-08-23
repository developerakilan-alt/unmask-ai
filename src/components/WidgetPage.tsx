import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Activity, Loader2, Upload, Check } from 'lucide-react';
import { localDetectImage } from '../lib/localDetect';
import type { AnalysisResult } from '../api';

/**
 * Minimal single-purpose analyzer used by the embeddable widget (runs inside
 * an iframe). Detection is fully on-device; the result is posted to the
 * parent page and also rendered inline so the page works standalone.
 */

const inIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

export default function WidgetPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const post = useCallback((r: AnalysisResult) => {
    if (!inIframe) return;
    window.parent.postMessage(
      { type: 'unmask:result', payload: r },
      '*',
    );
    setSent(true);
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      setResult(null);
      try {
        const r = await localDetectImage(file);
        setResult(r);
        post(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Analysis failed');
      } finally {
        setBusy(false);
      }
    },
    [post],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'unmask:pick' && e.data.file) {
        analyze(e.data.file as File);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [analyze]);

  const isAI = result?.classification === 'AI_GENERATED';
  const isUnc = result?.classification === 'UNCERTAIN';
  const color = isAI ? 'text-danger' : isUnc ? 'text-amber-400' : 'text-neon';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#010b06] p-6 font-[Manrope,system-ui,sans-serif]">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">
              UNMASK <span className="text-[#6EE7B7]">AI</span>
            </p>
            <p className="text-[10px] text-white/40">on-device AI image analysis</p>
          </div>
          {sent && (
            <span className="flex items-center gap-1 rounded-full bg-neon/15 px-2 py-1 text-[10px] font-semibold text-neon">
              <Check className="h-3 w-3" /> sent to page
            </span>
          )}
        </div>

        {!result && !busy && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-white/25 py-8 text-white/50 transition hover:border-[#6EE7B7]/60 hover:text-white"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm">Upload an image</span>
              <span className="text-[10px] text-white/35">Runs locally in your browser</span>
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && analyze(e.target.files[0])} />
          </>
        )}

        {busy && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-white/[0.03] py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#6EE7B7]" />
            <p className="text-xs text-white/50">Analyzing…</p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">{error}</p>
        )}

        {result && (
          <div className="mt-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-4">
              {isAI ? (
                <ShieldAlert className="h-8 w-8 shrink-0 text-danger" />
              ) : isUnc ? (
                <Activity className="h-8 w-8 shrink-0 text-amber-400" />
              ) : (
                <ShieldCheck className="h-8 w-8 shrink-0 text-neon" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-bold ${color}`}>
                  {result.classification === 'AI_GENERATED' ? 'AI-generated' : result.classification === 'REAL' ? 'Likely real' : 'Uncertain'}
                </p>
                <p className="text-[10px] text-white/40">
                  {result.aiPercent}% AI · {result.confidence}% confidence
                </p>
              </div>
            </div>
            {result.attribution?.generator && (
              <p className="mt-2 text-[11px] text-white/50">
                Attributed to <span className="font-semibold text-neon">{result.attribution.generator}</span> (heuristic)
              </p>
            )}
            <button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className="mt-3 w-full rounded-xl bg-[#6EE7B7] py-2.5 text-sm font-bold text-black"
            >
              Analyze another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
