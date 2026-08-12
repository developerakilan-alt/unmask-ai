import { AnimatedSection } from './AnimatedSection';
import Marquee from './Marquee';
import { Brain, Cpu, Boxes, Binary, Gauge, Network, Layers, ScanSearch } from 'lucide-react';

const MODELS = [
  { icon: Brain, name: 'Vision Transformer', tag: 'ViT-B/16' },
  { icon: Cpu, name: 'EfficientNet', tag: 'B7' },
  { icon: Boxes, name: 'CLIP', tag: 'Zero-shot' },
  { icon: Binary, name: 'ResNet', tag: '50' },
  { icon: Gauge, name: 'CNN Ensemble', tag: 'Custom' },
  { icon: Network, name: 'Swin-B', tag: 'SDXL Detector' },
  { icon: Layers, name: 'Fusion Head', tag: 'Late-fusion' },
  { icon: ScanSearch, name: 'Forensic Stack', tag: '12 Metrics' },
];

export default function SupportedModels() {
  return (
    <section className="relative z-10 py-16">
      <div className="mx-auto max-w-4xl px-4">
        <AnimatedSection>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Detection Architecture
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Built on state-of-the-art computer vision architectures.
          </p>
        </AnimatedSection>
      </div>

      <AnimatedSection className="mt-10" direction="none">
        <Marquee duration={38}>
          {MODELS.map((model) => (
            <div
              key={model.name}
              className="glass group flex shrink-0 items-center gap-3 rounded-xl px-6 py-3.5 transition-colors hover:border-neon/30"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/25 bg-neon/10 text-neon transition-transform group-hover:scale-110">
                <model.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{model.name}</p>
                <p className="text-[10px] text-white/40">{model.tag}</p>
              </div>
            </div>
          ))}
        </Marquee>
      </AnimatedSection>

      <AnimatedSection className="mt-4" direction="none" delay={0.1}>
        <Marquee duration={48} reverse>
          {['EXIF Forensics', 'Noise Residuals', 'Compression Grids', 'GAN Artifacts', 'Lighting Coherence', 'Shadow Geometry', 'Chroma Noise', 'Edge Coherence'].map((t) => (
            <span
              key={t}
              className="glass-pill shrink-0 rounded-full px-5 py-2 text-xs font-semibold tracking-wide text-white/50"
            >
              <span className="mr-2 text-neon">✦</span>
              {t}
            </span>
          ))}
        </Marquee>
      </AnimatedSection>
    </section>
  );
}
