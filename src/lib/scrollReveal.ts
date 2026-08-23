import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP ScrollTrigger choreography for the home page: every top-level block in
 * <main> (except the navbar) fades and rises into view as it enters the
 * viewport, once. Runs through gsap.context so cleanup fully reverts inline
 * styles and kills its triggers. No-op for prefers-reduced-motion users.
 */
export function initScrollReveals(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  if (!document.getElementById('main')) return () => {};

  const ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('#main > *:not(header)').forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 56 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      );
    });
  });

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);
  // Late content (fonts, lazy images) shifts trigger positions.
  const t1 = window.setTimeout(refresh, 900);
  const t2 = window.setTimeout(refresh, 2500);
  if (document.readyState === 'complete') window.setTimeout(refresh, 300);

  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.removeEventListener('load', refresh);
    ctx.revert();
  };
}
