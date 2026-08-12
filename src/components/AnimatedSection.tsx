import { type ReactNode, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * Scroll-triggered section reveal. Renders content immediately and fully
 * visible when the environment cannot reliably drive a scroll reveal
 * (reduced-motion preference or no IntersectionObserver support), so
 * sections are never left invisible after mount.
 */
export function AnimatedSection({ children, className = '', delay = 0, direction = 'up' }: Props) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsIo = typeof IntersectionObserver !== 'undefined';

  if (reduce || !supportsIo) return <div className={className}>{children}</div>;

  const offset = 30;
  const initial = {
    opacity: 0,
    y: direction === 'up' ? offset : direction === 'down' ? -offset : 0,
    x: direction === 'left' ? offset : direction === 'right' ? -offset : 0,
  };

  return (
    <Reveal initial={initial} delay={delay} className={className}>
      {children}
    </Reveal>
  );
}

function Reveal({ children, className, initial, delay }: Props & { initial: { opacity: number; x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
