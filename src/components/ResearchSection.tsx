import { AnimatedSection } from './AnimatedSection';
import { Cpu, Binary, Layers, ScanLine } from 'lucide-react';

const TOOLS = [
  { icon: Cpu, name: 'PyTorch' },
  { icon: Cpu, name: 'TensorFlow' },
  { icon: ScanLine, name: 'OpenCV' },
  { icon: Binary, name: 'NumPy' },
  { icon: Layers, name: 'scikit-image' },
];

export default function ResearchSection() {
  return (
    <section id="about" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Powered By Research
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Built on peer-reviewed research in digital image forensics and computer vision.
          </p>
        </AnimatedSection>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {TOOLS.map((tool, i) => (
            <AnimatedSection key={tool.name} delay={i * 80}>
              <div className="glass group flex items-center gap-3 rounded-xl px-5 py-3 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_20px_rgba(52, 211, 153,0.08)]">
                <tool.icon className="h-5 w-5 text-neon/60 group-hover:text-neon transition-colors" />
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{tool.name}</span>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={400}>
          <div className="mt-12 glass rounded-2xl p-6 text-center">
            <p className="text-sm text-white/50">
              Our research is based on published papers in{' '}
              <span className="text-white/70 font-medium">IEEE S&P</span>,{' '}
              <span className="text-white/70 font-medium">ACM CCS</span>, and{' '}
              <span className="text-white/70 font-medium">NeurIPS</span>{' '}
              on image forensics, deepfake detection, and neural network watermarking.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
