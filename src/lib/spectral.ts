/**
 * Cheap spectral analysis for on-device forensics.
 *
 * A 64x64 grayscale image is transformed with a radix-2 FFT (rows then
 * columns) and the radially-averaged power spectrum is folded into a few
 * bands. Generative models leave tell-tale fingerprints here:
 *   - GANs often produce a strong "checkerboard" high-frequency peak.
 *   - Diffusion outputs (SDXL, Flux, Midjourney) typically roll off faster
 *     in the upper-mid band than real sensor captures.
 *   - Real camera shots retain sensor-noise energy in the high band.
 *
 * All numbers are heuristic signals, never proof.
 */

export interface SpectralSignals {
  /** Fraction of power in 0-2.5% of the Nyquist band. */
  lowBand: number;
  /** Fraction of power in 2.5-12.5% of the Nyquist band. */
  midBand: number;
  /** Fraction of power in 12.5-50% of the Nyquist band. */
  highBand: number;
  /** Ratio of band-variance at the 8px grid periodicity (GAN checkerboard cue). */
  gridPeak: number;
  /** Rolloff steepness proxy: highBand / midBand. */
  rolloff: number;
}

const SIZE = 64;

/** In-place radix-2 1D FFT (bit-reversal + butterfly). */
function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = i + k + len / 2;
        const tRe = curRe * re[b] - curIm * im[b];
        const tIm = curRe * im[b] + curIm * re[b];
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] = re[a] + tRe;
        im[a] = im[a] + tIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

export function computeSpectral(gray: Float32Array, w: number, h: number): SpectralSignals {
  // Downscale via box averaging to a fixed 64x64 grid.
  const re = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    const sy0 = Math.floor((y * h) / SIZE);
    const sy1 = Math.max(sy0 + 1, Math.floor(((y + 1) * h) / SIZE));
    for (let x = 0; x < SIZE; x++) {
      const sx0 = Math.floor((x * w) / SIZE);
      const sx1 = Math.max(sx0 + 1, Math.floor(((x + 1) * w) / SIZE));
      let sum = 0;
      let n = 0;
      for (let j = sy0; j < sy1; j++) {
        for (let i = sx0; i < sx1; i++) {
          sum += gray[j * w + i];
          n++;
        }
      }
      re[y * SIZE + x] = n > 0 ? sum / n : 0;
    }
  }
  const im = new Float32Array(SIZE * SIZE);

  // Rows.
  for (let y = 0; y < SIZE; y++) {
    const rowRe = re.slice(y * SIZE, y * SIZE + SIZE);
    const rowIm = new Float32Array(SIZE);
    fft(rowRe, rowIm);
    re.set(rowRe, y * SIZE);
    im.set(rowIm, y * SIZE);
  }
  // Columns.
  for (let x = 0; x < SIZE; x++) {
    const colRe = new Float32Array(SIZE);
    const colIm = new Float32Array(SIZE);
    for (let y = 0; y < SIZE; y++) {
      colRe[y] = re[y * SIZE + x];
      colIm[y] = im[y * SIZE + x];
    }
    fft(colRe, colIm);
    for (let y = 0; y < SIZE; y++) {
      re[y * SIZE + x] = colRe[y];
      im[y * SIZE + x] = colIm[y];
    }
  }

  // Radial power bands. Nyquist at SIZE/2 = 32 bins.
  let low = 0;
  let mid = 0;
  let high = 0;
  let gridEnergy = 0;
  let gridRef = 0;
  const center = SIZE / 2;
  const nyquist = center;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - center;
      const dy = y - center;
      if (dx === 0 && dy === 0) continue;
      const r = Math.sqrt(dx * dx + dy * dy) / nyquist;
      const mag = re[y * SIZE + x] ** 2 + im[y * SIZE + x] ** 2;
      if (r <= 0.025) low += mag;
      else if (r <= 0.125) mid += mag;
      else if (r <= 0.5) high += mag;
      // 8px grid periodicity on the 64px grid => radius 8 bins => r=0.25.
      if (Math.abs(r - 0.25) < 0.04) gridEnergy += mag;
      else if (Math.abs(r - 0.25) >= 0.08 && r <= 0.42) gridRef += mag;
    }
  }
  const total = low + mid + high || 1;
  const gridPeak = gridRef > 0 ? gridEnergy / gridRef : 0;
  return {
    lowBand: low / total,
    midBand: mid / total,
    highBand: high / total,
    gridPeak,
    rolloff: high / (mid || 1),
  };
}
