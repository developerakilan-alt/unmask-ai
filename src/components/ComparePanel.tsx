import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, Loader2, RotateCcw, Scale, ShieldAlert, ShieldCheck, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeImageWithFallback, type AnalysisResult } from '../api';
import { useToast } from '../lib/toast';
import { useI18n } from '../lib/i18n';

function verdictColors(r: AnalysisResult) {
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

function CompareDrop({
  label,
  file,
  preview,
  onPick,
  onRemove,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onPick: (list: FileList | null) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onPick(e.dataTransfer.files);
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all duration-300"
      style={{
        background: dragging ? 'rgba(0, 200, 90, 0.08)' : 'rgba(8, 14, 11, 0.45)',
        borderColor: dragging ? 'rgba(0, 200, 90, 0.7)' : 'rgba(0, 255, 102, 0.25)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
        onClick={(e) => e.stopPropagation()}
      />
      {preview ? (
        <div className="flex flex-col items-center">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-neon/30 bg-black/40 shadow-[0_0_20px_rgba(0,255,102,0.15)]">
            <img src={preview} alt={file?.name || label} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neon/15" />
          </div>
          <p className="mt-3 max-w-full truncate text-sm font-medium text-white/80">{file?.name}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-neon/30 bg-neon/10">
            <Upload className="h-6 w-6 text-neon" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-sm font-bold text-white">{label}</p>
          <p className="mt-1 text-xs text-white/40">or click to browse</p>
        </div>
      )}
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          aria-label="Remove file"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white/50 transition-colors hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function VerdictCard({
  result,
  preview,
  name,
  t,
}: {
  result: AnalysisResult;
  preview: string | null;
  name: string;
  t: (k: string) => string;
}) {
  const ui = verdictColors(result);
  const top = result.indicators?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass rounded-2xl border p-4 ${ui.border}`}
    >
      <div className="flex items-center gap-3">
        {preview && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <img src={preview} alt={name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/85">{name}</p>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ui.cls}`}>
            <ui.Icon className="h-3.5 w-3.5" />
            {verdictLabel(result, t)}
          </span>
        </div>
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
          <p className="mt-0.5 truncate text-sm font-bold text-white/85">{top ? top.label : '—'}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ComparePanel() {
  const { push } = useToast();
  const { t } = useI18n();
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [resultA, setResultA] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const previewARef = useRef<string | null>(null);
  const previewBRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewARef.current) URL.revokeObjectURL(previewARef.current);
      if (previewBRef.current) URL.revokeObjectURL(previewBRef.current);
    },
    [],
  );

  const isImage = (f: File) => /image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|avif|tiff?|jfif)$/i.test(f.name);

  const pick = (slot: 'a' | 'b', list: FileList | null) => {
    const f = list?.[0];
    if (!f || !isImage(f)) return;
    const url = URL.createObjectURL(f);
    if (slot === 'a') {
      if (previewARef.current) URL.revokeObjectURL(previewARef.current);
      previewARef.current = url;
      setPreviewA(url);
      setFileA(f);
      setResultA(null);
    } else {
      if (previewBRef.current) URL.revokeObjectURL(previewBRef.current);
      previewBRef.current = url;
      setPreviewB(url);
      setFileB(f);
      setResultB(null);
    }
  };

  const clear = () => {
    if (previewARef.current) URL.revokeObjectURL(previewARef.current);
    if (previewBRef.current) URL.revokeObjectURL(previewBRef.current);
    previewARef.current = null;
    previewBRef.current = null;
    setPreviewA(null);
    setPreviewB(null);
    setFileA(null);
    setFileB(null);
    setResultA(null);
    setResultB(null);
  };

  const compare = async () => {
    if (!fileA || !fileB || running) return;
    setRunning(true);
    try {
      const [ra, rb] = await Promise.all([analyzeImageWithFallback(fileA), analyzeImageWithFallback(fileB)]);
      setResultA(ra);
      setResultB(rb);
    } catch (e) {
      push('error', t('compare.failed'), e instanceof Error ? e.message : undefined);
    } finally {
      setRunning(false);
    }
  };

  const canCompare = Boolean(fileA && fileB);

  return (
    <section className="glass rounded-3xl p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">{t('compare.title')}</h3>
          <p className="text-xs text-white/45">{t('compare.subtitle')}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <CompareDrop
          label={t('compare.dropA')}
          file={fileA}
          preview={previewA}
          onPick={(list) => pick('a', list)}
          onRemove={() => {
            if (previewARef.current) URL.revokeObjectURL(previewARef.current);
            previewARef.current = null;
            setPreviewA(null);
            setFileA(null);
            setResultA(null);
          }}
        />
        <CompareDrop
          label={t('compare.dropB')}
          file={fileB}
          preview={previewB}
          onPick={(list) => pick('b', list)}
          onRemove={() => {
            if (previewBRef.current) URL.revokeObjectURL(previewBRef.current);
            previewBRef.current = null;
            setPreviewB(null);
            setFileB(null);
            setResultB(null);
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2.5">
        <motion.button
          whileHover={canCompare && !running ? { scale: 1.02 } : {}}
          whileTap={canCompare && !running ? { scale: 0.98 } : {}}
          onClick={compare}
          disabled={!canCompare || running}
          className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all ${
            canCompare && !running
              ? 'bg-gradient-to-r from-neon to-neon-600 text-black shadow-[0_0_24px_rgba(0,255,102,0.3)]'
              : 'cursor-not-allowed bg-white/[0.06] text-white/30'
          }`}
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
          {running ? t('compare.comparing') : t('compare.cta')}
        </motion.button>
        {(fileA || fileB) && (
          <button
            onClick={clear}
            disabled={running}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 px-4 py-3 text-xs font-semibold text-white/50 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('compare.clear')}
          </button>
        )}
      </div>

      {running && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] py-4 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-neon" />
          {t('compare.comparing')}
        </div>
      )}

      {resultA && resultB && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <VerdictCard result={resultA} preview={previewA} name={fileA?.name || 'A'} t={t} />
          <VerdictCard result={resultB} preview={previewB} name={fileB?.name || 'B'} t={t} />
        </div>
      )}
    </section>
  );
}
