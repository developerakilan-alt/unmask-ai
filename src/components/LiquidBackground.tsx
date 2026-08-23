import { useRef } from 'react';

/**
 * Fixed full-viewport "light through glass" background.
 *
 * Perf notes: no CSS `filter: blur()` on large layers (radial gradients already
 * fade to transparent, so blur filters are redundant) and no scroll-driven
 * parallax transforms. Every animated layer below only animates `transform`,
 * which stays on the compositor and never forces repaints while scrolling.
 */
export default function LiquidBackground() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="bg-app absolute inset-0" />
      <div className="glow-overlay absolute inset-0" />

      {/* Large soft light sources — plain radial gradients, no blur filter */}
      <div className="absolute -top-40 left-[4%] h-[44vw] w-[44vw] animate-blob-a bg-[radial-gradient(circle_at_30%_30%,rgba(209, 250, 229,0.38),rgba(52, 211, 153,0.1) 45%,transparent 70%)]" />
      <div className="absolute top-[22%] -right-[12%] h-[40vw] w-[40vw] animate-blob-b bg-[radial-gradient(circle_at_60%_40%,rgba(52, 211, 153,0.32),rgba(5, 150, 105,0.08) 50%,transparent 70%)]" />
      <div className="absolute bottom-[-10%] left-[16%] h-[38vw] w-[38vw] animate-blob-c bg-[radial-gradient(circle_at_50%_50%,rgba(5, 150, 105,0.45),rgba(52, 211, 153,0.06) 55%,transparent 72%)]" />

      {/* Translucent curved glass strips */}
      <div className="absolute top-[12%] left-[-8%] h-[22vw] w-[42vw] rotate-[-18deg] rounded-[100%_100%_0_0/120%_120%_0_0] bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent)]" />
      <div className="absolute bottom-[6%] right-[-10%] h-[20vw] w-[46vw] rotate-[16deg] rounded-[100%_100%_0_0/120%_120%_0_0] bg-[linear-gradient(180deg,rgba(209, 250, 229,0.08),transparent)]" />

      {/* Cyan light streak */}
      <div className="absolute left-[55%] top-[-10%] h-[60vh] w-px rotate-[24deg] bg-[linear-gradient(180deg,transparent,rgba(209, 250, 229,0.4),rgba(52, 211, 153,0.12),transparent)] opacity-50" />

      {/* Small floating spheres — small blur is cheap */}
      <div className="absolute left-[18%] top-[58%] h-40 w-40 animate-blob-b rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.32),rgba(52, 211, 153,0.06) 60%,transparent)] blur-lg" />
      <div className="absolute left-[74%] top-[38%] h-56 w-56 animate-blob-a rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.28),rgba(52, 211, 153,0.05) 62%,transparent)] blur-lg" />

      {/* Soft lens-flare dots */}
      <div className="absolute left-[34%] top-[16%] h-3 w-3 rounded-full bg-white/60" />
      <div className="absolute left-[38%] top-[18%] h-8 w-8 rounded-full bg-[radial-gradient(circle,rgba(209, 250, 229,0.5),transparent 70%)]" />
      <div className="absolute right-[30%] top-[24%] h-2 w-2 rounded-full bg-white/40" />

      <div className="vignette absolute inset-0" />
    </div>
  );
}
