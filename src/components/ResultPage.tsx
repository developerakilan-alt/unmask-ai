import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ShieldCheck, ShieldAlert, Activity, Layers, ScanLine, Sparkles, Gauge, Fingerprint, Eye, Grid3x3, FileText, ChevronDown, ChevronUp, BookOpen, FlaskConical, BadgeCheck, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { createShare } from '../api';
import { useToast } from '../lib/toast';
import { explainResult } from '../lib/explain';
import ResultExtras from './ResultExtras';

interface Indicator {
  label: string;
  value: string;
  aiLikelihood: number;
  detail: string;
}

type Classification = 'AI_GENERATED' | 'REAL' | 'UNCERTAIN';

interface Forensics {
  exif?: { present: boolean; note?: string; tags: Record<string, string> };
  noise?: { noise_level: number; sharpness: number };
  colour?: {
    channels?: Record<string, { mean: number; std: number; entropy: number }>;
    saturation: number;
    value: number;
  };
}

interface DebugInfo {
  prediction: string;
  confidence: number | null;
  model: string;
  processing_success: boolean;
  error: string | null;
  raw_logits?: number[];
  raw_probabilities?: number[];
  label_mapping?: Record<string, string>;
  thresholds?: Record<string, number>;
}

interface AnalysisResult {
  classification: Classification;
  verdict: 'real' | 'ai' | 'uncertain';
  aiPercent: number;
  realPercent: number;
  confidence: number;
  indicators: Indicator[];
  heatmap?: string;
  featureScores?: Record<string, number>;
  modelUsed?: string;
  processingTimeMs?: number;
  debug?: DebugInfo;
  scanId?: string;
  forensics?: Forensics;
  sourceUrl?: string;
  local?: boolean;
}

interface ResultPageProps {
  result: AnalysisResult;
  previewUrl: string | null;
  onNew: () => void;
  onBack: () => void;
}

const INDICATOR_ICONS = [Activity, Layers, ScanLine, Sparkles, Gauge, Fingerprint, Eye, Grid3x3];

export default function ResultPage({ result, previewUrl, onNew, onBack }: ResultPageProps) {
  const isAI = result.classification === 'AI_GENERATED';
  const isUncertain = result.classification === 'UNCERTAIN';
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'eli5' | 'tech'>('eli5');
  const { push } = useToast();
  const explainer = explainResult(result.classification, result.aiPercent, result.confidence);

  const glow = isAI
    ? 'border-danger/40 shadow-[0_0_40px_rgba(255,59,59,0.32)]'
    : isUncertain
      ? 'border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]'
      : 'border-neon/40 shadow-[0_0_40px_rgba(52, 211, 153,0.32)]';

  const scoreBarColor = isAI ? 'bg-danger' : isUncertain ? 'bg-amber-400' : 'bg-neon';
  const scoreBarShadow = isAI
    ? '0 0 12px rgba(255,59,59,0.5)'
    : isUncertain
      ? '0 0 12px rgba(251,191,36,0.5)'
      : '0 0 12px rgba(52, 211, 153,0.5)';

  const reportId = `UA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 210;
    const ph = 297;
    const ml = 15;
    const mr = 15;
    const contentW = pw - ml - mr;

    // Site palette (Aether green)
    const NEON: [number, number, number] = [110, 231, 183];
    const EMERALD: [number, number, number] = [16, 185, 129];
    const BG: [number, number, number] = [1, 11, 6];
    const PANEL: [number, number, number] = [8, 38, 26];
    const PANEL_SOFT: [number, number, number] = [5, 28, 19];
    const ROW_ALT: [number, number, number] = [4, 24, 16];
    const TXT: [number, number, number] = [236, 253, 245];
    const TXT_SUB: [number, number, number] = [168, 205, 188];
    const TXT_MUT: [number, number, number] = [110, 150, 132];

    // === Background ===
    doc.setFillColor(...BG);
    doc.rect(0, 0, pw, ph, 'F');

    // === Verdict-tinted top band ===
    const badgeColor: [number, number, number] = isAI ? [255, 59, 59] : isUncertain ? [251, 191, 36] : NEON;
    doc.setFillColor(...badgeColor);
    doc.rect(0, 0, pw, 2.2, 'F');

    // === Header card ===
    let y = 14;
    doc.setFillColor(...PANEL);
    doc.roundedRect(ml - 3, y - 4, contentW + 6, 18, 3, 3, 'F');
    doc.setDrawColor(...EMERALD);
    doc.setLineWidth(0.3);
    doc.roundedRect(ml - 3, y - 4, contentW + 6, 18, 3, 3, 'S');
    doc.setFontSize(22);
    doc.setTextColor(...NEON);
    doc.text('UNMASK', ml + 2, y + 4);
    doc.setTextColor(...TXT);
    doc.text('AI', ml + 40, y + 4);

    doc.setFontSize(8);
    doc.setTextColor(...TXT_MUT);
    doc.text('AI IMAGE FORENSIC REPORT', pw - mr - 2, y + 4, { align: 'right' });
    doc.setFontSize(7.5);
    doc.setTextColor(...TXT_SUB);
    doc.text(`Report ID: ${reportId}`, ml + 2, y + 10);
    doc.text(`Date: ${new Date().toLocaleString()}`, pw - mr - 2, y + 10, { align: 'right' });

    y += 20;

    // === Uploaded image — full content width, exact aspect ratio ===
    let imgBottomY = y;
    if (previewUrl) {
      try {
        const { dataUrl, ratio } = await new Promise<{ dataUrl: string; ratio: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const srcW = Math.min(img.naturalWidth, 2000);
            const r = img.naturalHeight / img.naturalWidth;
            canvas.width = srcW;
            canvas.height = srcW * r;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), ratio: r });
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = previewUrl;
        });

        // Scale to the full report width without ever distorting the image
        const maxImgH = 102;
        let drawW = contentW;
        let drawH = contentW * ratio;
        if (drawH > maxImgH) {
          drawH = maxImgH;
          drawW = maxImgH / ratio;
        }
        const ix = ml + (contentW - drawW) / 2;

        doc.setFillColor(...PANEL_SOFT);
        doc.roundedRect(ix - 1, y - 1, drawW + 2, drawH + 2, 3, 3, 'F');
        doc.setDrawColor(...EMERALD);
        doc.setLineWidth(0.3);
        doc.roundedRect(ix - 1, y - 1, drawW + 2, drawH + 2, 3, 3, 'S');
        doc.addImage(dataUrl, 'JPEG', ix, y, drawW, drawH);
        imgBottomY = y + drawH + 4;
      } catch {
        // skip
      }
    }

    // === Verdict + scores row (full width, below the image) ===
    y = Math.max(imgBottomY + 2, 120);
    const colGap = 4;
    const colW = (contentW - colGap * 2) / 3;
    const cx2 = ml + colW + colGap;
    const cx3 = ml + (colW + colGap) * 2;

    // Verdict badge
    const badgeDark = !isAI && !isUncertain;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(ml, y, colW, 20, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(badgeDark ? 4 : 10, badgeDark ? 30 : 10, badgeDark ? 18 : 10);
    doc.text(isAI ? 'AI-GENERATED' : isUncertain ? 'UNCERTAIN' : 'REAL IMAGE', ml + colW / 2, y + 12, { align: 'center' });

    // AI likelihood
    doc.setFillColor(...PANEL);
    doc.roundedRect(cx2, y, colW, 20, 2.5, 2.5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...TXT_MUT);
    doc.text('AI LIKELIHOOD', cx2 + 4, y + 6);
    doc.setFontSize(15);
    doc.setTextColor(...badgeColor);
    doc.text(`${result.aiPercent}%`, cx2 + 4, y + 15);

    // Confidence
    doc.setFillColor(...PANEL);
    doc.roundedRect(cx3, y, colW, 20, 2.5, 2.5, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...TXT_MUT);
    doc.text('CONFIDENCE', cx3 + 4, y + 6);
    doc.setFontSize(15);
    doc.setTextColor(...TXT);
    doc.text(`${result.confidence}%`, cx3 + 4, y + 15);

    // Model + processing time
    y += 24;
    doc.setFontSize(6);
    doc.setTextColor(...TXT_SUB);
    let metaLine = `Model: ${result.modelUsed || 'EfficientNet-B0 + Fusion'}`;
    if (result.processingTimeMs) metaLine += `   ·   Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`;
    doc.text(metaLine, ml, y);

    // === Key Indicators Section (below verdict row, full width) ===
    y += 6;
    doc.setDrawColor(...EMERALD);
    doc.setLineWidth(0.3);
    doc.line(ml, y, pw - mr, y);
    y += 5;

    doc.setFontSize(10);
    doc.setTextColor(...NEON);
    doc.text('KEY INDICATORS', ml, y);
    y += 6;

    // Indicators in compact rows
    const indicatorIcons: Record<string, string> = {
      'EXIF Metadata': 'META',
      'Sensor Noise': 'NOISE',
      'High-Frequency Detail': 'HF',
      'Texture Smoothness': 'TEX',
      'Variance Uniformity': 'VAR',
      'Color Entropy': 'ENT',
      'Saturation Profile': 'SAT',
      'Edge Coherence': 'EDGE',
      'Compression Grid': 'JPG',
      'Noise Floor': 'FLOOR',
      'Texture Complexity': 'LBP',
      'Chroma Noise': 'CHR',
      'RGB Correlation': 'RGB',
    };

    result.indicators.forEach((ind, i) => {
      if (y > 270) return;
      const isHigh = ind.aiLikelihood >= 0.5;
      const tagColor: [number, number, number] = isHigh ? [255, 59, 59] : NEON;
      const tagBg: [number, number, number] = isHigh ? [58, 18, 18] : [12, 52, 36];

      // Row background
      if (i % 2 === 0) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(ml, y - 4.5, contentW, 10, 'F');
      }

      // Tag
      doc.setFillColor(...tagBg);
      doc.roundedRect(ml + 1, y - 3.5, 12, 5.5, 1.2, 1.2, 'F');
      doc.setFontSize(5);
      doc.setTextColor(...tagColor);
      doc.text(indicatorIcons[ind.label] || '---', ml + 7, y, { align: 'center' });

      // Name
      doc.setFontSize(8);
      doc.setTextColor(...TXT_SUB);
      doc.text(ind.label, ml + 16, y);

      // Value
      doc.setFontSize(7);
      doc.setTextColor(...TXT_MUT);
      doc.text(ind.value, ml + 80, y);

      // Verdict tag
      doc.setFillColor(...tagBg);
      doc.roundedRect(pw - mr - 18, y - 3.5, 16, 5.5, 1.2, 1.2, 'F');
      doc.setFontSize(5.5);
      doc.setTextColor(...tagColor);
      doc.text(isHigh ? 'AI' : 'REAL', pw - mr - 10, y, { align: 'center' });

      y += 9;
    });

    // === Bottom accent bar + footer ===
    doc.setFillColor(...NEON);
    doc.rect(0, ph - 12, pw, 0.3, 'F');

    doc.setFontSize(6);
    doc.setTextColor(...TXT_MUT);
    doc.text('Unmask AI - AI Image Forensic Engine', ml, ph - 7);
    doc.text('Results are indicative. Not to be used as sole evidence.', pw - mr, ph - 7, { align: 'right' });
    doc.text('unmask-ai.app', pw - mr, ph - 3, { align: 'right' });

    doc.save(`unmask-ai-report-${reportId}.pdf`);
  };

  const shareLink = async () => {
    if (!result.scanId) {
      push('info', 'No scan record yet', 'Log in to save scans and generate share links.');
      return;
    }
    try {
      const s = await createShare(result.scanId);
      const url = `${window.location.origin}${s.share_url}`;
      const shareable = typeof navigator.share === 'function';
      if (shareable) {
        try {
          await navigator.share({
            title: 'Unmask AI — image authenticity check',
            text: `Unmask AI verdict: ${isAI ? 'AI-generated' : isUncertain ? 'uncertain' : 'real'} (${result.aiPercent}% AI)`,
            url,
          });
          return;
        } catch {
          /* user cancelled — fall through to clipboard */
        }
      }
      await navigator.clipboard.writeText(url).catch(() => {});
      push('success', 'Share link copied', url);
    } catch (e) {
      push('error', 'Share failed', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-[600px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`glass rounded-3xl overflow-hidden ${glow}`}
        >
          {/* Image + verdict header */}
          <div className="relative px-5 pt-5 sm:sm:px-7">
            {previewUrl && (
              <div className="flex flex-col items-center">
                <div
                  className={`relative h-48 w-48 overflow-hidden rounded-2xl border-2 bg-black/40 ${
                    isAI ? 'border-danger/50' : isUncertain ? 'border-amber-400/50' : 'border-neon/50'
                  }`}
                  style={{ boxShadow: isAI ? '0 0 36px rgba(255,59,59,0.4)' : isUncertain ? '0 0 36px rgba(251,191,36,0.3)' : '0 0 36px rgba(52, 211, 153,0.4)' }}
                >
                  <img src={previewUrl} alt="analyzed" className="h-full w-full object-cover" />
                  <div className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${isAI ? 'ring-danger/30' : isUncertain ? 'ring-amber-400/30' : 'ring-neon/30'}`} />
                </div>
              </div>
            )}

            {/* Verdict badge */}
            <div className="mt-5 text-center">
              <div className="relative inline-flex items-center justify-center">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-4 animate-spin-slow rounded-full border border-dashed opacity-60"
                  style={{
                    borderColor: isAI
                      ? 'rgba(255,59,59,0.4)'
                      : isUncertain
                        ? 'rgba(251,191,36,0.4)'
                        : 'rgba(52, 211, 153,0.4)',
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-1 -right-2 h-2 w-2 rounded-full"
                  style={{
                    background: isAI ? '#ff3b3b' : isUncertain ? '#fbbf24' : '#6EE7B7',
                    boxShadow: isAI
                      ? '0 0 10px rgba(255,59,59,0.9)'
                      : isUncertain
                        ? '0 0 10px rgba(251,191,36,0.9)'
                        : '0 0 10px rgba(52, 211, 153,0.9)',
                  }}
                />
                <div className={`relative inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 ${
                  isAI ? 'bg-danger/15 border border-danger/30' : isUncertain ? 'bg-amber-400/15 border border-amber-400/30' : 'bg-neon/15 border border-neon/30'
                }`}>
                  {isAI ? (
                    <ShieldAlert className="h-5 w-5 text-danger" />
                  ) : isUncertain ? (
                    <Activity className="h-5 w-5 text-amber-400" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-neon" />
                  )}
                  <span className={`text-lg font-bold ${isAI ? 'text-danger' : isUncertain ? 'text-amber-400' : 'text-neon'}`}>
                    {isAI ? 'AI-Generated' : isUncertain ? 'Uncertain' : 'Real Image'}
                  </span>
                </div>
              </div>
              {result.scanId && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-neon/25 bg-neon/10 px-3 py-1 text-[10px] font-semibold text-neon/90">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Unmask Verified · forensic record #{result.scanId.slice(0, 8)}
                </p>
              )}
            </div>
          </div>

          {isUncertain && (
            <div className="px-5 pt-4 sm:sm:px-7">
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-amber-300">
                  The model could not reliably classify this image.
                </p>
                <p className="mt-1 text-xs text-white/50">
                  AI-image detection is probabilistic. Confidence {result.confidence.toFixed(1)}% was
                  too close to the decision boundary, so no verdict was forced.
                  {result.debug?.model ? ` Model: ${result.debug.model}.` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Score bar */}
          <div className="px-5 pt-4 sm:sm:px-7">
            <div className="glass-soft rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-white/40">Authenticity Score</span>
                <span className={`text-xl font-bold ${isAI ? 'text-danger' : isUncertain ? 'text-amber-400' : 'text-neon'}`}>
                  {result.aiPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.aiPercent}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className={`h-full rounded-full ${scoreBarColor}`}
                  style={{ boxShadow: scoreBarShadow }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
                <span>Real</span>
                <span>AI</span>
              </div>
            </div>
          </div>

          {/* Plain-language explainer with ELI5 / Technical toggle */}
          <div className="px-5 pt-4 sm:sm:px-7">
            <div className="glass-soft rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white/90">{mode === 'eli5' ? explainer.headline : 'Technical assessment'}</p>
                <div className="flex gap-1 rounded-lg bg-white/[0.05] p-0.5">
                  <button
                    onClick={() => setMode('eli5')}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      mode === 'eli5' ? 'bg-neon/15 text-neon' : 'text-white/40 hover:text-white/70'
                    }`}
                    title="Plain English explanation"
                  >
                    <BookOpen className="h-3 w-3" /> Plain
                  </button>
                  <button
                    onClick={() => setMode('tech')}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition ${
                      mode === 'tech' ? 'bg-neon/15 text-neon' : 'text-white/40 hover:text-white/70'
                    }`}
                    title="Technical detail"
                  >
                    <FlaskConical className="h-3 w-3" /> Technical
                  </button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {mode === 'eli5' ? (
                  <motion.div
                    key="eli5"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <p className="text-xs leading-relaxed text-white/50">{explainer.body}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/35">{explainer.confidenceNote}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tech"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-1.5"
                  >
                    <TechRow label="Model" value={result.modelUsed || 'EfficientNet-B0 + Fusion'} />
                    <TechRow label="AI probability" value={`${result.aiPercent.toFixed(1)}%`} />
                    <TechRow label="Real probability" value={`${result.realPercent.toFixed(1)}%`} />
                    <TechRow label="Confidence" value={`${result.confidence.toFixed(1)}%`} />
                    {result.processingTimeMs != null && (
                      <TechRow label="Inference time" value={`${(result.processingTimeMs / 1000).toFixed(2)}s`} />
                    )}
                    {result.debug?.model && <TechRow label="Backend model" value={result.debug.model} />}
                    {result.featureScores && Object.keys(result.featureScores).length > 0 && (
                      <div className="pt-1">
                        {Object.entries(result.featureScores).slice(0, 5).map(([k, v]) => (
                          <TechBar key={k} label={k.replace(/_/g, ' ')} score={(v as number) * 100} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Overview content */}
          <div className="px-5 pt-4 sm:sm:px-7">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="glass-soft rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Prediction</p>
                      <p className={`text-lg font-bold ${isAI ? 'text-danger' : isUncertain ? 'text-amber-400' : 'text-neon'}`}>
                        {isAI ? 'AI' : isUncertain ? 'UNCERTAIN' : 'REAL'}
                      </p>
                    </div>
                    <div className="glass-soft rounded-xl p-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-white/40">Confidence</p>
                      <p className="text-lg font-bold text-white/80">{result.confidence}%</p>
                    </div>
                  </div>

                  {/* Key Indicators */}
                  <div>
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="flex w-full items-center justify-between py-2"
                    >
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Key Indicators</span>
                      {expanded ? (
                        <ChevronUp className="h-3 w-3 text-white/40" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-white/40" />
                      )}
                    </button>

                    <div className={`space-y-2 ${expanded ? '' : 'max-h-[160px] overflow-hidden'}`}>
                      {result.indicators.map((ind, i) => {
                        const Icon = INDICATOR_ICONS[i % INDICATOR_ICONS.length];
                        const high = ind.aiLikelihood >= 0.5;
                        return (
                          <div key={ind.label} className="glass-soft flex items-start gap-3 rounded-xl px-3.5 py-3">
                            <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md ${high ? 'bg-danger/10 text-danger' : 'bg-neon/10 text-neon'}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-white/85">{ind.label}</span>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${high ? 'bg-danger/15 text-danger' : 'bg-neon/15 text-neon'}`}>
                                  {high ? 'AI' : 'Real'}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs leading-relaxed text-white/40">{ind.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!expanded && result.indicators.length > 3 && (
                      <button
                        onClick={() => setExpanded(true)}
                        className="w-full py-2 text-center text-xs text-neon/60 hover:text-neon"
                      >
                        Show all {result.indicators.length} indicators
                      </button>
                    )}
                  </div>
                </motion.div>
          </div>

          {/* Actions */}
          <div className="px-5 pt-4 sm:sm:px-7">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-3 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 rounded-xl border border-neon/20 bg-neon/10 py-3 px-4 text-sm font-semibold text-neon transition-all hover:bg-neon/20 hover:shadow-[0_0_20px_rgba(52, 211, 153,0.15)]"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span> PDF
              </button>
              <button
                onClick={shareLink}
                title="Share result"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 px-3.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Share className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={onNew}
                className="liquid-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(52, 211, 153,0.4)]"
              >
                <FileText className="h-4 w-4" />
                New Scan
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-4">
          <ResultExtras result={result} />
        </div>
      </div>
    </section>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] pb-1 last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-white/35">{label}</span>
      <span className="font-mono text-[11px] text-neon/90">{value}</span>
    </div>
  );
}

function TechBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] text-white/45">
        <span className="capitalize">{label}</span>
        <span className="font-mono text-neon/80">{score.toFixed(1)}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, Math.min(100, score))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-neon/70"
        />
      </div>
    </div>
  );
}
