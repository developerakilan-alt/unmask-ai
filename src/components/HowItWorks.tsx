import { AnimatedSection } from './AnimatedSection';
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
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-white/50">
            From upload to verdict in under 2 seconds.
          </p>
        </AnimatedSection>

        <div className="relative mt-16">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-neon/30 via-neon/10 to-transparent sm:block" />

          <div className="space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.title} delay={i * 150}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Step number + icon */}
                  <div className="relative">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border border-neon/30 bg-neon/10 transition-all hover:scale-110 hover:border-neon/50 hover:shadow-[0_0_30px_rgba(0,255,102,0.2)]">
                      <step.icon className="h-7 w-7 text-neon" />
                    </div>
                    <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-neon text-[10px] font-bold text-black">
                      {step.num}
                    </span>
                  </div>

                  {/* Arrow (hidden on last item and mobile) */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block mt-6">
                      <ArrowDown className="h-5 w-5 text-neon/40 rotate-[-90deg]" />
                    </div>
                  )}

                  {/* Text */}
                  <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
