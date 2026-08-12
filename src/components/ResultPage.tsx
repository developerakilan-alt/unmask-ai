import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ShieldCheck, ShieldAlert, Activity, Layers, ScanLine, Sparkles, Gauge, Fingerprint, Eye, Grid3x3, FileText, ChevronDown, ChevronUp, ImageIcon, Flag, Link2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { createShare } from '../api';
import { useToast } from '../lib/toast';
import { explainResult } from '../lib/explain';
import ShareCardGenerator from './ShareCardGenerator';

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
}

interface ResultPageProps {
  result: AnalysisResult;
  previewUrl: string | null;
  onNew: () => void;
  onBack: () => void;
  onReport: () => void;
}

const INDICATOR_ICONS = [Activity, Layers, ScanLine, Sparkles, Gauge, Fingerprint, Eye, Grid3x3];

type Tab = 'overview' | 'heatmap' | 'metadata' | 'forensics';

export default function ResultPage({ result, previewUrl, onNew, onBack, onReport }: ResultPageProps) {
  const isAI = result.classification === 'AI_GENERATED';
  const isUncertain = result.classification === 'UNCERTAIN';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expanded, setExpanded] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const { push } = useToast();
  const explainer = explainResult(result.classification, result.aiPercent, result.confidence);

  const glow = isAI
    ? 'border-danger/40 shadow-[0_0_40px_rgba(255,59,59,0.32)]'
    : isUncertain
      ? 'border-amber-400/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]'
      : 'border-neon/40 shadow-[0_0_40px_rgba(0,255,102,0.32)]';

  const scoreBarColor = isAI ? 'bg-danger' : isUncertain ? 'bg-amber-400' : 'bg-neon';
  const scoreBarShadow = isAI
    ? '0 0 12px rgba(255,59,59,0.5)'
    : isUncertain
      ? '0 0 12px rgba(251,191,36,0.5)'
      : '0 0 12px rgba(0,255,102,0.5)';

  const reportId = `UA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const downloadPDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 210;
    const ph = 297;
    const ml = 15;
    const mr = 15;
    const contentW = pw - ml - mr;

    // === Dark background ===
    doc.setFillColor(10, 15, 12);
    doc.rect(0, 0, pw, ph, 'F');

    // === Top accent bar ===
    doc.setFillColor(0, 255, 136);
    doc.rect(0, 0, pw, 3, 'F');

    // === Header ===
    let y = 16;
    doc.setFontSize(24);
    doc.setTextColor(0, 255, 136);
    doc.text('UNMASK AI', ml, y);

    doc.setFontSize(9);
    doc.setTextColor(100, 110, 105);
    doc.text('IMAGE FORENSIC REPORT', pw - mr, y, { align: 'right' });

    y += 5;
    doc.setDrawColor(0, 255, 136);
    doc.setLineWidth(0.4);
    doc.line(ml, y, pw - mr, y);

    // === Report ID + Date ===
    y += 6;
    doc.setFontSize(7.5);
    doc.setTextColor(90, 100, 95);
    doc.text(`Report ID: ${reportId}`, ml, y);
    doc.text(`Date: ${new Date().toLocaleString()}`, pw - mr, y, { align: 'right' });

    y += 10;

    // === Left column: Image ===
    let imgBottomY = y;
    let mainImgH = 80;
    if (previewUrl) {
      try {
        const { dataUrl, imgH } = await new Promise<{ dataUrl: string; imgH: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const srcW = Math.min(img.naturalWidth, 1400);
            const ratio = img.naturalHeight / img.naturalWidth;
            canvas.width = srcW;
            canvas.height = srcW * ratio;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), imgH: 80 * ratio });
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = previewUrl;
        });

        // Image frame with border
        const imgW = 80;
        mainImgH = Math.min(imgH, 95);
        doc.setFillColor(20, 28, 22);
        doc.roundedRect(ml - 1, y - 1, imgW + 2, mainImgH + 2, 2, 2, 'F');
        doc.setDrawColor(0, 255, 136);
        doc.setLineWidth(0.3);
        doc.roundedRect(ml - 1, y - 1, imgW + 2, mainImgH + 2, 2, 2, 'S');
        doc.addImage(dataUrl, 'JPEG', ml, y, imgW, mainImgH);
        imgBottomY = y + mainImgH + 4;
      } catch {
        // skip
      }
    }

    // === Right column: Verdict + Scores ===
    const rightX = ml + 92;

    // Verdict badge
    y = 62;
    const badgeColor: [number, number, number] = isAI ? [255, 59, 59] : isUncertain ? [251, 191, 36] : [0, 255, 136];
    doc.setFillColor(...badgeColor);
    doc.roundedRect(rightX, y, 70, 11, 3, 3, 'F');
    doc.setFontSize(13);
    const badgeDark = !isAI && !isUncertain;
    doc.setTextColor(badgeDark ? 10 : 10, badgeDark ? 10 : 10, badgeDark ? 10 : 10);
    doc.text(isAI ? 'AI-GENERATED' : isUncertain ? 'UNCERTAIN' : 'REAL IMAGE', rightX + 35, y + 7.5, { align: 'center' });

    // Scores section
    y += 18;
    // AI Likelihood
    doc.setFillColor(20, 28, 22);
    doc.roundedRect(rightX, y, 70, 20, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 125);
    doc.text('AI LIKELIHOOD', rightX + 4, y + 7);
    doc.setFontSize(18);
    doc.setTextColor(...badgeColor);
    doc.text(`${result.aiPercent}%`, rightX + 4, y + 16);

    // Score bar
    doc.setFillColor(30, 40, 32);
    doc.roundedRect(rightX + 40, y + 6, 26, 8, 1, 1, 'F');
    doc.setFillColor(...badgeColor);
    doc.roundedRect(rightX + 40, y + 6, 26 * (result.aiPercent / 100), 8, 1, 1, 'F');

    // Confidence
    y += 25;
    doc.setFillColor(20, 28, 22);
    doc.roundedRect(rightX, y, 70, 14, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 125);
    doc.text('CONFIDENCE', rightX + 4, y + 6);
    doc.setFontSize(14);
    doc.setTextColor(220, 230, 225);
    doc.text(`${result.confidence}%`, rightX + 4, y + 12);

    // Model + processing time
    y += 18;
    doc.setFillColor(20, 28, 22);
    doc.roundedRect(rightX, y, 70, 10, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(90, 100, 95);
    doc.text(`Model: ${result.modelUsed || 'EfficientNet-B0 + Fusion'}`, rightX + 4, y + 4);
    if (result.processingTimeMs) {
      doc.text(`Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`, rightX + 4, y + 8);
    }

    // === Heatmap (if available, next to image) ===
    if (result.heatmap) {
      try {
        const hmW = 80;
        const hmH = mainImgH || 60;
        const hmX = ml;
        const hmY = Math.max(imgBottomY + 2, 165) - hmH - 2;
        if (hmY > y + 20) {
          doc.setFillColor(20, 28, 22);
          doc.roundedRect(hmX - 1, hmY - 1, hmW + 2, hmH + 2, 2, 2, 'F');
          doc.setDrawColor(255, 59, 59);
          doc.setLineWidth(0.3);
          doc.roundedRect(hmX - 1, hmY - 1, hmW + 2, hmH + 2, 2, 2, 'S');
          doc.addImage(`data:image/png;base64,${result.heatmap}`, 'PNG', hmX, hmY, hmW, hmH);
          doc.setFontSize(6);
          doc.setTextColor(255, 59, 59);
          doc.text('Grad-CAM Heatmap', hmX + 2, hmY - 2);
        }
      } catch {
        // skip heatmap if invalid
      }
    }

    // === Key Indicators Section (below image, full width) ===
    y = Math.max(imgBottomY + 2, 165);
    doc.setDrawColor(0, 255, 136);
    doc.setLineWidth(0.3);
    doc.line(ml, y, pw - mr, y);
    y += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 255, 136);
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
      const tagColor: [number, number, number] = isHigh ? [255, 59, 59] : [0, 255, 136];
      const tagBg: [number, number, number] = isHigh ? [60, 20, 20] : [15, 40, 25];

      // Row background
      if (i % 2 === 0) {
        doc.setFillColor(15, 22, 17);
        doc.rect(ml, y - 4.5, contentW, 10, 'F');
      }

      // Tag
      doc.setFillColor(...tagBg);
      doc.roundedRect(ml + 1, y - 3.5, 12, 5.5, 1, 1, 'F');
      doc.setFontSize(5);
      doc.setTextColor(...tagColor);
      doc.text(indicatorIcons[ind.label] || '---', ml + 7, y, { align: 'center' });

      // Name
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 205);
      doc.text(ind.label, ml + 16, y);

      // Value
      doc.setFontSize(7);
      doc.setTextColor(120, 130, 125);
      doc.text(ind.value, ml + 80, y);

      // Verdict tag
      doc.setFillColor(...tagBg);
      doc.roundedRect(pw - mr - 18, y - 3.5, 16, 5.5, 1, 1, 'F');
      doc.setFontSize(5.5);
      doc.setTextColor(...tagColor);
      doc.text(isHigh ? 'AI' : 'REAL', pw - mr - 10, y, { align: 'center' });

      y += 9;
    });

    // === Bottom accent bar + footer ===
    doc.setFillColor(0, 255, 136);
    doc.rect(0, ph - 12, pw, 0.3, 'F');

    doc.setFontSize(6);
    doc.setTextColor(60, 70, 65);
    doc.text('Unmask AI - AI Image Forensic Engine', ml, ph - 7);
    doc.text('Results are indicative. Not to be used as sole evidence.', pw - mr, ph - 7, { align: 'right' });
    doc.text('unmask-ai.app', pw - mr, ph - 3, { align: 'right' });

    doc.save(`unmask-ai-report-${reportId}.pdf`);
  };

  const downloadCSV = () => {
    const rows: string[][] = [
      ['field', 'value'],
      ['report_id', reportId],
      ['classification', result.classification],
      ['verdict', result.verdict],
      ['ai_percent', String(result.aiPercent)],
      ['real_percent', String(result.realPercent)],
      ['confidence_percent', String(result.confidence)],
      ['model', result.modelUsed || ''],
      ['processing_time_ms', String(result.processingTimeMs ?? '')],
      ['scan_id', result.scanId || ''],
      ['source', result.sourceUrl || ''],
    ];
    (result.indicators || []).forEach((ind) =>
      rows.push([`indicator:${ind.label}`, `${ind.value} (ai_likelihood ${ind.aiLikelihood})`]),
    );
    if (result.forensics?.noise) {
      rows.push(['noise_level', String(result.forensics.noise.noise_level)]);
      rows.push(['sharpness', String(result.forensics.noise.sharpness)]);
    }
    if (result.forensics?.colour) {
      rows.push(['saturation', String(result.forensics.colour.saturation)]);
      rows.push(['value', String(result.forensics.colour.value)]);
    }
    if (result.forensics?.exif) {
      Object.entries(result.forensics.exif.tags || {}).forEach(([k, v]) => rows.push([`exif:${k}`, v]));
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unmask-ai-report-${reportId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const badge = isAI ? '#ff3b3b' : isUncertain ? '#fbbf24' : '#00ff88';
    const dim = 'rgba(255,255,255,0.55)';

    ctx.fillStyle = '#0a0f0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = badge;
    ctx.fillRect(0, 0, canvas.width, 8);

    // Title
    ctx.fillStyle = badge;
    ctx.font = '700 46px "Space Grotesk", sans-serif';
    ctx.fillText('UNMASK AI', 48, 88);
    ctx.fillStyle = dim;
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText(reportId, 48, 118);
    const dateStr = new Date().toLocaleString();
    ctx.fillText(dateStr, canvas.width - 48 - ctx.measureText(dateStr).width, 118);

    // Verdict badge
    ctx.fillStyle = badge;
    ctx.font = '700 52px "Space Grotesk", sans-serif';
    const verdictText = isAI ? 'AI-GENERATED' : isUncertain ? 'UNCERTAIN' : 'REAL IMAGE';
    ctx.fillText(verdictText, 48, 210);

    // Score
    ctx.fillStyle = dim;
    ctx.font = '15px "Space Grotesk", sans-serif';
    ctx.fillText('AI LIKELIHOOD', 48, 258);
    ctx.fillStyle = badge;
    ctx.font = '700 44px "Space Grotesk", sans-serif';
    ctx.fillText(`${result.aiPercent}%`, 48, 306);

    // Confidence bar
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(48, 326, 640, 14);
    ctx.fillStyle = badge;
    ctx.fillRect(48, 326, 640 * (result.aiPercent / 100), 14);

    ctx.fillStyle = dim;
    ctx.font = '14px "Space Grotesk", sans-serif';
    ctx.fillText(`Confidence: ${result.confidence}%`, 48, 366);
    ctx.fillText(`Model: ${result.modelUsed || 'Unmask AI'}`, 48, 392);

    // Image (right side)
    if (previewUrl) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error('img'));
          i.src = previewUrl;
        });
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(700, 150, 452, 340, 16);
        ctx.clip();
        ctx.drawImage(img, 700, 150, 452, 340);
        ctx.restore();
        ctx.strokeStyle = badge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(700, 150, 452, 340, 16);
        ctx.stroke();
      } catch {
        /* skip */
      }
    }

    // Indicators
    ctx.fillStyle = badge;
    ctx.font = '700 22px "Space Grotesk", sans-serif';
    ctx.fillText('KEY INDICATORS', 48, 440);
    let y = 474;
    (result.indicators || []).slice(0, 8).forEach((ind, i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(48, y - 20, 1104, 34);
      }
      const high = ind.aiLikelihood >= 0.5;
      ctx.fillStyle = high ? badge : '#00ff88';
      ctx.font = '600 18px "Space Grotesk", sans-serif';
      ctx.fillText(ind.label, 64, y);
      ctx.fillStyle = dim;
      ctx.font = '15px "Space Grotesk", sans-serif';
      ctx.fillText(ind.value, 620, y);
      ctx.fillStyle = high ? badge : '#00ff88';
      ctx.font = '700 14px "Space Grotesk", sans-serif';
      ctx.fillText(high ? 'AI' : 'REAL', 1060, y);
      y += 44;
    });

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '13px "Space Grotesk", sans-serif';
    ctx.fillText('Results are indicative — not to be used as sole evidence.', 48, canvas.height - 32);
    ctx.textAlign = 'right';
    ctx.fillText('unmask-ai.app', canvas.width - 48, canvas.height - 32);
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unmask-ai-report-${reportId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const shareLink = async () => {
    if (!result.scanId) {
      push('info', 'No scan record yet', 'Log in to save scans and generate share links.');
      return;
    }
    try {
      const s = await createShare(result.scanId);
      const url = `${window.location.origin}${s.share_url}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      push('success', 'Share link copied', url);
    } catch (e) {
      push('error', 'Share failed', e instanceof Error ? e.message : undefined);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'heatmap', label: 'Forensic Map' },
    { key: 'forensics', label: 'Forensics' },
    { key: 'metadata', label: 'Details' },
  ];

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
          <div className="relative px-5 pt-5 sm:px-7">
            {previewUrl && (
              <div className="flex flex-col items-center">
                <div
                  className={`relative h-48 w-48 overflow-hidden rounded-2xl border-2 bg-black/40 ${
                    isAI ? 'border-danger/50' : isUncertain ? 'border-amber-400/50' : 'border-neon/50'
                  }`}
                  style={{ boxShadow: isAI ? '0 0 36px rgba(255,59,59,0.4)' : isUncertain ? '0 0 36px rgba(251,191,36,0.3)' : '0 0 36px rgba(0,255,102,0.4)' }}
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
                        : 'rgba(0,255,136,0.4)',
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-1 -right-2 h-2 w-2 rounded-full"
                  style={{
                    background: isAI ? '#ff3b3b' : isUncertain ? '#fbbf24' : '#00ff88',
                    boxShadow: isAI
                      ? '0 0 10px rgba(255,59,59,0.9)'
                      : isUncertain
                        ? '0 0 10px rgba(251,191,36,0.9)'
                        : '0 0 10px rgba(0,255,136,0.9)',
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
            </div>
          </div>

          {isUncertain && (
            <div className="px-5 pt-4 sm:px-7">
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
          <div className="px-5 pt-5 sm:px-7">
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

          {/* Plain-language explainer */}
          <div className="px-5 pt-4 sm:px-7">
            <div className="glass-soft rounded-2xl p-4">
              <p className="text-sm font-semibold text-white/90">{explainer.headline}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">{explainer.body}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/35">{explainer.confidenceNote}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 sm:px-7">
            <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-neon/15 text-neon border border-neon/20'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-5 py-4 sm:px-7">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
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
              )}

              {activeTab === 'heatmap' && (
                <motion.div
                  key="heatmap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {previewUrl ? (
                    <div className="space-y-3">
                      <div className="relative overflow-hidden rounded-2xl border border-white/10">
                        <div className="grid grid-cols-2">
                          <div className="relative">
                            <img src={previewUrl} alt="Original" className="w-full aspect-square object-cover" />
                            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">Original</span>
                          </div>
                          <div className="relative">
                            {result.heatmap ? (
                              <img src={`data:image/png;base64,${result.heatmap}`} alt="Grad-CAM Heatmap" className="w-full aspect-square object-cover" />
                            ) : (
                              <>
                                <img src={previewUrl} alt="Heatmap" className="w-full aspect-square object-cover" style={{ filter: 'hue-rotate(120deg) saturate(2) contrast(1.2)' }} />
                                <div className="absolute inset-0 bg-gradient-to-br from-neon/20 via-transparent to-danger/30 mix-blend-overlay" />
                              </>
                            )}
                            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">Forensic Map</span>
                          </div>
                        </div>
                      </div>

                      {result.featureScores && Object.keys(result.featureScores).length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Feature Scores</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(result.featureScores).map(([key, score]) => (
                              <div key={key} className="glass-soft rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-white/50 capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className={`text-[10px] font-semibold ${(score as number) > 0.5 ? 'text-danger' : 'text-neon'}`}>
                                    {((score as number) * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                  <div
                                    className={`h-full rounded-full ${(score as number) > 0.5 ? 'bg-danger' : 'bg-neon'}`}
                                    style={{ width: `${(score as number) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!result.featureScores && (
                        <div className="grid grid-cols-3 gap-2">
                          {['Noise Map', 'Compression', 'Edge Analysis'].map((type) => (
                            <div key={type} className="glass-soft rounded-xl p-3 text-center">
                              <p className="text-[10px] text-white/40">{type}</p>
                              <div className="mt-2 h-12 rounded-lg bg-gradient-to-br from-neon/10 to-danger/10 border border-white/[0.06]" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-white/40 py-8">No image to display</p>
                  )}
                </motion.div>
              )}

              {activeTab === 'forensics' && (
                <motion.div
                  key="forensics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {result.forensics?.exif ? (
                    <div className="glass-soft rounded-2xl p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                        <Fingerprint className="h-3.5 w-3.5 text-neon" /> EXIF Metadata
                      </p>
                      {result.forensics.exif.present ? (
                        Object.entries(result.forensics.exif.tags || {}).length > 0 ? (
                          <div className="mt-2 space-y-1.5">
                            {Object.entries(result.forensics.exif.tags).slice(0, 10).map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-1.5">
                                <span className="text-[11px] text-white/45">{k}</span>
                                <span className="truncate text-[11px] font-medium text-white/75">{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-white/50">{result.forensics.exif.note || 'EXIF present but no readable tags.'}</p>
                        )
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-white/50">
                          {result.forensics.exif.note || 'No EXIF metadata found. AI-generated images frequently strip or omit camera metadata.'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="glass-soft rounded-2xl p-4 text-xs text-white/50">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/50">EXIF Metadata</p>
                      <p className="mt-2">EXIF not available for this scan.</p>
                    </div>
                  )}

                  {result.forensics?.noise && (
                    <div className="glass-soft rounded-2xl p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                        <ScanLine className="h-3.5 w-3.5 text-neon" /> Noise &amp; Sharpness
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                          <p className="text-lg font-bold text-white/85">{result.forensics.noise.noise_level.toFixed(2)}</p>
                          <p className="text-[10px] text-white/40">Noise level</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                          <p className="text-lg font-bold text-white/85">{result.forensics.noise.sharpness.toFixed(1)}</p>
                          <p className="text-[10px] text-white/40">Sharpness</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.forensics?.colour && (
                    <div className="glass-soft rounded-2xl p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50">
                        <Layers className="h-3.5 w-3.5 text-neon" /> Colour Statistics
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {Object.entries(result.forensics.colour.channels || {}).slice(0, 3).map(([ch, s]) => (
                          <div key={ch} className="rounded-xl bg-white/[0.03] p-2.5 text-center">
                            <p className="text-sm font-bold text-white/85 capitalize">{ch}</p>
                            <p className="text-[10px] text-white/40">entropy {s.entropy?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-white/35">
                        Saturation {(result.forensics.colour.saturation * 100).toFixed(1)}% · Value {(result.forensics.colour.value * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'metadata' && (
                <motion.div
                  key="metadata"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {[
                    { label: 'Model', value: result.modelUsed || 'Swin-B (Organika/sdxl-detector)' },
                    { label: 'Processing Time', value: result.processingTimeMs ? `${(result.processingTimeMs / 1000).toFixed(1)}s` : 'N/A' },
                    { label: 'AI Probability', value: result.debug?.raw_probabilities?.[0] != null ? `${(result.debug.raw_probabilities[0] * 100).toFixed(1)}%` : `${result.aiPercent}%` },
                    { label: 'Real Probability', value: result.debug?.raw_probabilities?.[1] != null ? `${(result.debug.raw_probabilities[1] * 100).toFixed(1)}%` : `${result.realPercent}%` },
                    { label: 'Metadata', value: result.indicators[0]?.value || 'Analyzing...' },
                    { label: 'Report ID', value: reportId },
                    { label: 'Timestamp', value: new Date().toISOString() },
                  ].map((item) => (
                    <div key={item.label} className="glass-soft flex items-center justify-between rounded-xl px-4 py-2.5">
                      <span className="text-xs text-white/40">{item.label}</span>
                      <span className="text-xs font-medium text-white/70 font-mono">{item.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 sm:px-7">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 px-4 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 rounded-xl border border-neon/20 bg-neon/10 py-3 px-4 text-sm font-semibold text-neon transition-all hover:bg-neon/20 hover:shadow-[0_0_20px_rgba(0,255,102,0.15)]"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span> PDF
              </button>
              <button
                onClick={downloadPNG}
                title="Export report as PNG image"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 px-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">PNG</span>
              </button>
              <button
                onClick={downloadCSV}
                title="Export report as CSV data"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 px-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={onNew}
                className="liquid-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(0,255,102,0.4)]"
              >
                <FileText className="h-4 w-4" />
                New Scan
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={shareLink}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Link2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                onClick={() => setCardOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Card
              </button>
              <button
                onClick={onReport}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-danger/20 py-2.5 text-xs font-semibold text-danger/80 transition-colors hover:bg-danger/10"
              >
                <Flag className="h-3.5 w-3.5" /> Report
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {cardOpen && <ShareCardGenerator result={result} previewUrl={previewUrl} onClose={() => setCardOpen(false)} />}
        </AnimatePresence>
      </div>
    </section>
  );
}
