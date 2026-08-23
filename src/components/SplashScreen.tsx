import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'unmask-splash-seen';
const SHOW_MS = 2600;

const TAGLINE = 'Unmasking reality…';

/**
 * Full-screen branded splash shown once per browser session on first load.
 * Logo reveal + ring pulse + letter-by-letter tagline, then fades out.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;

    let showTimer = 0;
    let hideTimer = 0;
    showTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
      setVisible(true);
    }, 40);
    hideTimer = window.setTimeout(() => setVisible(false), SHOW_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-[#065f46] via-[#047857] to-[#010b06]"
        >
          <div className="pointer-events-none absolute inset-0 glow-overlay" />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 -m-4 animate-pulse-glow rounded-full" />
            <span className="absolute inset-0 -m-5 animate-spin-slow rounded-full border border-neon/30" />
            <span className="absolute inset-0 -m-9 animate-spin-slow rounded-full border border-dashed border-neon/20 [animation-duration:8s]" />
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Unmask AI"
              className="relative h-24 w-24 rounded-3xl object-contain ring-1 ring-inset ring-white/40 shadow-[0_0_60px_rgba(52, 211, 153,0.45)]"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-6 text-lg font-bold tracking-[0.35em] text-white sm:text-xl"
          >
            UNMASK <span className="neon-text">AI</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="mt-4 flex overflow-hidden text-sm font-medium tracking-[0.3em] text-white/60"
            aria-label={TAGLINE}
          >
            {TAGLINE.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.9 + i * 0.045, ease: 'easeOut' }}
                className="inline-block"
              >
                {ch === ' ' ? '\u00A0' : ch}
              </motion.span>
            ))}
          </motion.p>

          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.8, ease: 'easeInOut' }}
            className="mt-8 h-0.5 w-40 origin-center rounded-full bg-gradient-to-r from-transparent via-neon to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
