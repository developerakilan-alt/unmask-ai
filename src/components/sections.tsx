import { useState, type ReactNode } from 'react';
import {
  Activity,
  Layers,
  ScanLine,
  Sparkles,
  Gauge,
  Fingerprint,
  Eye,
  Grid3x3,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  FileImage,
  Camera,
  Lightbulb,
  Image as ImageIcon,
  Binary,
  Boxes,
  Brain,
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Code2,
  Terminal,
} from 'lucide-react';
import { useReveal, useCountUp } from '../lib/hooks';

/* ---------- Statistics with animated counters ---------- */

const STATS = [
  { value: 1_240_000, suffix: '+', label: 'Images Scanned', format: 'm' },
  { value: 98.9, suffix: '%', label: 'Accuracy', decimals: 1 },
  { value: 1.8, suffix: 's', label: 'Avg Analysis', decimals: 1 },
  { value: 15, suffix: '', label: 'AI Models' },
];

function StatCard({ stat, active }: { stat: (typeof STATS)[number]; active: boolean }) {
  const v = useCountUp(stat.value, active, 1800);
  const num =
    stat.value >= 1_000_000
      ? `${(v / 1_000_000).toFixed(2)}M`
      : stat.decimals
        ? v.toFixed(stat.decimals)
        : Math.round(v).toLocaleString();
  return (
    <div className="glass rounded-2xl px-4 py-6 text-center">
      <p className="text-3xl font-bold text-white sm:text-4xl">
        <span className="neon-text">{num}</span>
        <span className="text-white/60">{stat.suffix}</span>
      </p>
      <p className="mt-1.5 text-xs uppercase tracking-wider text-white/45">{stat.label}</p>
    </div>
  );
}

export function StatsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-20" id="stats">
      <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} active={visible} />
        ))}
      </div>
    </section>
  );
}

/* ---------- Detection Technologies ---------- */

const TECH = [
  { icon: FileImage, title: 'EXIF Metadata', desc: 'Detect missing or manipulated camera metadata, software fingerprints, and editing trails.' },
  { icon: Activity, title: 'Noise Patterns', desc: 'Sensor-fingerprint comparison reveals inconsistencies invisible to the human eye.' },
  { icon: Layers, title: 'Compression Analysis', desc: 'Identify recompression artifacts and mismatched quantization tables.' },
  { icon: Sparkles, title: 'GAN Artifact Detection', desc: 'Spot diffusion signatures, spectral irregularities, and generator fingerprints.' },
  { icon: Lightbulb, title: 'Lighting Consistency', desc: 'Analyze light direction, highlights, and shading coherence across the scene.' },
  { icon: ImageIcon, title: 'Shadow Analysis', desc: 'Verify geometric consistency between objects and the shadows they cast.' },
  { icon: ScanLine, title: 'Pixel-Level Forensics', desc: 'Per-pixel statistical tests surface cloning, splicing, and inpainting.' },
  { icon: Fingerprint, title: 'Camera Fingerprinting', desc: 'PRNU sensor noise matching links images to specific capture devices.' },
];

export function TechSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24" id="technology">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Detection Methods"
          title="How we tell real from synthetic"
          subtitle="Eight forensic techniques run in parallel, each scrutinizing a different signal of authenticity."
        />
        <div ref={ref} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TECH.map((t, i) => (
            <div
              key={t.title}
              className={`glass group rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 hover:border-neon/30 hover:shadow-[0_0_28px_rgba(88,221,242,0.15)] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon/25 bg-neon/10 text-neon transition-transform group-hover:scale-110">
                <t.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why Choose Us ---------- */

const WHY = [
  { icon: Grid3x3, label: 'Pixel-Level Analysis' },
  { icon: FileImage, label: 'EXIF Verification' },
  { icon: Eye, label: 'Deepfake Detection' },
  { icon: Sparkles, label: 'Diffusion Artifact Detection' },
  { icon: Fingerprint, label: 'Camera Fingerprinting' },
  { icon: Zap, label: 'Fast Processing (<2s)' },
  { icon: Lock, label: 'Privacy First — No Images Stored' },
  { icon: ShieldCheck, label: 'Multi-Model Ensemble' },
];

export function WhyUsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24" id="why">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="Built for trust at every pixel"
          subtitle="Every analysis runs entirely in your browser. Your images never leave your device."
        />
        <div ref={ref} className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => (
            <div
              key={w.label}
              className={`glass-soft flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-500 hover:border-neon/25 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon/25 bg-neon/10 text-neon">
                <w.icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-sm font-medium text-white/85">{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Supported Models ---------- */

const MODELS = [
  { icon: Brain, name: 'Vision Transformer', tag: 'ViT' },
  { icon: Cpu, name: 'EfficientNet', tag: 'B7' },
  { icon: Boxes, name: 'CLIP', tag: 'Zero-shot' },
  { icon: Binary, name: 'ResNet', tag: '50' },
  { icon: Gauge, name: 'CNN Ensemble', tag: 'Custom' },
];

export function ModelsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24" id="models">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Powered By"
          title="A multi-model detection ensemble"
          subtitle="Five specialized models vote on every image, weighted by per-class confidence."
        />
        <div ref={ref} className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {MODELS.map((m, i) => (
            <div
              key={m.name}
              className={`glass flex flex-col items-center rounded-2xl px-4 py-6 text-center transition-all duration-500 hover:-translate-y-1 hover:border-neon/30 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-neon/25 bg-neon/10 text-neon">
                <m.icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <p className="mt-3 text-sm font-bold text-white">{m.name}</p>
              <p className="mt-0.5 text-xs text-white/40">{m.tag}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */

const TESTIMONIALS = [
  {
    quote:
      'Unmask AI flagged a synthetic press photo in seconds — the noise analysis caught what three of us missed.',
    name: 'Dr. Lena Ortiz',
    role: 'Digital Forensics, Verified News Lab',
  },
  {
    quote:
      'We integrated the detection pipeline into our journalism workflow. The per-pixel heatmap is genuinely useful.',
    name: 'Marcus Webb',
    role: 'Investigative Editor, The Sentinel',
  },
  {
    quote:
      'For academic integrity, this is the fastest tool we have found. Students cannot slip generated images past it.',
    name: 'Prof. Aiko Tanaka',
    role: 'Computer Science, TU Delft',
  },
];

export function TestimonialsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24" id="testimonials">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Testimonials"
          title="Trusted by investigators, journalists & researchers"
        />
        <div ref={ref} className="mt-12 grid gap-4 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`glass rounded-2xl p-6 transition-all duration-500 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex gap-0.5 text-neon">
                {Array.from({ length: 5 }).map((_, k) => (
                  <span key={k} className="text-sm">★</span>
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-white/75">"{t.quote}"</blockquote>
              <figcaption className="mt-4 border-t border-white/5 pt-3">
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-white/45">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- API Preview ---------- */

export function ApiSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24" id="api">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Developer API"
          title="Bring detection to your product"
          subtitle="A single POST endpoint returns a verdict, confidence, and heatmap URL."
        />
        <div ref={ref} className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className={`glass overflow-hidden rounded-2xl transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <Terminal className="h-4 w-4 text-neon" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Request</span>
            </div>
            <pre className="code-block overflow-x-auto p-4 text-xs leading-relaxed text-neon-100">
{`POST /v1/analyze
Authorization: Bearer ua_live_••••
Content-Type: multipart/form-data

curl https://api.unmask.ai/v1/analyze \\
  -H "Authorization: Bearer $KEY" \\
  -F "image=@photo.jpg"`}
            </pre>
          </div>
          <div className={`glass overflow-hidden rounded-2xl transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '100ms' }}>
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <Code2 className="h-4 w-4 text-neon" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Response</span>
            </div>
            <pre className="code-block overflow-x-auto p-4 text-xs leading-relaxed text-neon-100">
{`{
  "prediction": "real",
  "confidence": 0.989,
  "heatmap_url": "https://.../ua-9f2a.png",
  "metadata": { "exif": "present", "model": "ensemble-v3" },
  "report_id": "UA-9f2a-3b11"
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  {
    q: 'Does Unmask AI store my images?',
    a: 'No. Every analysis runs entirely in your browser using on-device models. Your images are never uploaded to a server.',
  },
  {
    q: 'How accurate is the detection?',
    a: 'Our ensemble achieves 98.9% accuracy on standard benchmarks, but no detector is perfect. Always treat the verdict as a strong signal, not absolute proof.',
  },
  {
    q: 'What image formats are supported?',
    a: 'JPG, PNG, and WEBP up to 20MB. Larger images are downsampled before analysis to keep processing under two seconds.',
  },
  {
    q: 'Can it detect all AI generators?',
    a: 'We continuously train against outputs from DALL-E, Midjourney, Stable Diffusion, SDXL, and newer diffusion models. Detection of entirely novel generators may lag until samples are available.',
  },
  {
    q: 'Is there an API for developers?',
    a: 'Yes — a REST API is in private beta. The endpoint above shows the request/response shape. Join the waitlist for early access.',
  },
];

export function FaqSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-4 pb-24" id="faq">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div ref={ref} className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`glass rounded-2xl transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-white">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-neon transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-white/55">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

export function CtaSection({ onUpload }: { onUpload: () => void }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="px-4 pb-24">
      <div ref={ref} className={`mx-auto max-w-3xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="glass rounded-3xl px-6 py-12 text-center sm:px-12">
          <Camera className="mx-auto h-10 w-10 text-neon" strokeWidth={1.8} />
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Verify any image in seconds
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            No signup required. Your images stay on your device.
          </p>
          <button
            onClick={onUpload}
            className="liquid-btn mt-7 inline-flex items-center gap-2.5 rounded-2xl bg-neon px-7 py-3.5 text-base font-bold text-black transition-all hover:shadow-[0_0_32px_rgba(88,221,242,0.45)]"
          >
            Analyze an Image
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

const FOOTER_LINKS: { heading: string; links: string[] }[] = [
  { heading: 'Product', links: ['Features', 'Technology', 'API', 'Pricing', 'Docs'] },
  { heading: 'Company', links: ['About', 'Research', 'Blog', 'Careers', 'Contact'] },
  { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Responsible AI'] },
];

const SOCIAL = [
  { icon: Github, label: 'GitHub' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Mail, label: 'Email' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 pb-10 pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/40 bg-neon/10">
                <ScanLine className="h-4 w-4 text-neon" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">Unmask AI</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/45">
              On-device AI image forensics. Verify authenticity without sacrificing privacy.
            </p>
            <div className="mt-4 flex gap-2.5">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-neon/30 hover:text-neon"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-white/55 transition-colors hover:text-neon">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Unmask AI. All rights reserved.</p>
          <p>Built for transparency in the synthetic media era.</p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- shared heading ---------- */

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon/80">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-white/50">{subtitle}</p>}
    </div>
  );
}

/* re-export for convenience */
export { SectionHeading };
export type { ReactNode };
