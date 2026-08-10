import { AnimatedSection } from './AnimatedSection';
import { ArrowRight, ShieldAlert, Target, Lightbulb } from 'lucide-react';

const STEPS = [
  {
    icon: ShieldAlert,
    title: 'AI Image Detected',
    desc: 'Our engine identifies synthetic content with high confidence.',
    visual: (
      <div className="h-16 w-full rounded-lg bg-gradient-to-r from-danger/20 to-danger/5 border border-danger/20 flex items-center px-4">
        <span className="text-xs font-mono text-danger/70">{'>'} AI-GENERATED [98.2% confidence]</span>
      </div>
    ),
  },
  {
    icon: Target,
    title: 'Highlighted Regions',
    desc: 'Suspicious areas are precisely mapped with forensic heatmaps.',
    visual: (
      <div className="h-16 w-full rounded-lg bg-black/40 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon/10 via-transparent to-danger/20" />
        <div className="absolute top-2 right-3 h-8 w-8 rounded border-2 border-danger/60 border-dashed" />
        <div className="absolute bottom-2 left-4 h-6 w-12 rounded border-2 border-danger/60 border-dashed" />
        <span className="absolute bottom-1 right-2 text-[9px] text-danger/50 font-mono">anomaly_map.png</span>
      </div>
    ),
  },
  {
    icon: Lightbulb,
    title: 'Explanation Provided',
    desc: 'Detailed breakdown of why the image was flagged as AI-generated.',
    visual: (
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full w-[85%] rounded-full bg-danger/60" />
        </div>
        <div className="h-2 w-3/4 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full w-[60%] rounded-full bg-danger/40" />
        </div>
        <div className="h-2 w-1/2 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full w-[40%] rounded-full bg-danger/30" />
        </div>
      </div>
    ),
  },
];

export default function BeforeAfterDemo() {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            See It In Action
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            From detection to explanation in real-time.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <AnimatedSection key={step.title} delay={i * 150}>
              <div className="glass group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_30px_rgba(0,255,102,0.1)] h-full flex flex-col">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon/20 bg-neon/10 transition-all group-hover:scale-110">
                    <step.icon className="h-5 w-5 text-neon" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neon/60">Step {i + 1}</span>
                    {i < STEPS.length - 1 && (
                      <ArrowRight className="hidden sm:block h-3 w-3 text-white/20" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-white/50">{step.desc}</p>
                <div className="mt-4 flex-1">{step.visual}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
