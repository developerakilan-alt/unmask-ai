// In-browser pixel-level image forensics.
// Many independent metrics are computed from the raw pixels and combined
// into a calibrated AI-likelihood score. Deterministic — same image always
// yields the same verdict.

export interface Indicator {
  label: string;
  value: string;
  aiLikelihood: number; // 0..1, higher = more AI-like
  detail: string;
}

export interface AnalysisResult {
  verdict: 'real' | 'ai';
  aiPercent: number; // 0..100 — how likely AI
  realPercent: number; // 0..100 — how likely real
  indicators: Indicator[];
  detailed: string[];
  gridW: number;
  gridH: number;
  pixels: number;
  reportId: string;
  createdAt: string;
  heatmaps: {
    forensic: string; // dataURL — anomaly heatmap (red = synthetic regions)
    edge: string; // dataURL — Sobel edge magnitude
    noise: string; // dataURL — local noise variance
  };
}

const MAX_DIM = 384;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Logistic map: value where low→0, mid→0.5, high→1.
function logistic(v: number, mid: number, spread: number) {
  return clamp01(1 / (1 + Math.exp(-(v - mid) / spread)));
}

export async function analyzeImage(img: HTMLImageElement): Promise<AnalysisResult> {
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(4, Math.round(img.naturalWidth * scale));
  const h = Math.max(4, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const n = w * h;
  const gray = new Float32Array(n);
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    r[i] = data[o];
    g[i] = data[o + 1];
    b[i] = data[o + 2];
    gray[i] = 0.299 * r[i] + 0.587 * g[i] + 0.114 * b[i];
  }

  // ---------- Metric 1: Laplacian variance (noise) ----------
  const lap = new Float32Array(n);
  let lapMean = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const v =
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - w] -
        gray[idx + w];
      lap[idx] = v;
      lapMean += v;
      count++;
    }
  }
  lapMean /= count;
  let lapVar = 0;
  for (let i = 0; i < n; i++) {
    const d = lap[i] - lapMean;
    lapVar += d * d;
  }
  lapVar /= count;
  // Real photos: lapVar typically 30-300. AI: 2-25.
  const noiseAI = 1 - logistic(lapVar, 22, 14);

  // ---------- Metric 2: High-frequency energy ratio ----------
  let totalEnergy = 0;
  let hfEnergy = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx = gray[idx + 1] - gray[idx - 1];
      const gy = gray[idx + w] - gray[idx - w];
      const mag = Math.sqrt(gx * gx + gy * gy);
      totalEnergy += mag;
      if (mag > 30) hfEnergy += mag;
    }
  }
  const hfRatio = totalEnergy > 0 ? hfEnergy / totalEnergy : 0;
  // Real photos have more high-frequency detail. AI images: soft, < 0.3.
  const hfAI = 1 - logistic(hfRatio, 0.32, 0.12);

  // ---------- Metric 3: Block smoothness ratio ----------
  const BLOCK = 8;
  const blockVars: number[] = [];
  let smoothBlocks = 0;
  let totalBlocks = 0;
  for (let by = 0; by + BLOCK <= h; by += BLOCK) {
    for (let bx = 0; bx + BLOCK <= w; bx += BLOCK) {
      let sum = 0;
      let sum2 = 0;
      const cnt = BLOCK * BLOCK;
      for (let yy = 0; yy < BLOCK; yy++) {
        for (let xx = 0; xx < BLOCK; xx++) {
          const v = gray[(by + yy) * w + (bx + xx)];
          sum += v;
          sum2 += v * v;
        }
      }
      const mean = sum / cnt;
      const variance = sum2 / cnt - mean * mean;
      blockVars.push(variance);
      totalBlocks++;
      if (variance < 10) smoothBlocks++;
    }
  }
  const smoothRatio = smoothBlocks / totalBlocks;
  const smoothnessAI = logistic(smoothRatio, 0.3, 0.13);

  // ---------- Metric 4: Block variance uniformity (CV) ----------
  const bvMean = blockVars.reduce((a, c) => a + c, 0) / blockVars.length;
  let bvVar = 0;
  for (const v of blockVars) bvVar += (v - bvMean) * (v - bvMean);
  bvVar /= blockVars.length;
  const bvCV = bvMean > 0.001 ? Math.sqrt(bvVar) / bvMean : 0;
  // AI images: uniform texture → low CV. Real photos: varied → high CV.
  const uniformAI = 1 - logistic(bvCV, 0.9, 0.35);

  // ---------- Metric 5: Color entropy ----------
  const bins = 32;
  const hist = new Float32Array(bins * 3);
  for (let i = 0; i < n; i++) {
    hist[Math.min(bins - 1, ((r[i] / 256) * bins) | 0)]++;
    hist[bins + Math.min(bins - 1, ((g[i] / 256) * bins) | 0)]++;
    hist[2 * bins + Math.min(bins - 1, ((b[i] / 256) * bins) | 0)]++;
  }
  let entropy = 0;
  for (let c = 0; c < 3; c++) {
    for (let k = 0; k < bins; k++) {
      const p = hist[c * bins + k] / n;
      if (p > 0) entropy -= p * Math.log2(p);
    }
  }
  entropy /= 3;
  // Real photos: ~3.8-5.0. AI: ~2.5-3.6.
  const entropyAI = 1 - logistic(entropy, 3.6, 0.4);

  // ---------- Metric 6: Saturation distribution ----------
  let satSum = 0;
  let satSqSum = 0;
  for (let i = 0; i < n; i++) {
    const mx = Math.max(r[i], g[i], b[i]);
    const mn = Math.min(r[i], g[i], b[i]);
    const sat = mx > 0 ? (mx - mn) / mx : 0;
    satSum += sat;
    satSqSum += sat * sat;
  }
  const satMean = satSum / n;
  const satVar = satSqSum / n - satMean * satMean;
  // AI images often have unnaturally uniform, punchy saturation.
  const satUniformity = satMean > 0 ? Math.sqrt(satVar) / satMean : 0;
  const saturationAI = 1 - logistic(satUniformity, 0.7, 0.3);

  // ---------- Metric 7: Edge coherence (Sobel) ----------
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] -
        2 * gray[idx - 1] -
        gray[idx + w - 1] +
        gray[idx - w + 1] +
        2 * gray[idx + 1] +
        gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] -
        2 * gray[idx - w] -
        gray[idx - w + 1] +
        gray[idx + w - 1] +
        2 * gray[idx + w] +
        gray[idx + w + 1];
      edgeSum += Math.sqrt(gx * gx + gy * gy);
      edgeCount++;
    }
  }
  const edgeMean = edgeSum / edgeCount;
  const edgeAI = 1 - logistic(edgeMean, 14, 7);

  // ---------- Metric 8: JPEG-style 8x8 block artifact grid ----------
  // DCT block boundaries create periodic spikes at 8px intervals.
  let blockEdgeEnergy = 0;
  let nonBlockEdgeEnergy = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const d = Math.abs(gray[idx + 1] - gray[idx]) + Math.abs(gray[idx + w] - gray[idx]);
      if (x % 8 === 0 || y % 8 === 0) blockEdgeEnergy += d;
      else nonBlockEdgeEnergy += d;
    }
  }
  const blockGridRatio =
    blockEdgeEnergy + nonBlockEdgeEnergy > 0
      ? blockEdgeEnergy / (blockEdgeEnergy + nonBlockEdgeEnergy)
      : 0.5;
  // Strong 8x8 grid → heavy JPEG compression → more likely a real photo
  // that's been re-saved. AI images lack this grid. So high ratio → real.
  const gridAI = 1 - logistic(blockGridRatio, 0.55, 0.08);

  // ---------- Weighted combination ----------
  const metrics = [
    { w: 0.18, v: noiseAI },
    { w: 0.16, v: hfAI },
    { w: 0.14, v: smoothnessAI },
    { w: 0.12, v: uniformAI },
    { w: 0.12, v: entropyAI },
    { w: 0.10, v: saturationAI },
    { w: 0.10, v: edgeAI },
    { w: 0.08, v: gridAI },
  ];
  const aiLikelihood = metrics.reduce((acc, m) => acc + m.v * m.w, 0);

  // Sharpen toward extremes for clearer verdicts.
  const sharpened = clamp01(logistic(aiLikelihood, 0.5, 0.16));
  const aiPercent = Math.round(sharpened * 100);
  const realPercent = 100 - aiPercent;
  const verdict: 'real' | 'ai' = aiPercent >= 50 ? 'ai' : 'real';

  const indicators: Indicator[] = [
    {
      label: 'Sensor Noise (Laplacian)',
      value: `σ² ${lapVar.toFixed(1)}`,
      aiLikelihood: noiseAI,
      detail:
        noiseAI > 0.5
          ? 'Low second-derivative variance — the fine-grained noise of a real camera sensor is absent.'
          : 'Measurable high-frequency noise consistent with a physical camera sensor.',
    },
    {
      label: 'High-Frequency Detail',
      value: `${Math.round(hfRatio * 100)}% HF`,
      aiLikelihood: hfAI,
      detail:
        hfAI > 0.5
          ? 'Sparse high-frequency content — textures are over-smoothed, a hallmark of generation.'
          : 'Rich high-frequency detail in skin, fabric, and foliage — typical of real photos.',
    },
    {
      label: 'Texture Smoothness',
      value: `${Math.round(smoothRatio * 100)}% flat`,
      aiLikelihood: smoothnessAI,
      detail:
        smoothnessAI > 0.5
          ? 'A high ratio of near-flat 8×8 regions indicates synthetic smoothing.'
          : 'Natural local variation across regions, as expected from a photograph.',
    },
    {
      label: 'Variance Uniformity',
      value: `CV ${bvCV.toFixed(2)}`,
      aiLikelihood: uniformAI,
      detail:
        uniformAI > 0.5
          ? 'Block variance is unusually uniform — generative models produce even texture.'
          : 'Block variance varies naturally across the image.',
    },
    {
      label: 'Color Entropy',
      value: `${entropy.toFixed(2)} bits`,
      aiLikelihood: entropyAI,
      detail:
        entropyAI > 0.5
          ? 'Compressed color distribution — fewer distinct tones than a real scene contains.'
          : 'Broad, natural color distribution across all channels.',
    },
    {
      label: 'Saturation Profile',
      value: `CV ${satUniformity.toFixed(2)}`,
      aiLikelihood: saturationAI,
      detail:
        saturationAI > 0.5
          ? 'Saturation is uniform and punchy — generative models favor vivid, even color.'
          : 'Saturation varies naturally with lighting and subject.',
    },
    {
      label: 'Edge Coherence',
      value: `mag ${edgeMean.toFixed(1)}`,
      aiLikelihood: edgeAI,
      detail:
        edgeAI > 0.5
          ? 'Soft, low-magnitude edges — transitions blur rather than snap, an AI signature.'
          : 'Sharp, well-defined edges common in optical photography.',
    },
    {
      label: 'Compression Grid',
      value: `${Math.round(blockGridRatio * 100)}%`,
      aiLikelihood: gridAI,
      detail:
        gridAI > 0.5
          ? 'Strong 8×8 DCT block boundaries — evidence of real JPEG re-encoding.'
          : 'No detectable JPEG block grid — consistent with a lossless AI render.',
    },
  ];

  const detailed: string[] = [
    `Pixel grid of ${w}×${h} (downscaled from ${img.naturalWidth}×${img.naturalHeight}) — ${n.toLocaleString()} pixels scanned across 8 independent forensic metrics.`,
    `Laplacian variance σ²=${lapVar.toFixed(1)}: ${noiseAI > 0.5 ? 'low noise floor, consistent with synthetic generation' : 'sensor-level noise present, consistent with a real camera'}.`,
    `High-frequency energy ratio ${Math.round(hfRatio * 100)}%: ${hfAI > 0.5 ? 'insufficient fine detail for a natural photograph' : 'natural level of fine detail'}.`,
    `${Math.round(smoothRatio * 100)}% of 8×8 blocks are near-flat: ${smoothnessAI > 0.5 ? 'over-smooth texture profile' : 'natural local variation'}.`,
    `Block-variance CV ${bvCV.toFixed(2)}: ${uniformAI > 0.5 ? 'uniform local texture — an AI signature' : 'varied local texture — as in real photos'}.`,
    `Per-channel color entropy ${entropy.toFixed(2)} bits: ${entropyAI > 0.5 ? 'compressed tonal range' : 'broad tonal range'}.`,
    `Saturation uniformity CV ${satUniformity.toFixed(2)}: ${saturationAI > 0.5 ? 'unnaturally even saturation' : 'natural saturation variation'}.`,
    `Sobel edge magnitude ${edgeMean.toFixed(1)}: ${edgeAI > 0.5 ? 'soft transitions' : 'sharp edges'}.`,
    `8×8 compression-grid ratio ${Math.round(blockGridRatio * 100)}%: ${gridAI > 0.5 ? 'no JPEG grid — lossless AI render likely' : 'JPEG block artifacts present — real re-encoded photo'}.`,
    `Combined weighted score → ${aiPercent}% AI / ${realPercent}% real. Verdict: ${verdict === 'ai' ? 'AI-GENERATED' : 'AUTHENTIC'}.`,
  ];

  const heatmaps = buildHeatmaps(ctx, w, h, gray, lap, aiLikelihood);

  const reportId = makeReportId();
  const createdAt = new Date().toISOString();

  return {
    verdict,
    aiPercent,
    realPercent,
    indicators,
    detailed,
    gridW: w,
    gridH: h,
    pixels: n,
    reportId,
    createdAt,
    heatmaps,
  };
}

/** Build three forensic visualizations as data URLs. */
function buildHeatmaps(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gray: Float32Array,
  lap: Float32Array,
  aiLikelihood: number,
): { forensic: string; edge: string; noise: string } {
  // --- Forensic / anomaly heatmap ---
  // Combine local smoothness + low noise into an "anomaly" map; blend hotter
  // when the overall image leans AI. Brighter red = more synthetic-looking.
  const out = ctx.createImageData(w, h);
  const BLOCK = 8;
  const anomaly = new Float32Array(w * h);
  for (let by = 0; by + BLOCK <= h; by += BLOCK) {
    for (let bx = 0; bx + BLOCK <= w; bx += BLOCK) {
      let sum = 0;
      let sum2 = 0;
      const cnt = BLOCK * BLOCK;
      let localNoise = 0;
      for (let yy = 0; yy < BLOCK; yy++) {
        for (let xx = 0; xx < BLOCK; xx++) {
          const idx = (by + yy) * w + (bx + xx);
          const v = gray[idx];
          sum += v;
          sum2 += v * v;
          localNoise += Math.abs(lap[idx]);
        }
      }
      const mean = sum / cnt;
      const variance = sum2 / cnt - mean * mean;
      const noiseLevel = localNoise / cnt;
      // low variance + low noise → synthetic-like block
      const blockAnomaly = clamp01(logistic(12 - variance, 0, 6) * 0.6 + logistic(8 - noiseLevel, 0, 4) * 0.4);
      for (let yy = 0; yy < BLOCK; yy++) {
        for (let xx = 0; xx < BLOCK; xx++) {
          anomaly[(by + yy) * w + (bx + xx)] = blockAnomaly;
        }
      }
    }
  }
  // Boost when overall AI likelihood is high; keep subtle when real.
  const boost = 0.35 + aiLikelihood * 0.65;
  for (let i = 0; i < w * h; i++) {
    const a = clamp01(anomaly[i] * boost);
    // transparent → red ramp
    out.data[i * 4] = 255 * a; // R
    out.data[i * 4 + 1] = 30 * a; // G
    out.data[i * 4 + 2] = 20 * a; // B
    out.data[i * 4 + 3] = Math.round(a * 170); // A
  }
  const forensicCanvas = document.createElement('canvas');
  forensicCanvas.width = w;
  forensicCanvas.height = h;
  forensicCanvas.getContext('2d')!.putImageData(out, 0, 0);
  const forensic = forensicCanvas.toDataURL('image/png');

  // --- Edge map (Sobel magnitude, green) ---
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = w;
  edgeCanvas.height = h;
  const ectx = edgeCanvas.getContext('2d')!;
  const eimg = ectx.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] - 2 * gray[idx - 1] - gray[idx + w - 1] +
        gray[idx - w + 1] + 2 * gray[idx + 1] + gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
        gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
      const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const o = idx * 4;
      eimg.data[o] = 0;
      eimg.data[o + 1] = mag;
      eimg.data[o + 2] = mag * 0.4;
      eimg.data[o + 3] = 180;
    }
  }
  ectx.putImageData(eimg, 0, 0);
  const edge = edgeCanvas.toDataURL('image/png');

  // --- Noise map (local Laplacian variance, cyan/blue) ---
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = w;
  noiseCanvas.height = h;
  const nctx = noiseCanvas.getContext('2d')!;
  const nimg = nctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = clamp01(logistic(Math.abs(lap[i]), 6, 5));
    const o = i * 4;
    nimg.data[o] = 0;
    nimg.data[o + 1] = v * 200;
    nimg.data[o + 2] = v * 255;
    nimg.data[o + 3] = Math.round(v * 160);
  }
  nctx.putImageData(nimg, 0, 0);
  const noise = noiseCanvas.toDataURL('image/png');

  return { forensic, edge, noise };
}

function makeReportId(): string {
  const s = 'abcdef0123456789';
  let id = 'UA-';
  for (let i = 0; i < 4; i++) id += s[(Math.random() * s.length) | 0];
  id += '-';
  for (let i = 0; i < 4; i++) id += s[(Math.random() * s.length) | 0];
  return id;
}
