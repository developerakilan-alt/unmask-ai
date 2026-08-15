import { Children, useEffect, useState, type ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}

/**
 * Seamless horizontal auto-scrolling marquee. Content is duplicated once
 * and the track translates -50% for an infinite, gapless loop.
 */
export default function Marquee({ children, reverse = false, duration = 36, className = '' }: MarqueeProps) {
  const items = Children.toArray(children);
  return (
    <div
      className={`relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] ${className}`}
    >
      <div
        className="flex w-max shrink-0 animate-marquee items-center"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        <div className="flex items-center gap-4 pr-4">{items}</div>
        <div className="flex items-center gap-4 pr-4" aria-hidden>
          {items}
        </div>
      </div>
    </div>
  );
}

interface VelocityMarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  /** Duration at idle scroll speed. */
  baseDuration?: number;
  className?: string;
}

/**
 * Marquee whose speed reacts to page scroll velocity — it glides while the
 * user scrolls fast and eases back to a slow crawl when idle. Changing the
 * animation duration mid-flight only alters the playback rate (the loop stays
 * gapless because the track transform is unchanged).
 */
export function VelocityMarquee({ children, reverse = false, baseDuration = 40, className = '' }: VelocityMarqueeProps) {
  const [duration, setDuration] = useState(baseDuration);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let lastY = window.scrollY;

    const measure = () => {
      const speed = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      const t = Math.min(1, speed / 90);
      // idle: 1.6x base (slow), fast scroll: 0.35x base (quick glide).
      setDuration(baseDuration * (1.6 - 1.25 * t));
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [baseDuration]);

  return (
    <Marquee duration={duration} reverse={reverse} className={className}>
      {children}
    </Marquee>
  );
}
