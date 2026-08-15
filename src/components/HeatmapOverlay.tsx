import { useEffect, useMemo, useRef } from 'react';

/** Small deterministic PRNG so blob positions stay stable across frames. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Blob {
  x: number;
  y: number;
  r: number;
  cool: boolean;
}

interface HeatmapOverlayProps {
  /** 0..100 — how much of the heatmap is "revealed". */
  progress: number;
}

/**
 * Canvas heatmap that builds up over the preview image as the scan advances.
 * Cyan blobs dominate (cool = likely-manipulated signal) with a few red
 * hot-spots for contrast. The set of blobs is fixed; progress reveals more
 * and animates their intensity so it reads as a live generation.
 */
export default function HeatmapOverlay({ progress }: HeatmapOverlayProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  const blobs = useMemo<Blob[]>(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: 56 }, () => ({
      x: 0.04 + rand() * 0.92,
      y: 0.06 + rand() * 0.88,
      r: 0.09 + rand() * 0.2,
      cool: rand() < 0.72,
    }));
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const visible = Math.min(blobs.length, Math.floor((progress / 100) * blobs.length));
    for (let i = 0; i < visible; i++) {
      const b = blobs[i];
      const cx = b.x * rect.width;
      const cy = b.y * rect.height;
      const r = b.r * rect.width;
      const pulse = 0.7 + 0.3 * Math.sin(i * 1.7 + progress / 14);
      const alpha = 0.16 * pulse + (i / blobs.length) * 0.12;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const color = b.cool ? '88, 221, 242' : '255, 96, 96';
      g.addColorStop(0, `rgba(${color}, ${alpha})`);
      g.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }, [progress, blobs]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
    />
  );
}
