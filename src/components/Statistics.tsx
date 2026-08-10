import { useEffect, useRef, useState } from 'react';
import { AnimatedSection } from './AnimatedSection';
import { Shield, Zap, Brain, Database } from 'lucide-react';

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

function AnimatedCounter({ target, suffix = '', prefix = '', decimals = 0, duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(eased * target);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}

const STATS = [
  { icon: Database, value: 1000, suffix: '+', prefix: '', label: 'Images Scanned', decimals: 0 },
  { icon: Shield, value: 72.8, suffix: '%', prefix: '', label: 'Accuracy', decimals: 1 },
  { icon: Zap, value: 2, suffix: 's', prefix: '<', label: 'Analysis Time', decimals: 0 },
  { icon: Brain, value: 15, suffix: '+', prefix: '', label: 'AI Models', decimals: 0 },
];

export default function Statistics() {
  return (
    <section className="relative z-10 px-4 pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {STATS.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 100}>
              <div className="glass group relative overflow-hidden rounded-2xl p-5 text-center transition-all duration-300 hover:border-neon/30 hover:shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-b from-neon/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl border border-neon/20 bg-neon/10">
                  <stat.icon className="h-5 w-5 text-neon" />
                </div>
                <p className="text-2xl font-bold text-white sm:text-3xl">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="mt-1 text-xs text-white/50">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
