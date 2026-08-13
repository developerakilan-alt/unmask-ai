import { useEffect, useState } from 'react';
import { FileImage, Grid3x3, Activity, Layers, Eye, Sparkles, Fingerprint, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import type { AnalysisResult } from '../api';
import { analyzeImageWithFallback, analyzeUrl } from '../api';

const SCAN_STEPS = [
  { icon: FileImage, label: 'Uploading image to backend', time: 800 },
  { icon: Grid3x3, label: 'Extracting frequency features (FFT/DCT)', time: 1500 },
  { icon: Activity, label: 'Analyzing noise residuals', time: 1400 },
  { icon: Layers, label: 'Computing ELA & texture descriptors', time: 1300 },
  { icon: Eye, label: 'Running deep-learning backbone', time: 1800 },
  { icon: Sparkles, label: 'Fusing features & generating heatmap', time: 1200 },
  { icon: Fingerprint, label: 'Building forensic report', time: 1000 },
];

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface AnalyzingPageProps {
  previewUrl: string | null;
  file: File | null;
  sourceUrl?: string | null;
  onDone: (r: AnalysisResult) => void;
  onCancel: () => void;
}

export default function AnalyzingPage({ previewUrl, file, sourceUrl, onDone, onCancel }: AnalyzingPageProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!file && !sourceUrl) {
          setError('No image to analyze');
          return;
        }

        const totalSteps = SCAN_STEPS.length;
        // Animate the scan steps visually while the real API call happens in parallel.
        // Track its outcome so a fast failure (e.g. backend down) shows an error
        // immediately instead of after the full animation.
        let apiError: unknown = null;
        const apiPromise = (sourceUrl ? analyzeUrl(sourceUrl) : analyzeImageWithFallback(file!)).catch((e) => {
          apiError = e;
          throw e;
        });
        apiPromise.catch(() => {});

        for (let i = 0; i < totalSteps; i++) {
          if (cancelled) return;
          if (apiError) {
            setError(apiError instanceof Error ? apiError.message : 'Analysis failed. Is the backend running?');
            return;
          }
          setStep(i);
          const stepDuration = SCAN_STEPS[i].time;
          const progressStart = (i / totalSteps) * 100;
          const progressEnd = ((i + 1) / totalSteps) * 100;
          const startTime = Date.now();
          while (Date.now() - startTime < stepDuration) {
            if (cancelled) return;
            if (apiError) break;
            const t = Math.min(1, (Date.now() - startTime) / stepDuration);
            setProgress(progressStart + (progressEnd - progressStart) * t);
            await new Promise((r) => requestAnimationFrame(r));
          }
          setProgress(progressEnd);
        }

        if (cancelled) return;

        // Hard stop so the screen can never stay "pending" forever.
        const res = await Promise.race([
          apiPromise,
          delay(45000).then(() => {
            throw new Error('Analysis timed out. The backend may be busy — please try again.');
          }),
        ]);
        if (cancelled) return;

        setProgress(100);
        await delay(200);
        if (cancelled) return;

        onDone(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?');
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-[550px]">
        <div className="glass rounded-3xl px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center">
            <div className="relative h-56 w-56 overflow-hidden rounded-2xl border-2 border-neon/40 bg-black/40 shadow-[0_0_40px_rgba(0,255,102,0.25)]">
              {previewUrl ? (
                <img src={previewUrl} alt="analyzing" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <Link2 className="h-12 w-12 text-neon/40" strokeWidth={1.5} />
                </div>
              )}
              {/* Animated scan grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-px opacity-20">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-neon/30 transition-opacity duration-200"
                    style={{ opacity: Math.random() > 0.7 ? 1 : 0.2 }}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="scan-line absolute left-0 right-0 h-0.5 bg-neon" style={{ top: '0%' }} />
                <div className="scan-glow absolute left-0 right-0 h-20 bg-gradient-to-b from-neon/0 via-neon/20 to-neon/0" style={{ top: '0%' }} />
              </div>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neon/20" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg font-bold text-white">Analyzing Image...</p>
            <p className="mt-1 text-sm text-white/45">Running forensic detection pipeline</p>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-white/45">
              <span>{SCAN_STEPS[step]?.label || 'Complete'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-neon transition-all duration-200 ease-out"
                style={{ width: `${progress}%`, boxShadow: '0 0 12px rgba(0,255,102,0.5)' }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-5 space-y-1.5">
            {SCAN_STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.label} className={`flex items-center gap-3 rounded-xl px-3 py-1.5 transition-all ${active ? 'glass-soft' : ''}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors ${
                    done ? 'bg-neon/15 text-neon' : active ? 'bg-neon/10 text-neon' : 'bg-white/[0.04] text-white/30'
                  }`}>
                    {done ? <CheckCircle2 className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : <s.icon className="h-3 w-3" />}
                  </span>
                  <span className={`text-xs transition-colors ${done ? 'text-white/50' : active ? 'text-white' : 'text-white/30'}`}>
                    {s.label}
                  </span>
                  {done && (
                    <CheckCircle2 className="ml-auto h-3 w-3 text-neon/60" />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-danger">
                {error.includes('Detection unavailable') ? 'Detection unavailable' : error}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {error.includes('Detection unavailable')
                  ? 'The detection engine could not produce a prediction for this image. No verdict was guessed.'
                  : 'Make sure the backend is running on port 8000'}
              </p>
              <button onClick={onCancel} className="mt-2 text-xs font-semibold text-white/60 hover:text-white">Go Back</button>
            </div>
          )}

          <button
            onClick={onCancel}
            className="mt-5 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}
