import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Fixed full-viewport background with parallax liquid blobs. Each blob drifts
 * at a different speed as the user scrolls, adding depth to every page.
 *
 * Blobs are large blurred layers; only their transforms change per frame so
 * they animate on the compositor and stay cheap to scroll.
 */
export default function LiquidBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const yA = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const yB = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const yC = useTransform(scrollYProgress, [0, 1], ['0%', '26%']);

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-0">
      <div className="bg-app absolute inset-0" />
      <div className="glow-overlay absolute inset-0" />
      <motion.div
        style={reduce ? undefined : { y: yA }}
        className="absolute -top-32 left-[8%] h-[34vw] w-[34vw] animate-blob-a bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,102,0.18),rgba(0,255,102,0)_70%)] opacity-60 blur-2xl"
      />
      <motion.div
        style={reduce ? undefined : { y: yB }}
        className="absolute top-[30%] -right-[10%] h-[32vw] w-[32vw] animate-blob-b bg-[radial-gradient(circle_at_60%_40%,rgba(0,200,90,0.14),rgba(0,255,102,0)_70%)] opacity-50 blur-2xl"
      />
      <motion.div
        style={reduce ? undefined : { y: yC }}
        className="absolute bottom-[-12%] left-[20%] h-[30vw] w-[30vw] animate-blob-c bg-[radial-gradient(circle_at_50%_50%,rgba(0,120,60,0.12),rgba(0,255,102,0)_70%)] opacity-40 blur-2xl"
      />
      <div className="vignette absolute inset-0" />
    </div>
  );
}
