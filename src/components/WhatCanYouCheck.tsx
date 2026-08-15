import { AnimatedSection } from './AnimatedSection';
import { Sparkles, Eye, ShieldCheck, Activity, ShieldAlert, Fingerprint } from 'lucide-react';

const ASSET = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

const USE_CASES = [
  {
    title: 'AI-Generated Art',
    desc: 'Detect images created by DALL-E, Midjourney, Stable Diffusion, and other AI art generators.',
    img: ASSET('ai-art.svg'),
    icon: Sparkles,
  },
  {
    title: 'Deepfake Photos',
    desc: 'Identify face-swapped or AI-manipulated portraits used for deception.',
    img: ASSET('deepfake.svg'),
    icon: Eye,
  },
  {
    title: 'Stock & Product Images',
    desc: 'Verify if product photos or stock images are real photographs or AI renders.',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=350&fit=crop&auto=format',
    icon: ShieldCheck,
  },
  {
    title: 'Social Media Content',
    desc: 'Check viral images and memes for AI-generated or manipulated content.',
    img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=350&fit=crop&auto=format',
    icon: Activity,
  },
  {
    title: 'News & Journalism',
    desc: 'Verify the authenticity of images used in news articles and reports.',
    img: ASSET('news.svg'),
    icon: ShieldAlert,
  },
  {
    title: 'Academic & Research',
    desc: 'Validate image authenticity for papers, presentations, and research data.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=350&fit=crop&auto=format',
    icon: Fingerprint,
  },
];

export default function WhatCanYouCheck() {
  return (
    <section className="relative z-10 px-4 pb-28">
      <div className="mx-auto max-w-6xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">What Can You Check?</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">Unmask AI can analyze a wide range of image types for AI-generated content.</p>
        </AnimatedSection>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {USE_CASES.map((uc, i) => (
            <AnimatedSection key={uc.title} delay={i * 80}>
              <div className="glass group overflow-hidden rounded-2xl transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_30px_rgba(88,221,242,0.1)] hover:-translate-y-1">
                <div className="relative aspect-square w-full overflow-hidden sm:h-44 sm:aspect-auto">
                  <img
                    src={uc.img}
                    alt={uc.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-lg border border-neon/30 bg-black/40 backdrop-blur-sm sm:top-3 sm:right-3 sm:h-8 sm:w-8">
                    <uc.icon className="overlay-label-strong h-3 w-3 sm:h-4 sm:w-4" />
                  </span>
                </div>
                <div className="px-3 py-3 sm:px-5 sm:py-4">
                  <h3 className="text-sm font-bold text-white sm:text-lg">{uc.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-sm">{uc.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
