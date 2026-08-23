import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={scrollTop}
          aria-label="Back to top"
          data-no-ripple="true"
          className="glass-btn fixed bottom-6 right-6 z-[60] grid h-12 w-12 place-items-center rounded-full shadow-[0_0_24px_rgba(52, 211, 153,0.3)] hover:shadow-[0_0_36px_rgba(52, 211, 153,0.5)]"
        >
          <ArrowUp className="h-5 w-5 text-neon" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
