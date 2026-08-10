import type { Classification } from '../api';

export interface Explainer {
  headline: string;
  body: string;
  confidenceNote: string;
}

export function explainResult(classification: Classification, aiPercent: number, confidence: number): Explainer {
  if (classification === 'UNCERTAIN') {
    return {
      headline: 'The model couldn’t decide.',
      body:
        'Your image sits too close to the boundary between "real" and "AI-generated" for the detector to commit to a verdict. That is a deliberate choice: Unmask AI never guesses — it prefers honesty over a confident mistake.',
      confidenceNote:
        `The detector was only ${confidence.toFixed(0)}% confident in either direction. Try a different, higher-resolution crop of the same image, or check the forensic signals below for a closer look.`,
    };
  }
  if (classification === 'AI_GENERATED') {
    const strength =
      aiPercent >= 95 ? 'very strongly' : aiPercent >= 85 ? 'strongly' : aiPercent >= 70 ? 'moderately' : 'weakly';
    return {
      headline: `This image looks ${strength} AI-generated.`,
      body:
        `The detector estimates a ${aiPercent.toFixed(0)}% likelihood that this image was produced by a generative model (e.g. Stable Diffusion, Flux, DALL-E, Midjourney). It reached that conclusion by combining a deep-learning backbone with forensic cues like noise patterns, compression artifacts and metadata.`,
      confidenceNote:
        `Confidence is ${confidence.toFixed(0)}%. AI-image detection is not a guarantee — a real photo can occasionally be flagged, especially after heavy editing or re-compression.`,
    };
  }
  const strength = aiPercent <= 5 ? 'very likely' : aiPercent <= 15 ? 'likely' : 'probably';
  return {
    headline: `This image is ${strength} a real photo.`,
    body:
      `The detector estimates only a ${aiPercent.toFixed(0)}% likelihood of AI generation, which means the image’s statistical signatures line up with how real camera images behave. That includes consistent sensor noise, natural colour statistics and coherent compression traces.`,
    confidenceNote: `Confidence is ${confidence.toFixed(0)}%. An AI image with heavy post-processing can occasionally pass, so treat the result as strong evidence, not absolute proof.`,
  };
}

export function explainIndicator(label: string, likelihood: number): string {
  const high = likelihood >= 0.5;
  const cue = high ? 'raises' : 'lowers';
  const meaning = `${label} ${cue} the AI likelihood (${(likelihood * 100).toFixed(0)}%). `;
  switch (label) {
    case 'EXIF Metadata':
      return meaning + (high
        ? 'Missing or inconsistent metadata is common in AI-generated images.'
        : 'Present, consistent camera metadata points to a real capture.');
    case 'Sensor Noise':
      return meaning + (high
        ? 'Atypical or missing noise patterns suggest the image was rendered, not captured.'
        : 'Natural sensor noise is a strong fingerprint of a real photograph.');
    case 'High-Frequency Detail':
      return meaning + (high
        ? 'Unusual high-frequency energy can be a hallmark of generative upsampling.'
        : 'Real scenes contain complex, irregular high-frequency detail.');
    case 'Texture Smoothness':
      return meaning + (high
        ? 'Overly smooth regions are a classic generative-artifact.'
        : 'Natural texture variation matches camera output.');
    case 'Color Entropy':
      return meaning + (high
        ? 'Colour statistics that deviate from natural images are suspicious.'
        : 'Colour entropy is consistent with real-world photography.');
    case 'Compression Grid':
      return meaning + (high
        ? 'Blocking artifacts inconsistent with the file type can indicate manipulation.'
        : 'Compression structure is consistent for the given format.');
    default:
      return meaning;
  }
}

export function scanExplainers(indicators: { label: string; aiLikelihood: number }[]): string[] {
  return indicators.slice(0, 6).map((ind) => explainIndicator(ind.label, ind.aiLikelihood));
}
