import { Children, type ReactNode } from 'react';

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
