import { useEffect, useRef, useState } from 'react';
import { Download, ImageIcon, Loader2, X } from 'lucide-react';

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

export default function ShareCardGenerator({ result, previewUrl, onClose }: ShareCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(true);

  const W = 900;
  const H = 506;
  const isAI = result.classification === 'AI_GENERATED';
  const isUnc = result.classification === 'UNCERTAIN';
  const accent = isAI ? '#ff3b3b' : isUnc ? '#fbbf24' : '#00ff88';

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0f0c';
      ctx.fillRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(0,255,136,0.10)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(255,59,59,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, W, 6);

      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#00ff88';
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
      ctx.fillStyle = '#0a0f0c';
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

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `unmask-ai-card-${(result.scanId || 'result').replace(/[^a-zA-Z0-9]/g, '')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-xl rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <ImageIcon className="h-5 w-5 text-neon" /> Share card
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <canvas ref={canvasRef} width={W} height={H} className="w-full" />
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5">
            Close
          </button>
          <button
            onClick={download}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-2.5 text-sm font-bold text-black hover:bg-neon/90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
