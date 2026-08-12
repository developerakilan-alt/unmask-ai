import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  max?: number;
  glow?: boolean;
}

/**
 * 3D perspective-tilt card that follows the mouse, with an optional
 * cursor-tracked spotlight glow. Falls back to a plain card when the user
 * prefers reduced motion.
 */
export default function TiltCard({ children, className = '', max = 7, glow = false }: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 160, damping: 18 });

  const glowBg = useTransform(
    [px, py] as MotionValue<number>[],
    (latest: number[]) =>
      `radial-gradient(340px circle at ${(latest[0] * 100).toFixed(1)}% ${(latest[1] * 100).toFixed(1)}%, rgba(0,255,136,0.10), transparent 62%)`,
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      className={`group relative ${className}`}
    >
      {glow && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glowBg as unknown as string }}
        />
      )}
      {children}
    </motion.div>
  );
}
