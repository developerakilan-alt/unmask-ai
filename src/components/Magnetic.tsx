import { useRef, type ReactNode, type MouseEvent } from 'react';

interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

/**
 * Wraps a child and pulls it toward the cursor while hovered, springing back
 * smoothly on leave. Disabled for prefers-reduced-motion.
 */
export default function Magnetic({ children, strength = 0.35, className = '' }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'transform 0.08s linear';
    el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  };

  const onEnter = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = '';
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      className={`inline-block will-change-transform ${className}`}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
