import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Loader2, RefreshCw, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { generateSampleImage } from '../lib/image';
import { localDetectImage } from '../lib/localDetect';
import type { AnalysisResult } from '../api';

interface SampleResult {
  kind: 'ai' | 'real';
  filename: string;
  result: AnalysisResult;
}

const SAMPLES = { ai: 4, real: 4 };

function expectedCorrect(r: AnalysisResult, kind: 'ai' | 'real'): boolean {
  if (kind === 'ai') return r.classification === 'AI_GENERATED';
  return r.classification === 'REAL';
}

export default function CalibrationPage() {
  const [running, setRunning] = useState(true);
  const [samples, setSamples] = useState<SampleResult[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setSamples([]);
    setNote(null);
    try {
      const list: SampleResult[] = [];
      for (let i = 0; i < SAMPLES.ai; i++) {
        const f = await generateSampleImage('ai');
        list.push({ kind: 'ai', filename: f.name, result: await localDetectImage(f) });
      }
      for (let i = 0; i < SAMPLES.real; i++) {
        const f = await generateSampleImage('real');
        list.push({ kind: 'real', filename: f.name, result: await localDetectImage(f) });
      }
      setSamples(list);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Failed to run samples');
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const done = samples.length === SAMPLES.ai + SAMPLES.real;
  const correct = samples.filter((s) => expectedCorrect(s.result, s.kind)).length;
  const accuracy = done ? (correct / samples.length) * 100 : null;
  const aiDetected = samples.filter((s) => s.kind === 'ai' && s.result.classification === 'AI_GENERATED').length;
  const realHeld = samples.filter((s) => s.kind === 'real' && s.result.classification === 'REAL').length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <FlaskConical className="h-6 w-6 text-neon" /> Detector calibration
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Runs the on-device detector against known samples (AI renders vs. sensor-capture lookalikes) and scores accuracy.
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Re-run
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{accuracy == null ? '—' : `${accuracy.toFixed(0)}%`}</p>
          <p className="mt-1 text-xs text-white/45">Overall accuracy</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-danger">{aiDetected}/{SAMPLES.ai}</p>
          <p className="mt-1 text-xs text-white/45">AI samples detected</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-neon">{realHeld}/{SAMPLES.real}</p>
          <p className="mt-1 text-xs text-white/45">Real samples classified real</p>
        </div>
      </div>

      {note && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">{note}</div>}

      <div className="glass mt-6 overflow-hidden rounded-2xl">
        <div className="border-b border-white/[0.06] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Sample-by-sample
        </div>
        <div className="grid gap-1.5 p-5 sm:grid-cols-2">
          {samples.map((s, i) => {
            const ok = expectedCorrect(s.result, s.kind);
            const r = s.result;
            const icon = r.classification === 'AI_GENERATED' ? <ShieldAlert className="h-4 w-4" /> : r.classification === 'REAL' ? <ShieldCheck className="h-4 w-4" /> : <Activity className="h-4 w-4" />;
            const cls =
              r.classification === 'AI_GENERATED'
                ? 'bg-danger/10 text-danger'
                : r.classification === 'REAL'
                  ? 'bg-neon/10 text-neon'
                  : 'bg-amber-400/10 text-amber-400';
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cls}`}>{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/80">{s.filename}</p>
                  <p className="text-[10px] text-white/40">
                    expected <span className="font-semibold text-white/60">{s.kind === 'ai' ? 'AI' : 'Real'}</span> · predicted {r.classification === 'AI_GENERATED' ? 'AI' : r.classification === 'REAL' ? 'Real' : 'Uncertain'} · {r.aiPercent}%
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-bold ${ok ? 'text-neon' : 'text-danger'}`}>{ok ? '✓' : '✗'}</span>
              </div>
            );
          })}
          {running && (
            <div className="col-span-full flex items-center justify-center gap-2 py-8 text-sm text-white/50">
              <Loader2 className="h-5 w-5 animate-spin text-neon" /> Generating and analyzing samples…
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-white/35">
        Synthetic samples are canvas-generated approximations, not real camera photographs — treat the score as a sanity
        check of the on-device pipeline, not a benchmark of production accuracy.
      </p>
    </section>
  );
}
