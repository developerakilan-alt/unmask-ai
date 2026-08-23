import { Upload, ScanLine, ShieldCheck, Layers, ArrowRight } from 'lucide-react';
import BatchPanel from './BatchPanel';
import Statistics from './Statistics';
import Footer from './Footer';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload an image',
    text: 'Drag & drop, click to browse, or paste straight from your clipboard (Ctrl+V) on the home page.',
  },
  {
    icon: ScanLine,
    title: 'Run the analysis',
    text: 'Press Analyze — the forensic engine inspects metadata, noise patterns, compression and AI signatures in seconds.',
  },
  {
    icon: ShieldCheck,
    title: 'Read the verdict',
    text: 'Get a clear real-or-AI score with a full breakdown you can view, share, or download as a report.',
  },
  {
    icon: Layers,
    title: 'Scale up',
    text: 'Use the batch scanner above to check up to 10 images at once — perfect for feeds, galleries and moderation queues.',
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Page intro */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-2 pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">Features</p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Everything Unmask AI can do
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
          Scan single images or whole batches, understand every verdict and learn how the detector works — all in one place.
        </p>
      </section>

      {/* Batch scanner */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-12">
        <BatchPanel />
      </section>

      {/* How to use this website */}
      <section id="how-to-use" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Getting started</p>
        <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          How to use this website
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="glass-soft group relative overflow-hidden rounded-[24px] p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50" />
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-neon/40 bg-neon/10 shadow-[0_0_18px_rgba(52,211,153,0.25)]">
                  <step.icon className="h-5 w-5 text-neon" strokeWidth={2} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.text}</p>
            </div>
          ))}
        </div>
        <a
          href="#/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-neon transition-colors hover:text-neon-200"
        >
          Try it now — analyze an image
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* Platform stats */}
      <Statistics />

      {/* Full-bleed footer lives on this page */}
      <Footer />
    </>
  );
}
