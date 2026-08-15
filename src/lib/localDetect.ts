import type { AnalysisResult } from '../api';
import { computeSpectral } from './spectral';

/**
 * Client-side "Quick Scan" forensics.
 *
 * A lightweight, fully offline heuristic detector that analyzes pixel
 * statistics (noise residuals, sharpness, chroma uniformity, texture
 * entropy, JPEG blockiness) and EXIF presence. It runs entirely in the
 * browser so scans still work when the backend is unreachable.
 *
 * It is deliberately honest about its limits: it never claims the accuracy
 * of the server-side deep model. Results are capped at ~70% confidence and
 * flagged with `local: true` so the UI can label them as a preview.
 */

export interface LocalStats {
  noise: { noise_level: number; sharpness: number };
  colour: {
    saturation: number;
    value: number;
    entropy: number;
    chromaUniformity: number;
  };
  exif: { present: boolean; note?: string; tags: Record<string, string> };
  blockiness: number;
  smoothness: number;
  aiLike: number;
  spectral: ReturnType<typeof computeSpectral>;
}

const MAX_SIDE = 512;

function toGrayscale(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    out[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return out;
}

function meanStd(values: Float32Array): { mean: number; std: number } {
  let mean = 0;
  for (let i = 0; i < values.length; i++) mean += values[i];
  mean /= values.length;
  let v = 0;
  for (let i = 0; i < values.length; i++) v += (values[i] - mean) * (values[i] - mean);
  v /= values.length;
  return { mean, std: Math.sqrt(v) };
}

function laplacianStats(gray: Float32Array, w: number, h: number): { variance: number; highFreqRatio: number } {
  const laps: number[] = [];
  let high = 0;
  let total = 0;
  const threshold = 24;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      laps.push(lap);
      total++;
      if (Math.abs(lap) > threshold) high++;
    }
  }
  const arr = Float32Array.from(laps);
  const { std } = meanStd(arr);
  return { variance: std * std, highFreqRatio: total === 0 ? 0 : high / total };
}

function flatRegionNoise(gray: Float32Array, w: number, h: number): number {
  const bs = 8;
  const vars: number[] = [];
  for (let y = 0; y + bs <= h; y += bs) {
    for (let x = 0; x + bs <= w; x += bs) {
      let mean = 0;
      for (let j = 0; j < bs; j++) for (let i = 0; i < bs; i++) mean += gray[(y + j) * w + (x + i)];
      mean /= bs * bs;
      let v = 0;
      for (let j = 0; j < bs; j++) for (let i = 0; i < bs; i++) {
        const d = gray[(y + j) * w + (x + i)] - mean;
        v += d * d;
      }
      vars.push(v / (bs * bs));
    }
  }
  if (vars.length === 0) return 0;
  vars.sort((a, b) => a - b);
  const n = Math.max(1, Math.floor(vars.length * 0.3));
  let s = 0;
  for (let i = 0; i < n; i++) s += vars[i];
  return Math.sqrt(s / n);
}

function blockiness(gray: Float32Array, w: number, h: number): number {
  let boundary = 0;
  let interior = 0;
  let bCount = 0;
  let iCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const d = Math.abs(gray[i] - gray[i + 1]);
      if (x % 8 === 0) {
        boundary += d;
        bCount++;
      } else {
        interior += d;
        iCount++;
      }
    }
  }
  if (bCount === 0 || iCount === 0) return 0;
  return (boundary / bCount) / (interior / iCount);
}

function colorStats(data: Uint8ClampedArray, w: number, h: number): { saturation: number; value: number; chromaUniformity: number; entropy: number } {
  const bins = new Float32Array(64);
  let satSum = 0;
  let valSum = 0;
  let satSqSum = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const r = data[p] / 255;
    const g = data[p + 1] / 255;
    const b = data[p + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    const v = max;
    satSum += s;
    valSum += v;
    satSqSum += s * s;
    const lum = Math.floor((0.299 * r + 0.587 * g + 0.114 * b) * 63);
    bins[lum]++;
  }
  const avgSat = satSum / n;
  const avgVal = valSum / n;
  const satStd = Math.sqrt(Math.max(0, satSqSum / n - avgSat * avgSat));
  let entropy = 0;
  for (let i = 0; i < 64; i++) {
    if (bins[i] === 0) continue;
    const p = bins[i] / n;
    entropy -= p * Math.log2(p);
  }
  return { saturation: avgSat, value: avgVal, chromaUniformity: 1 - Math.min(1, satStd * 3), entropy };
}

function hasExif(bytes: Uint8Array): boolean {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 131072)));
  return head.includes('Exif\x00\x00');
}

/** Parse common camera tags (Make/Model/DateTimeOriginal/Software) from the EXIF block. */
function parseExifTags(bytes: Uint8Array): Record<string, string> {
  const tags: Record<string, string> = {};
  const find = (needle: Uint8Array, from = 0): number => {
    outer: for (let i = from; i + needle.length <= bytes.length; i++) {
      for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  };
  const exifIdx = find(new TextEncoder().encode('Exif\x00\x00'));
  if (exifIdx < 0) return tags;
  const tiff = exifIdx + 6;
  if (tiff + 4 > bytes.length) return tags;
  const le = bytes[tiff] === 0x49;
  const u16 = (off: number) => (le ? bytes[off] | (bytes[off + 1] << 8) : (bytes[off] << 8) | bytes[off + 1]);
  const u32 = (off: number) => (le ? bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24) : ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0);
  const ifd0 = tiff + u32(tiff + 4);
  if (ifd0 + 2 > bytes.length) return tags;
  const count = u16(ifd0);
  const entry = ifd0 + 2;
  const ascii = (valOff: number, len: number): string => {
    const end = Math.min(valOff + len, bytes.length);
    let s = '';
    for (let i = valOff; i < end; i++) {
      const c = bytes[i];
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s.trim();
  };
  for (let i = 0; i < count && i < 64; i++) {
    const e = entry + i * 12;
    if (e + 12 > bytes.length) break;
    const tag = u16(e);
    const type = u16(e + 2);
    const len = u32(e + 4);
    if (tag === 0x010f && type === 2) tags.Make = ascii(tiff + u32(e + 8), len);
    if (tag === 0x0110 && type === 2) tags.Model = ascii(tiff + u32(e + 8), len);
    if (tag === 0x0131 && type === 2) tags.Software = ascii(tiff + u32(e + 8), len);
    if (tag === 0x9003 && type === 2) tags.DateTimeOriginal = ascii(tiff + u32(e + 8), len);
  }
  return tags;
}

function detectExif(file: Blob): Promise<{ present: boolean; note?: string; tags: Record<string, string> }> {
  return new Promise((resolve) => {
    if (file.type && !/jpe?g|tiff/i.test(file.type) && !/\.(jpe?g|tiff?)$/i.test((file as File).name || '')) {
      resolve({ present: false, note: 'Format does not commonly embed EXIF', tags: {} });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve({ present: false, note: 'Could not read metadata', tags: {} });
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      const present = hasExif(bytes);
      const tags = present ? parseExifTags(bytes) : {};
      const camera = tags.Make ? `${tags.Make}${tags.Model ? ' ' + tags.Model : ''}` : '';
      resolve({
        present,
        note: present ? (camera ? `EXIF found · camera ${camera}` : 'EXIF block found') : 'No EXIF metadata found',
        tags,
      });
    };
    reader.readAsArrayBuffer(file.slice(0, 262144));
  });
}

function drawImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = url;
  });
}

export async function computeStats(file: Blob): Promise<LocalStats> {
  const img = await drawImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = toGrayscale(data, w, h);
  const lap = laplacianStats(gray, w, h);
  const noise = flatRegionNoise(gray, w, h);
  const block = blockiness(gray, w, h);
  const color = colorStats(data, w, h);
  const spectral = computeSpectral(gray, w, h);
  const exif = await detectExif(file);

  const normalizedNoise = Math.min(1, noise / 22);
  const smoothness = 1 - normalizedNoise;
  const entropyScore = Math.min(1, Math.max(0, (7.2 - color.entropy) / 6));
  const satScore = Math.min(1, Math.max(0, (color.saturation - 0.22) / 0.5));
  const exifScore = exif.present ? 0 : 0.2;
  const blockScore = Math.min(1, Math.max(0, (block - 1.05) / 0.35));

  const aiLike = Math.min(
    1,
    Math.max(0, 0.35 * smoothness + 0.18 * satScore + 0.22 * entropyScore + 0.1 * exifScore + 0.15 * blockScore),
  );

  return {
    noise: { noise_level: noise, sharpness: lap.variance },
    colour: {
      saturation: color.saturation,
      value: color.value,
      entropy: color.entropy,
      chromaUniformity: color.chromaUniformity,
    },
    exif,
    blockiness: block,
    smoothness,
    aiLike,
    spectral,
  };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-12 * (x - 0.5)));
}

/**
 * Best-effort generator attribution. Only meaningful when the image leans
 * AI; confidence is deliberately capped low so it is never mistaken for a
 * verified identification.
 */
function attributeGenerator(stats: LocalStats): { generator: string | null; confidence: number; hints: string[] } {
  if (stats.aiLike < 0.58) return { generator: null, confidence: 0, hints: [] };

  const s = stats.spectral;
  const hints: string[] = [];
  const sharpNorm = Math.min(1, stats.noise.sharpness / 2000);
  const blockScore = Math.min(1, Math.max(0, (stats.blockiness - 1.05) / 0.35));

  const ganCue = s.gridPeak > 1.28 ? Math.min(1, (s.gridPeak - 1.28) / 0.6) : 0;
  if (s.gridPeak > 1.28) hints.push('periodic 8px grid energy suggests GAN-style tiling artifacts');

  const dalleScore = s.lowBand * 0.55 + stats.colour.chromaUniformity * 0.25 + stats.smoothness * 0.2;
  if (s.lowBand > 0.45) hints.push('unusually smooth low-frequency spectrum, typical of DALL-E-style renders');

  const midjourneyScore = stats.colour.saturation * 0.45 + stats.smoothness * 0.35 + (1 - blockScore) * 0.2;
  if (stats.colour.saturation > 0.34) hints.push('high colour saturation is common in Midjourney outputs');

  const sdScore = blockScore * 0.4 + sharpNorm * 0.3 + (1 - stats.colour.chromaUniformity) * 0.3;
  if (blockScore > 0.6) hints.push('elevated 8px DCT blockiness points to SDXL-class over-sharpening');

  let generator: string | null = null;
  if (ganCue > 0.6) {
    generator = 'GAN (StyleGAN/DCGAN)';
    hints.unshift('strong periodic texture signature dominates');
  } else {
    const best = Math.max(dalleScore, midjourneyScore, sdScore);
    if (best < 0.34) {
      return { generator: null, confidence: 0, hints: [] };
    }
    if (best === dalleScore) generator = 'DALL-E';
    else if (best === midjourneyScore) generator = 'Midjourney';
    else generator = 'Stable Diffusion / SDXL';
  }

  const spread = Math.max(dalleScore, midjourneyScore, sdScore) - Math.min(dalleScore, midjourneyScore, sdScore);
  const confidence = Math.min(60, Math.round(30 + spread * 45 + ganCue * 25));
  return { generator, confidence, hints: hints.slice(0, 3) };
}

function indicator(label: string, value: string, aiLikelihood: number, detail: string) {
  return { label, value, aiLikelihood, detail };
}

export function buildLocalResult(stats: LocalStats, elapsed: number, phash?: string | null): AnalysisResult {
  const p = sigmoid(stats.aiLike);
  const aiPercent = Math.round(p * 100);
  const classification: AnalysisResult['classification'] = aiPercent >= 62 ? 'AI_GENERATED' : aiPercent <= 38 ? 'REAL' : 'UNCERTAIN';
  const verdict: AnalysisResult['verdict'] = classification === 'AI_GENERATED' ? 'ai' : classification === 'REAL' ? 'real' : 'uncertain';
  const confidence = Math.min(75, Math.round(42 + 33 * Math.abs(aiPercent - 50) / 50));
  const attribution = attributeGenerator(stats);

  const indicators = [
    indicator('Sensor noise signature', `${stats.noise.noise_level.toFixed(2)}`, 1 - stats.smoothness, 'Flat-region pixel variance. Real sensors add noise; AI renders are often unnaturally smooth.'),
    indicator('Texture entropy', `${stats.colour.entropy.toFixed(2)} bits`, Math.min(1, Math.max(0, (7.2 - stats.colour.entropy) / 6)), 'Information density in the luminance histogram.'),
    indicator('Chroma uniformity', `${(stats.colour.chromaUniformity * 100).toFixed(0)}%`, stats.colour.chromaUniformity, 'Consistency of color saturation across the frame.'),
    indicator('JPEG blockiness', `${stats.blockiness.toFixed(3)}`, Math.min(1, Math.max(0, (stats.blockiness - 1.05) / 0.35)), '8px DCT-grid artifact strength.'),
    indicator('EXIF metadata', stats.exif.present ? 'present' : 'absent', stats.exif.present ? 0 : 0.2, stats.exif.note || ''),
  ];

  return {
    classification,
    verdict,
    aiPercent,
    realPercent: 100 - aiPercent,
    confidence,
    indicators,
    heatmap: '',
    featureScores: {
      smoothness: stats.smoothness,
      noise: Math.min(1, stats.noise.noise_level / 22),
      chroma_uniformity: stats.colour.chromaUniformity,
      texture_entropy: Math.min(1, Math.max(0, stats.colour.entropy / 8)),
      blockiness: Math.min(1, (stats.blockiness - 1) / 0.4),
    },
    modelUsed: 'Unmask AI · Quick Scan (on-device)',
    processingTimeMs: elapsed,
    attribution,
    phash: phash ?? null,
    debug: {
      prediction: classification,
      confidence,
      model: 'quick-scan-heuristic-v1',
      processing_success: true,
      error: null,
    },
    forensics: {
      exif: stats.exif,
      noise: stats.noise,
      colour: { saturation: stats.colour.saturation, value: stats.colour.value, channels: {} },
    },
    local: true,
  };
}

export async function localDetectImage(file: Blob): Promise<AnalysisResult> {
  const start = Date.now();
  const stats = await computeStats(file);
  const { dHash } = await import('./image');
  const phash = await dHash(file);
  return buildLocalResult(stats, Date.now() - start, phash);
}

/** Average the Quick Scan across several frames (e.g. video frames). */
export async function localDetectFrames(frames: Blob[], file: Blob): Promise<AnalysisResult> {
  if (frames.length === 0) return localDetectImage(file);
  const start = Date.now();
  const statsList = await Promise.all(frames.map((f) => computeStats(f)));
  const avg = (pick: (s: LocalStats) => number) =>
    statsList.reduce((a, s) => a + pick(s), 0) / statsList.length;

  const stats: LocalStats = {
    noise: { noise_level: avg((s) => s.noise.noise_level), sharpness: avg((s) => s.noise.sharpness) },
    colour: {
      saturation: avg((s) => s.colour.saturation),
      value: avg((s) => s.colour.value),
      entropy: avg((s) => s.colour.entropy),
      chromaUniformity: avg((s) => s.colour.chromaUniformity),
    },
    exif: { present: false, note: 'Aggregated across sampled video frames', tags: {} },
    blockiness: avg((s) => s.blockiness),
    smoothness: avg((s) => s.smoothness),
    aiLike: avg((s) => s.aiLike),
    spectral: {
      lowBand: avg((s) => s.spectral.lowBand),
      midBand: avg((s) => s.spectral.midBand),
      highBand: avg((s) => s.spectral.highBand),
      gridPeak: avg((s) => s.spectral.gridPeak),
      rolloff: avg((s) => s.spectral.rolloff),
    },
  };

  const result = buildLocalResult(stats, Date.now() - start);
  result.modelUsed = 'Unmask AI · Video Quick Scan (on-device)';
  return result;
}

export function localResultFromStats(stats: LocalStats): AnalysisResult {
  return buildLocalResult(stats, 0);
}
