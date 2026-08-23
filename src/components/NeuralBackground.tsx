import { useEffect, useRef } from 'react';

/**
 * Lightweight neural-network canvas background: drifting nodes connected by
 * proximity lines, with occasional signal pulses traveling along edges. Pure
 * canvas — no external dependencies. Respects prefers-reduced-motion.
 */
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const LINK_DIST = 150;
    const COUNT = Math.min(70, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 18000));

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      pulse: number;
    }
    const nodes: Node[] = [];
    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.8,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    interface Signal {
      from: number;
      to: number;
      t: number;
      speed: number;
    }
    let signals: Signal[] = [];

    const onResize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      ctx.clearRect(0, 0, W, H);

      // Move nodes
      if (!reduced) {
        for (const n of nodes) {
          n.x += n.vx * (dt / 16);
          n.y += n.vy * (dt / 16);
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
          n.x = Math.max(0, Math.min(W, n.x));
          n.y = Math.max(0, Math.min(H, n.y));
          n.pulse += 0.02;
        }
      }

      // Draw links + spawn signals
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.32;
            ctx.strokeStyle = `rgba(52, 211, 153,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            if (!reduced && Math.random() < 0.0008 && signals.length < 6) {
              signals.push({ from: i, to: j, t: 0, speed: 0.008 + Math.random() * 0.01 });
            }
          }
        }
      }

      // Draw signals
      if (!reduced) {
        signals = signals.filter((s) => s.t <= 1);
        for (const s of signals) {
          s.t += s.speed * (dt / 16);
          const a = nodes[s.from];
          const b = nodes[s.to];
          const x = a.x + (b.x - a.x) * s.t;
          const y = a.y + (b.y - a.y) * s.t;
          ctx.fillStyle = `rgba(52, 211, 153,${0.9 * (1 - Math.abs(s.t - 0.5) * 2)})`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const glow = 0.5 + Math.sin(n.pulse) * 0.25;
        ctx.fillStyle = `rgba(52, 211, 153,${0.45 + glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(52, 211, 153,${0.08 * glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      aria-hidden="true"
    />
  );
}
