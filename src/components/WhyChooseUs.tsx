import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import {
  CheckCircle2,
  Fingerprint,
  ScanEye,
  BrainCircuit,
  Camera,
  Zap,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const FEATURES = [
  { icon: ScanEye, text: 'Pixel-Level Analysis' },
  { icon: Fingerprint, text: 'EXIF Verification' },
  { icon: BrainCircuit, text: 'Deepfake Detection' },
  { icon: BrainCircuit, text: 'Diffusion Artifact Detection' },
  { icon: Camera, text: 'Camera Fingerprinting' },
  { icon: Zap, text: 'Fast Processing (<2 sec)' },
  { icon: ShieldCheck, text: 'Privacy First' },
  { icon: Lock, text: 'No Images Stored' },
];

export default function WhyChooseUs() {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Why Choose Unmask AI?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Enterprise-grade detection technology available to everyone.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feat, i) => (
            <AnimatedSection key={feat.text} delay={i * 60}>
              <TiltCard max={5} className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_20px_rgba(52, 211, 153,0.08)]">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neon/20 bg-neon/10 transition-all group-hover:scale-110 group-hover:border-neon/40">
                  <feat.icon className="h-5 w-5 text-neon" />
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-neon shrink-0" />
                  <span className="text-sm font-medium text-white/80">{feat.text}</span>
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
