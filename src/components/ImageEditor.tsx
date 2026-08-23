import { useEffect, useRef, useState } from 'react';
import { RotateCw, Crop, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFocusTrap } from './ModalShell';

interface ImageEditorProps {
  file: File;
  onCancel: () => void;
  onApply: (edited: File) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function ImageEditor({ file, onCancel, onApply }: ImageEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0); // 0/90/180/270
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<Rect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    const update = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const maxW = Math.min(wrap.clientWidth, 480);
      const maxH = Math.min(wrap.clientHeight, 440);
      const rotated = rotation % 180 === 0;
      const iw = rotated ? natural.w : natural.h;
      const ih = rotated ? natural.h : natural.w;
      const scale = Math.min(maxW / iw, maxH / ih, 1);
      setDisplay({ w: iw * scale, h: ih * scale });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [natural, rotation]);

  const startCrop = (e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setCrop({ x, y, w: 0, h: 0 });
    setDragging(true);
  };

  const moveCrop = (e: React.PointerEvent) => {
    if (!dragging || !crop) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), display.w);
    const y = Math.min(Math.max(e.clientY - r.top, 0), display.h);
    setCrop((prev) => ({
      x: Math.min(prev!.x, x),
      y: Math.min(prev!.y, y),
      w: Math.abs(prev!.x - x),
      h: Math.abs(prev!.y - y),
    }));
  };

  const endCrop = () => {
    setDragging(false);
    if (crop && (crop.w < 10 || crop.h < 10)) setCrop(null);
  };

  const apply = async () => {
    if (!previewUrl) return;
    setBusy(true);
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('load failed'));
      });

      const rotated = rotation % 180 === 0;
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      // Map display-space crop to source-space.
      let cx = 0, cy = 0, cw = srcW, ch = srcH;
      if (crop && crop.w > 0 && crop.h > 0) {
        const scaleX = (rotated ? srcW : srcH) / display.w;
        const scaleY = (rotated ? srcH : srcW) / display.h;
        cx = crop.x * scaleX;
        cy = crop.y * scaleY;
        cw = crop.w * scaleX;
        ch = crop.h * scaleY;
      }

      // Create a canvas that accounts for rotation, then crop in display order.
      let canvas = document.createElement('canvas');
      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (rotation) {
        const tmp = document.createElement('canvas');
        tmp.width = rotation % 180 === 0 ? srcW : srcH;
        tmp.height = rotation % 180 === 0 ? srcH : srcW;
        const tctx = tmp.getContext('2d')!;
        tctx.translate(tmp.width / 2, tmp.height / 2);
        tctx.rotate((rotation * Math.PI) / 180);
        tctx.drawImage(canvas, -srcW / 2, -srcH / 2);
        canvas = tmp;
      }

      const finalW = Math.max(1, Math.round(cw));
      const finalH = Math.max(1, Math.round(ch));
      const out = document.createElement('canvas');
      out.width = finalW;
      out.height = finalH;
      out.getContext('2d')!.drawImage(canvas, Math.round(cx), Math.round(cy), finalW, finalH, 0, 0, finalW, finalH);

      const blob = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/png'));
      if (!blob) throw new Error('encode failed');
      const edited = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-edited.png', {
        type: 'image/png',
      });
      onApply(edited);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      ref={useFocusTrap<HTMLDivElement>(true, onCancel)}
      role="dialog"
      aria-modal="true"
      aria-label="Edit image"
      tabIndex={-1}
      className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm outline-none"
    >
      <div className="glass w-full max-w-[560px] rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Edit image</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={wrapRef}
          className="relative mx-auto grid touch-none place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/40"
          style={{ width: display.w || '100%', height: display.h || 220 }}
          onPointerDown={startCrop}
          onPointerMove={moveCrop}
          onPointerUp={endCrop}
          onPointerLeave={endCrop}
        >
          {previewUrl && (
            <img
              ref={imgRef}
              src={previewUrl}
              alt="preview"
              onLoad={() => {
                setNatural({ w: imgRef.current?.naturalWidth || 0, h: imgRef.current?.naturalHeight || 0 });
              }}
              className="max-h-[440px] w-auto select-none"
              style={{ width: display.w, height: display.h, transform: `rotate(${rotation}deg)` }}
              draggable={false}
            />
          )}
          {crop && crop.w > 0 && (
            <div
              className="pointer-events-none absolute border-2 border-neon bg-neon/10"
              style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
            />
          )}
          {!crop && (
            <div className="overlay-label pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px]">
              Drag to crop
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            <RotateCw className="h-4 w-4" /> Rotate
          </button>
          <button
            onClick={() => setCrop(null)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            <Crop className="h-4 w-4" /> Reset crop
          </button>
          <div className="flex-1" />
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={busy}
            className="liquid-btn flex items-center gap-2 rounded-xl bg-neon px-4 py-2 text-sm font-bold text-black hover:shadow-[0_0_24px_rgba(52, 211, 153,0.4)]"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
}
