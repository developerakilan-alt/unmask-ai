import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'detector', label: 'Detector' },
  { id: 'features', label: 'How it works' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'technology', label: 'Technology' },
  { id: 'report', label: 'Report' },
  { id: 'api', label: 'API' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

/**
 * Right-edge dot navigation for the landing page. Clicking a dot smooth
 * scrolls to that section (the anchor handler in SmoothScroll picks it up).
 */
export default function SectionDots() {
  const [active, setActive] = useState('detector');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const onScroll = () => {
      setVisible(window.scrollY > 120);
      let current = 'detector';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 180) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          aria-label="Section navigation"
          className="glass-pill fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 rounded-full p-2 lg:flex"
        >
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                title={s.label}
                aria-label={s.label}
                aria-current={isActive ? 'true' : undefined}
                className="group relative grid h-8 w-8 place-items-center"
              >
                {isActive && (
                  <motion.span
                    layoutId="section-dot"
                    className="absolute inset-0 rounded-full border border-neon/40 bg-neon/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`relative h-2 w-2 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-neon shadow-[0_0_10px_rgba(52, 211, 153,0.9)]' : 'bg-white/30 group-hover:bg-white/60'
                  }`}
                />
                <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg border border-white/10 bg-ink/80 px-2 py-1 text-[10px] font-medium text-white/70 opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                  {s.label}
                </span>
              </a>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
