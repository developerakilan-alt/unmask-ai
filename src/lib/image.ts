/**
 * Client-side image helpers: EXIF-safe downscaling/compression before upload
 * and self-contained canvas-generated demo samples (no network needed).
 */

export interface CompressedImage {
  file: File;
  width: number;
  height: number;
  compressed: boolean;
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Downscale large images (max dimension) and re-encode heavy files so the
 * analysis round-trip stays fast. Returns the original file untouched when
 * no optimisation is needed.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<CompressedImage> {
  try {
    const img = await loadImageFromFile(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const tooBig = file.size > 3 * 1024 * 1024;
    if (scale >= 1 && !tooBig) {
      return { file, width: w, height: h, compressed: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { file, width: w, height: h, compressed: false };

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
    const mime = isPng ? 'image/png' : file.type || 'image/jpeg';
    const dataUrl = isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality);
    const blob = await (await fetch(dataUrl)).blob();
    const base = file.name.replace(/\.[^.]+$/, '');
    const name = `${base}${isPng ? '.png' : '.jpg'}`;
    return { file: new File([blob], name, { type: mime }), width: canvas.width, height: canvas.height, compressed: true };
  } catch {
    return { file, width: 0, height: 0, compressed: false };
  }
}

/**
 * dHash (difference hash) — a compact 64-bit perceptual fingerprint that is
 * robust to rescaling, minor color shifts and mild compression. Used to spot
 * the same image (or a near-duplicate) resurfacing in a later scan.
 */
export async function dHash(file: Blob): Promise<string | null> {
  try {
    const img = await loadImageFromFile(file as File);
    const size = 9;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const gray: number[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const p = (y * size + x) * 4;
        gray.push(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
      }
    }
    let bits = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size - 1; x++) {
        bits += gray[y * size + x] >= gray[y * size + x + 1] ? '1' : '0';
      }
    }
    const hex: string[] = [];
    for (let i = 0; i < bits.length; i += 4) {
      hex.push(parseInt(bits.slice(i, i + 4), 2).toString(16));
    }
    return hex.join('');
  } catch {
    return null;
  }
}

/** Hamming distance between two dHash hex strings (0 = identical). */
export function hashDistance(a: string, b: string): number {
  const pad = (s: string) => s.padEnd(16, '0');
  let d = 0;
  const ha = parseInt(pad(a), 16);
  const hb = parseInt(pad(b), 16);
  let v = ha ^ hb;
  while (v) {
    v &= v - 1;
    d++;
  }
  return d;
}

export type SampleKind = 'ai' | 'real';

/** Generate a plausible demo image locally with canvas (JPEG). */
export async function generateSampleImage(kind: SampleKind): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'ai') {
    // Synthetic "AI-art" look: smooth gradients + perfect glowing orbs
    const g = ctx.createLinearGradient(0, 0, 900, 600);
    g.addColorStop(0, '#1b2a4a');
    g.addColorStop(0.5, '#7a2f6f');
    g.addColorStop(1, '#1a6f5c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 600);

    for (let i = 0; i < 45; i++) {
      const x = Math.random() * 900;
      const y = Math.random() * 600;
      const r = 12 + Math.random() * 90;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `hsla(${Math.random() * 360}, 85%, 68%, 0.85)`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // "Real photo" look: gradient scene + sun + sensor-like noise + vignette
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, '#8ecae6');
    g.addColorStop(0.6, '#d8e2dc');
    g.addColorStop(1, '#b5838d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 600);

    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(620, 130, 55, 0, Math.PI * 2);
    ctx.fill();

    // horizon
    ctx.fillStyle = 'rgba(70, 110, 90, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.quadraticCurveTo(300, 330, 620, 380);
    ctx.quadraticCurveTo(780, 400, 900, 360);
    ctx.lineTo(900, 600);
    ctx.lineTo(0, 600);
    ctx.fill();

    // sensor noise
    const data = ctx.getImageData(0, 0, 900, 600);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      px[i] += n;
      px[i + 1] += n;
      px[i + 2] += n;
    }
    ctx.putImageData(data, 0, 0);

    const vg = ctx.createRadialGradient(450, 300, 120, 450, 300, 640);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 900, 600);
  }

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
  return new File(
    [blob || new Blob()],
    kind === 'ai' ? 'sample-ai-generated.jpg' : 'sample-real-photo.jpg',
    { type: 'image/jpeg' },
  );
}
