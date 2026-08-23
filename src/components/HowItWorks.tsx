import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import { UploadCloud, ScanLine, ShieldCheck, FileDown, Share2, ArrowDown } from 'lucide-react';

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload',
    desc: 'Drag & drop or browse an image. JPG, PNG, and WEBP are supported.',
    num: '01',
  },
  {
    icon: ScanLine,
    title: 'AI Analysis',
    desc: 'EXIF metadata and pixel-level forensics scan for AI signatures.',
    num: '02',
  },
  {
    icon: ShieldCheck,
    title: 'Authenticity Report',
    desc: 'Clear verdict with confidence score and key indicators.',
    num: '03',
  },
  {
    icon: FileDown,
    title: 'Download Report',
    desc: 'Save a detailed forensic report with heatmap and metadata.',
    num: '04',
  },
  {
    icon: Share2,
    title: 'Share & Verify',
    desc: 'Generate a shareable link or report ID for review and collaboration.',
    num: '05',
  },
];

export default function HowItWorks() {
  return (
    <section id="features" className="relative z-10 px-4 pb-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/55">
            From upload to verdict in under 2 seconds.
          </p>
        </AnimatedSection>

        <div className="relative mt-16">
          {/* Connecting line with cyan glow */}
          <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-neon/50 via-neon/15 to-transparent shadow-[0_0_14px_rgba(52, 211, 153,0.35)] sm:block" />

          <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:sm:gap-5">
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 150}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Glass panel */}
                  <TiltCard max={6} glow className="w-full rounded-3xl">
                    <div className="glass relative w-full rounded-3xl p-6 transition-all duration-300 hover:border-white/60 hover:shadow-[0_16px_40px_rgba(0, 0, 0,0.5),0_0_26px_rgba(52, 211, 153,0.18)]">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />
                      <div className="pointer-events-none absolute -top-6 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-[100%] bg-white/10 blur-lg" />

                      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all group-hover:scale-110 hover:border-neon/60 hover:shadow-[0_0_26px_rgba(52, 211, 153,0.35)]">
                        <step.icon className="h-7 w-7 text-neon" />
                      </div>

                      <span className="absolute right-4 top-3 text-sm font-bold text-white/25">{step.num}</span>

                      <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{step.desc}</p>
                    </div>
                  </TiltCard>

                  {/* Arrow connector */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block mt-4">
                      <ArrowDown className="h-5 w-5 rotate-[-90deg] text-neon/60 drop-shadow-[0_0_8px_rgba(52, 211, 153,0.6)]" />
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
