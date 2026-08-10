import { AnimatedSection } from './AnimatedSection';

const MODELS = [
  { name: 'CNN', desc: 'Convolutional Neural Networks' },
  { name: 'ViT', desc: 'Vision Transformer' },
  { name: 'CLIP', desc: 'Contrastive Language-Image' },
  { name: 'EfficientNet', desc: 'Scalable Efficiency' },
  { name: 'ResNet', desc: 'Deep Residual Networks' },
];

export default function SupportedModels() {
  return (
    <section className="relative z-10 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Detection Architecture
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Built on state-of-the-art computer vision architectures.
          </p>
        </AnimatedSection>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {MODELS.map((model, i) => (
            <AnimatedSection key={model.name} delay={i * 80}>
              <div className="glass group relative overflow-hidden rounded-xl px-6 py-3 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_20px_rgba(0,255,102,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-r from-neon/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative text-center">
                  <p className="text-lg font-bold text-neon">{model.name}</p>
                  <p className="text-[10px] text-white/40">{model.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
