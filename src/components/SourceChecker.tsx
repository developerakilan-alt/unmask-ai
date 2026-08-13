import { useEffect, useRef, useState } from 'react';
import { Activity, Globe, Link2, Loader2, ScanLine, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchImageViaProxy, fetchSourceReport, type AnalysisResult, type SourceReport } from '../api';
import { localDetectImage } from '../lib/localDetect';
import { useToast } from '../lib/toast';
import { useI18n } from '../lib/i18n';

function verdictUi(r: AnalysisResult) {
  if (r.classification === 'AI_GENERATED')
    return { color: 'text-danger', cls: 'bg-danger/10 text-danger', border: 'border-danger/30', Icon: ShieldAlert };
  if (r.classification === 'UNCERTAIN')
    return { color: 'text-amber-400', cls: 'bg-amber-400/10 text-amber-400', border: 'border-amber-400/30', Icon: Activity };
  return { color: 'text-neon', cls: 'bg-neon/10 text-neon', border: 'border-neon/30', Icon: ShieldCheck };
}

function verdictLabel(r: AnalysisResult, t: (k: string) => string) {
  if (r.classification === 'AI_GENERATED') return t('verdict.ai');
  if (r.classification === 'UNCERTAIN') return t('verdict.uncertain');
  return t('verdict.real');
}

export default function SourceChecker() {
  const { push } = useToast();
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [report, setReport] = useState<SourceReport | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const analyze = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReport(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setImagePreview(null);
    try {
      const rep = await fetchSourceReport(url);
      if (rep.imageUrl) {
        setAnalyzingImage(true);
        try {
          const blob = await fetchImageViaProxy(rep.imageUrl);
          const preview = URL.createObjectURL(blob);
          previewRef.current = preview;
          setImagePreview(preview);
          const result = await localDetectImage(blob);
          rep.result = result;
        } catch {
          /* image analysis failed — report still shows page metadata */
        } finally {
          setAnalyzingImage(false);
        }
      }
      setReport({ ...rep });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('source.failed'));
      push('error', t('source.failed'), e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  const result = report?.result;
  const ui = result ? verdictUi(result) : null;

  let note: string;
  let noteCls: string;
  let NoteIcon = ShieldCheck;
  if (!result) {
    note = report?.imageUrl ? t('source.riskUnknown') : t('source.noImage');
    noteCls = 'border-white/10 bg-white/[0.03] text-white/60';
  } else if (result.classification === 'AI_GENERATED') {
    note = t('source.riskHigh');
    noteCls = 'border-danger/30 bg-danger/10 text-danger';
    NoteIcon = ShieldAlert;
  } else {
    note = t('source.riskLow');
    noteCls = 'border-neon/30 bg-neon/10 text-neon';
  }

  return (
    <section className="glass rounded-3xl p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
          <Globe className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">{t('source.title')}</h3>
          <p className="text-xs text-white/45">{t('source.subtitle')}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-neon/20 bg-neon/5 p-2">
        <Link2 className="ml-2 h-4 w-4 shrink-0 text-neon" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          placeholder={t('source.placeholder')}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          aria-label={t('source.placeholder')}
        />
        <button
          onClick={analyze}
          disabled={!url.trim() || loading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-neon px-4 py-2 text-xs font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
          {loading ? t('source.analyzing') : t('source.analyze')}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {analyzingImage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-white/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-neon" />
          {t('source.analyzingImage')}
        </div>
      )}

      {report && !analyzingImage && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-5 space-y-3"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {report.siteName && (
                <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-neon">
                  <Globe className="h-3 w-3" />
                  {report.siteName}
                </span>
              )}
              <span className="text-xs text-white/40">{report.url}</span>
            </div>
            {report.title && <p className="mt-2 text-sm font-bold text-white">{report.title}</p>}
            {report.description && <p className="mt-1.5 text-xs leading-relaxed text-white/50">{report.description}</p>}
          </div>

          {report.imageUrl && (
            <div className={`flex items-center gap-3 rounded-2xl border bg-white/[0.03] p-3 ${ui ? ui.border : 'border-white/10'}`}>
              {imagePreview && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <img src={imagePreview} alt={report.title || t('source.mainImage')} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-white/40">{t('source.mainImage')}</p>
                {result && ui && (
                  <>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ui.cls}`}>
                        <ui.Icon className="h-3 w-3" />
                        {verdictLabel(result, t)}
                      </span>
                      <span className={`text-xs font-bold ${ui.color}`}>{result.aiPercent}%</span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">
                      {t('compare.confidence')}: {result.confidence}%
                    </p>
                  </>
                )}
                {!result && <p className="mt-1 text-xs text-white/40">{t('source.noImage')}</p>}
              </div>
            </div>
          )}

          <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${noteCls}`}>
            <NoteIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">{note}</p>
          </div>
        </motion.div>
      )}
    </section>
  );
}
