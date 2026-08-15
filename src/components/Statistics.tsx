import { useEffect, useRef, useState } from 'react';
import { StaggerGroup } from './AnimatedSection';
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
      <div className="mx-auto max-w-5xl">
        <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          {STATS.map((stat) => (
            <div key={stat.label} className="glass group relative overflow-hidden rounded-[24px] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-white/60 hover:shadow-[0_16px_44px_rgba(2,14,28,0.5),0_0_28px_rgba(88,221,242,0.2)] sm:p-6">
              {/* glass top highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />
              <div className="pointer-events-none absolute -top-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-[100%] bg-white/10 blur-xl" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
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
              <p className="mt-1 text-xs uppercase tracking-wider text-white/55">{stat.label}</p>
            </div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
