import { useRef, useState } from 'react';
import { Activity, Loader2, ShieldAlert, ShieldCheck, Video, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { sampleVideoFrames, type AnalysisResult } from '../api';
import { localDetectFrames } from '../lib/localDetect';
import { useToast } from '../lib/toast';
import { useI18n } from '../lib/i18n';

function verdictUi(r: AnalysisResult) {
  if (r.classification === 'AI_GENERATED')
    return { color: 'text-danger', cls: 'bg-danger/10 text-danger', border: 'border-danger/30', Icon: ShieldAlert, bar: 'bg-danger' };
  if (r.classification === 'UNCERTAIN')
    return { color: 'text-amber-400', cls: 'bg-amber-400/10 text-amber-400', border: 'border-amber-400/30', Icon: Activity, bar: 'bg-amber-400' };
  return { color: 'text-neon', cls: 'bg-neon/10 text-neon', border: 'border-neon/30', Icon: ShieldCheck, bar: 'bg-neon' };
}

function verdictLabel(r: AnalysisResult, t: (k: string) => string) {
  if (r.classification === 'AI_GENERATED') return t('verdict.ai');
  if (r.classification === 'UNCERTAIN') return t('verdict.uncertain');
  return t('verdict.real');
}

export default function VideoAnalyzer() {
  const { push } = useToast();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);

  const isVideo = (f: File) => /video\//.test(f.type) || /\.(mp4|webm|mov|mkv|avi|m4v|ogv|mpeg)$/i.test(f.name);

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (!f || !isVideo(f)) return;
    setFile(f);
    setResult(null);
    setFrameCount(0);
  };

  const run = async () => {
    if (!file || running) return;
    setRunning(true);
    setResult(null);
    try {
      const frames = await sampleVideoFrames(file, 8);
      if (frames.length === 0) {
        push('error', t('video.noFrames'), t('video.noFramesMsg'));
        setFrameCount(0);
        return;
      }
      setFrameCount(frames.length);
      const res = await localDetectFrames(frames, file);
      setResult(res);
      push('success', t('video.analyzed'), `${frames.length} ${t('video.frames')}`);
    } catch (e) {
      push('error', t('video.error'), e instanceof Error ? e.message : undefined);
    } finally {
      setRunning(false);
    }
  };

  const clear = () => {
    setFile(null);
    setResult(null);
    setFrameCount(0);
  };

  const ui = result ? verdictUi(result) : null;

  return (
    <section className="glass rounded-3xl p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
          <Video className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">{t('video.title')}</h3>
          <p className="text-xs text-white/45">{t('video.subtitle')}</p>
        </div>
      </div>

      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-300"
        style={{
          background: dragging ? 'rgba(0, 200, 90, 0.08)' : 'rgba(8, 14, 11, 0.45)',
          borderColor: dragging ? 'rgba(0, 200, 90, 0.7)' : 'rgba(0, 255, 102, 0.25)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => pick(e.target.files)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="grid h-14 w-14 place-items-center rounded-full border border-neon/30 bg-neon/10">
          <Video className="h-6 w-6 text-neon" strokeWidth={2.2} />
        </div>
        <p className="mt-4 text-sm font-bold text-white">{t('video.drop')}</p>
        <p className="mt-1 text-xs text-white/40">{t('video.dropHint')}</p>
      </div>

      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon/30 bg-neon/10">
            <Video className="h-4 w-4 text-neon" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            onClick={clear}
            disabled={running}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label={t('video.remove')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {file && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={run}
          disabled={running}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-neon to-neon-600 px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,255,102,0.3)] transition-all hover:shadow-[0_0_32px_rgba(0,255,102,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {running ? t('video.scanning') : t('video.scan')}
        </motion.button>
      )}

      {running && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] py-4 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-neon" />
          {t('video.scanning')}
        </div>
      )}

      {result && ui && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`glass mt-5 rounded-2xl border p-4 ${ui.border}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ui.cls}`}>
              <ui.Icon className="h-4 w-4" />
              {verdictLabel(result, t)}
            </span>
            <span className="text-xs text-white/40">
              {frameCount} {t('video.frames')}
            </span>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-white/40">{t('compare.aiLikelihood')}</span>
              <span className={`text-base font-bold ${ui.color}`}>{result.aiPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.aiPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${ui.bar}`}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40">{t('compare.confidence')}</p>
              <p className="mt-0.5 text-sm font-bold text-white/85">{result.confidence}%</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40">{t('compare.topIndicator')}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-white/85">{result.indicators[0]?.label || '—'}</p>
            </div>
          </div>
        </motion.div>
      )}

      <p className="mt-4 text-center text-[11px] text-white/40">{t('video.note')}</p>
    </section>
  );
}
