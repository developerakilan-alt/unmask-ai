import { useEffect, useRef, useState } from 'react';
import { Download, ImageIcon, Loader2, X, BadgeCheck, Code2, Check } from 'lucide-react';

export interface CardResult {
  classification: 'AI_GENERATED' | 'REAL' | 'UNCERTAIN';
  aiPercent: number;
  confidence: number;
  modelUsed?: string;
  scanId?: string;
  heatmap?: string;
}

interface ShareCardGeneratorProps {
  result: CardResult;
  previewUrl: string | null;
  onClose: () => void;
}

const W = 900;
const H = 506;
const SEAL = 600;

export default function ShareCardGenerator({ result, previewUrl, onClose }: ShareCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sealRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);
  const [sealBusy, setSealBusy] = useState(true);
  const [mode, setMode] = useState<'card' | 'seal'>('card');
  const [copied, setCopied] = useState(false);

  const isAI = result.classification === 'AI_GENERATED';
  const isUnc = result.classification === 'UNCERTAIN';
  const isReal = !isAI && !isUnc;
  const accent = isAI ? '#ff3b3b' : isUnc ? '#fbbf24' : '#6EE7B7';

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#03140c';
      ctx.fillRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(52, 211, 153,0.10)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(255,59,59,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, 6);

      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#6EE7B7';
      ctx.fillText('UNMASK AI', 40, 58);
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('AI IMAGE FORENSIC ANALYSIS', 40, 82);

      // Image thumbnail (right half)
      const thumbX = 470;
      const thumbY = 40;
      const thumbW = W - thumbX - 40;
      const thumbH = H - 40 - 120;

      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('image'));
          el.src = previewUrl || result.heatmap || '';
        });
        const scale = Math.max(thumbW / img.width, thumbH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(thumbX - 1, thumbY - 1, thumbW + 2, thumbH + 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(thumbX - 1, thumbY - 1, thumbW + 2, thumbH + 2);
        ctx.clip();
        ctx.drawImage(img, thumbX + (thumbW - dw) / 2, thumbY + (thumbH - dh) / 2, dw, dh);
        ctx.restore();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(thumbX - 1, thumbY - 1, thumbW + 2, thumbH + 2);
      } catch {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('image unavailable', thumbX + thumbW / 2, thumbY + thumbH / 2);
        ctx.textAlign = 'left';
      }

      // Verdict
      const badgeW = isAI ? 330 : isUnc ? 300 : 280;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(40, 120, badgeW, 64, 12);
      ctx.fill();
      ctx.fillStyle = '#03140c';
      ctx.font = 'bold 30px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isAI ? 'AI-GENERATED' : isUnc ? 'UNCERTAIN' : 'REAL IMAGE', 40 + badgeW / 2, 161);
      ctx.textAlign = 'left';

      // Score
      ctx.font = 'bold 64px "Inter", sans-serif';
      ctx.fillStyle = accent;
      ctx.fillText(`${result.aiPercent.toFixed(1)}%`, 40, 260);
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('AI LIKELIHOOD', 40, 286);

      // Confidence + model
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(`Confidence ${result.confidence.toFixed(1)}%`, 40, 330);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(`Model: ${result.modelUsed || 'Swin-B'}`, 40, 356);

      // Footer
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px "Inter", sans-serif';
      ctx.fillText(`Scan: ${result.scanId || 'n/a'}  ·  ${new Date().toLocaleDateString()}`, 40, H - 30);
      ctx.fillText('unmask-ai.app  ·  Results are indicative, not proof', 40, H - 10);

      if (!cancelled) setBusy(false);
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, [result, previewUrl]);

  useEffect(() => {
    if (mode !== 'seal') return;
    let cancelled = false;
    const draw = () => {
      const canvas = sealRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const cx = SEAL / 2;
      ctx.clearRect(0, 0, SEAL, SEAL);
      ctx.fillStyle = '#03140c';
      ctx.fillRect(0, 0, SEAL, SEAL);

      const ring = (r: number, color: string, lw: number) => {
        ctx.beginPath();
        ctx.arc(cx, cx, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
      };
      ring(285, 'rgba(52, 211, 153,0.18)', 18);
      ring(250, accent, 6);
      ring(150, 'rgba(52, 211, 153,0.35)', 2);

      // Check mark
      ctx.strokeStyle = accent;
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 70, cx + 8);
      ctx.lineTo(cx - 24, cx + 54);
      ctx.lineTo(cx + 86, cx - 62);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '24px "Inter", sans-serif';
      ctx.fillText('VERIFIED', cx, 110);
      ctx.fillText('REAL IMAGE', cx, 142);
      ctx.fillStyle = accent;
      ctx.font = 'bold 34px "Inter", sans-serif';
      ctx.fillText('UNMASK AI', cx, SEAL - 110);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillText(`${result.confidence.toFixed(0)}% confidence  ·  ${new Date().toLocaleDateString()}`, cx, SEAL - 72);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '13px "Inter", sans-serif';
      ctx.fillText(`scan ${result.scanId || 'n/a'}  ·  indicative, not proof`, cx, SEAL - 46);
      ctx.textAlign = 'left';

      if (!cancelled) setSealBusy(false);
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, [mode, result]);

  const download = (canvas: HTMLCanvasElement | null, name: string) => {
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = name;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const copyEmbed = async () => {
    const canvas = sealRef.current;
    if (!canvas) return;
    const src = canvas.toDataURL('image/png');
    const snippet = `<img src="${src}" alt="Unmask AI verified real image badge" width="240" height="240" />`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this embed snippet:', snippet);
    }
  };

  const embedDisabled = !isReal || sealBusy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share card generator"
      className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="glass w-full max-w-xl rounded-3xl p-6 outline-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <ImageIcon className="h-5 w-5 text-neon" /> Share
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode('card')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === 'card' ? 'bg-neon text-black' : 'border border-white/10 text-white/60 hover:bg-white/5'}`}
          >
            Share card
          </button>
          <button
            onClick={() => setMode('seal')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${mode === 'seal' ? 'bg-neon text-black' : 'border border-white/10 text-white/60 hover:bg-white/5'}`}
          >
            <BadgeCheck className="h-4 w-4" /> Verified seal
          </button>
        </div>

        {mode === 'card' ? (
          <>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <canvas ref={canvasRef} width={W} height={H} className="w-full" />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5">
                Close
              </button>
              <button
                onClick={() => download(canvasRef.current, `unmask-ai-card-${(result.scanId || 'result').replace(/[^a-zA-Z0-9]/g, '')}.png`)}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-2.5 text-sm font-bold text-black hover:bg-neon/90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PNG
              </button>
            </div>
          </>
        ) : (
          <>
            {!isReal && (
              <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
                The Verified seal is only available for images classified as Real.
              </p>
            )}
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#03140c]">
              <canvas ref={sealRef} width={SEAL} height={SEAL} className="mx-auto w-full max-w-[320px]" />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => download(sealRef.current, `unmask-ai-verified-real-${new Date().toISOString().slice(0, 10)}.png`)}
                disabled={embedDisabled}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> PNG
              </button>
              <button
                onClick={copyEmbed}
                disabled={embedDisabled}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-2.5 text-sm font-bold text-black hover:bg-neon/90 disabled:opacity-40"
              >
                {copied ? <Check className="h-4 w-4" /> : <Code2 className="h-4 w-4" />} {copied ? 'Copied!' : 'Copy embed code'}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-white/40">
              Embed the badge on your site to show the image was verified real by Unmask AI.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
