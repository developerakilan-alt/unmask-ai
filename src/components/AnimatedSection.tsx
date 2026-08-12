import { type ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

/**
 * Section reveal that NEVER hides its content.
 *
 * Content is always rendered at full opacity, so nothing can appear missing
 * or delayed. Only a subtle slide animation is applied when the section
 * scrolls into view (or after a short safety timer), purely as polish.
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
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setForced(true), 900);
    return () => clearTimeout(t);
  }, []);

  const visible = inView || forced;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ ...initial, opacity: 1 }}
      animate={visible ? { opacity: 1, x: 0, y: 0 } : { ...initial, opacity: 1 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
