import { useRef, type MouseEvent, type ReactNode } from 'react';

const MAX_TILT = 10;

interface LinkProps {
  children: ReactNode;
  href: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  'aria-label'?: string;
  target?: string;
  rel?: string;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}

/**
 * Liquid glassmorphism nav items. A subtle 3D tilt follows the cursor and a
 * radial "liquid" sheen + border glow track the pointer position, so every
 * button reacts like a blob of glass to mouse movement.
 */
export function LiquidNavLink({ children, href, onClick, className = '', active, 'aria-label': ariaLabel, target, rel }: LinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = (e.clientY - r.top) / Math.max(r.height, 1);
    el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * MAX_TILT).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * MAX_TILT).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      aria-label={ariaLabel}
      target={target}
      rel={rel}
      className={`liquid-nav ${active ? 'liquid-nav-active' : ''} ${className}`}
    >
      {children}
    </a>
  );
}

export function LiquidNavButton({ children, onClick, className = '', active, disabled, title, 'aria-label': ariaLabel }: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = (e.clientY - r.top) / Math.max(r.height, 1);
    el.style.setProperty('--mx', `${(x * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(2)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * MAX_TILT).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * MAX_TILT).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`liquid-nav ${active ? 'liquid-nav-active' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
