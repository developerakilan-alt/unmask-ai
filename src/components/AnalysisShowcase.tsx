import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import {
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Fingerprint,
  Sparkles,
  FileText,
  Download,
  Share2,
} from 'lucide-react';

const FORENSICS = [
  { icon: Activity, label: 'Noise Pattern', status: 'checked' },
  { icon: Layers, label: 'Compression Grid', status: 'checked' },
  { icon: Fingerprint, label: 'Sensor Fingerprint', status: 'warn' },
  { icon: Sparkles, label: 'GAN / Diffusion Signatures', status: 'checked' },
];

export function AnalysisShowcase() {
  return (
    <section id="analysis" className="relative z-10 px-4 pb-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Analysis Technology
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/55">
            Our forensic engine runs parallel pixel-level tests to surface every signal of AI generation.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={120}>
          {/* Large glass container */}
          <TiltCard max={4} glow className="mt-12 rounded-[36px]">
            <div className="glass relative overflow-hidden rounded-[36px]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
            <div className="pointer-events-none absolute -top-20 left-1/2 h-44 w-[70%] -translate-x-1/2 rounded-[100%] bg-white/10 blur-3xl" />

            <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:gap-12">
              {/* Left — AI analysis pipeline */}
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                    <ScanSearch className="h-5 w-5 text-neon" />
                  </span>
                  <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                </div>

                <ul className="mt-6 space-y-3">
                  {FORENSICS.map((f) => (
                    <li
                      key={f.label}
                      className="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:border-white/50"
                    >
                      <f.icon className="h-4 w-4 shrink-0 text-neon" />
                      <span className="flex-1 text-sm font-medium text-white/80">{f.label}</span>
                      {f.status === 'checked' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-neon" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — inner glass panel with forensic results */}
              <div className="flex">
                <div className="glass-soft relative w-full overflow-hidden rounded-[28px] p-6">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Forensic Results</p>
                    <span className="glass-pill rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                      Ensemble v3
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-end justify-between">
                      <p className="text-sm text-white/60">AI Probability</p>
                      <p className="text-3xl font-bold text-neon" style={{ textShadow: '0 0 20px rgba(88,221,242,0.4)' }}>
                        72.8%
                      </p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/15 bg-ink/50">
                      <div className="h-full w-[72.8%] rounded-full bg-gradient-to-r from-neon/50 via-neon to-neon-200 shadow-[0_0_14px_rgba(88,221,242,0.7)]" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <div className="glass-soft flex items-center justify-between rounded-xl px-4 py-3">
                      <span className="text-xs text-white/60">Metadata Analysis</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-neon">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Consistent
                      </span>
                    </div>
                    <div className="glass-soft flex items-center justify-between rounded-xl px-4 py-3">
                      <span className="text-xs text-white/60">Texture Analysis</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Suspicious
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-ink/30 px-4 py-3">
                    <span className="text-xs text-white/60">Detection Model</span>
                    <span className="text-xs font-semibold text-white">ResNet · Confidence 91.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </TiltCard>
        </AnimatedSection>
      </div>
    </section>
  );
}

export function ReportPreview() {
  return (
    <section id="report" className="relative z-10 px-4 pb-20">
      <div className="mx-auto max-w-5xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Authenticity Report
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/55">
            Every analysis produces a shareable forensic report you can download, verify, and collaborate on.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={120}>
          <div className="glass relative mt-12 overflow-hidden rounded-[36px]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />

            <div className="relative p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                    <FileText className="h-5 w-5 text-neon" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Authenticity Report</h3>
                    <p className="text-xs text-white/50">Report ID · UA-9F2A-3B11</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button className="glass-btn h-10 px-5 text-xs font-bold">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button className="glass-btn h-10 px-5 text-xs font-bold">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-[240px_1fr]">
                {/* Image thumbnail */}
                <div className="glass-soft relative flex items-center justify-center overflow-hidden rounded-[24px] p-4">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />
                  <div className="relative grid aspect-square w-full place-items-center">
                    <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_120deg,rgba(88,221,242,0.35),rgba(3,23,46,0.2),rgba(88,221,242,0.35),rgba(3,23,46,0.2),rgba(88,221,242,0.35))] blur-md" />
                    <div className="relative grid h-28 w-28 place-items-center rounded-2xl border border-white/40 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_30px_rgba(88,221,242,0.25)]">
                      <ScanSearch className="h-10 w-10 text-neon" />
                    </div>
                    <span className="glass-pill absolute bottom-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neon">
                      Image Analyzed
                    </span>
                  </div>
                </div>

                {/* Report body — glass inside glass */}
                <div className="space-y-4">
                  <div className="glass-soft rounded-[24px] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Verdict</p>
                      <span className="glass-btn-primary h-9 rounded-full px-4 text-xs font-bold">
                        Likely AI-Generated
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-end justify-between">
                        <p className="text-xs text-white/55">AI Probability</p>
                        <p className="text-xl font-bold text-neon">72.8%</p>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/15 bg-ink/50">
                        <div className="h-full w-[72.8%] rounded-full bg-gradient-to-r from-neon/50 via-neon to-neon-200 shadow-[0_0_12px_rgba(88,221,242,0.7)]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="glass-soft rounded-[24px] p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Metadata</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-neon">
                        <CheckCircle2 className="h-4 w-4" /> Consistent
                      </p>
                      <p className="mt-1 text-xs text-white/45">Camera &amp; EXIF records intact</p>
                    </div>
                    <div className="glass-soft rounded-[24px] p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Texture</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-400">
                        <AlertTriangle className="h-4 w-4" /> Suspicious
                      </p>
                      <p className="mt-1 text-xs text-white/45">Diffusion grid artifacts detected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
