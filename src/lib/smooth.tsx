import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

/**
 * Lenis-powered buttery smooth scrolling. Respects prefers-reduced-motion.
 * Native anchor links (#section) are intercepted and scrolled smoothly with
 * a navbar offset; hash-route links (#/dashboard) are left untouched.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.length < 2 || href.startsWith('#/')) return;
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -96 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
