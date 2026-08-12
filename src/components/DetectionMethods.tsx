import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import {
  FileSearch,
  Waves,
  Maximize2,
  Fingerprint,
  Sun,
  Layers,
  Grid3x3,
} from 'lucide-react';

const METHODS = [
  {
    icon: FileSearch,
    title: 'EXIF Metadata',
    desc: 'Extract and verify camera manufacturer, model, software, exposure settings, and GPS data.',
    color: 'from-neon/20 to-neon/5',
  },
  {
    icon: Waves,
    title: 'Noise Pattern',
    desc: 'Analyze sensor fingerprint patterns unique to physical camera hardware.',
    color: 'from-neon-400/20 to-neon/5',
  },
  {
    icon: Maximize2,
    title: 'Compression Analysis',
    desc: 'Detect recompression artifacts and JPEG quantization grid inconsistencies.',
    color: 'from-neon-300/20 to-neon/5',
  },
  {
    icon: Fingerprint,
    title: 'GAN Artifact Detection',
    desc: 'Identify diffusion model signatures and generative network fingerprints.',
    color: 'from-danger/20 to-danger/5',
  },
  {
    icon: Sun,
    title: 'Lighting Consistency',
    desc: 'Verify shadow directions and light source consistency across the scene.',
    color: 'from-neon-200/20 to-neon/5',
  },
  {
    icon: Layers,
    title: 'Shadow Analysis',
    desc: 'Deep analysis of shadow gradients, penumbra, and occlusion patterns.',
    color: 'from-neon-500/20 to-neon/5',
  },
  {
    icon: Grid3x3,
    title: 'Pixel-Level Forensics',
    desc: '12 pixel-level metrics including Laplacian variance, LBP texture, and chroma noise.',
    color: 'from-neon-600/20 to-neon/5',
  },
];

export default function DetectionMethods() {
  return (
    <section id="technology" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Detection Technologies
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Seven forensic analysis methods working together to detect AI-generated content.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {METHODS.map((method, i) => (
            <AnimatedSection key={method.title} delay={i * 80}>
              <TiltCard glow className="glass relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="relative">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-neon/20 bg-neon/10 transition-all group-hover:scale-110 group-hover:border-neon/40 group-hover:shadow-[0_0_20px_rgba(0,255,102,0.15)]">
                    <method.icon className="h-6 w-6 text-neon" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{method.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{method.desc}</p>
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
