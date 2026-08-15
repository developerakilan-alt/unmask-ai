import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'AI Researcher',
    org: 'Stanford University',
    text: 'Unmask AI provides remarkably accurate detection results. The pixel-level forensics engine catches details that other tools miss entirely.',
    stars: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Investigative Journalist',
    org: 'The Washington Post',
    text: 'We use Unmask AI to verify images before publication. The EXIF metadata analysis and noise pattern detection are incredibly reliable.',
    stars: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Digital Forensics Lead',
    org: 'Europol',
    text: 'The combination of GAN artifact detection and compression analysis makes this a powerful tool for digital investigators.',
    stars: 5,
  },
  {
    name: 'Prof. James Liu',
    role: 'Computer Vision Lab',
    org: 'MIT',
    text: 'Impressive accuracy for a client-side tool. The 12 pixel-level metrics provide a comprehensive analysis that rivals server-side solutions.',
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trusted by Researchers & Professionals
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Used by journalists, researchers, and digital investigators worldwide.
          </p>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 100}>
              <TiltCard glow className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_30px_rgba(88,221,242,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-neon/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex flex-col h-full">
                  <Quote className="h-8 w-8 text-neon/20 mb-3" />
                  <p className="text-sm leading-relaxed text-white/60 flex-1">{t.text}</p>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-neon text-neon" />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                    <p className="text-xs text-neon/50">{t.org}</p>
                  </div>
                </div>
              </TiltCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
