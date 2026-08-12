import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  targetAlpha: number;
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const particles: Particle[] = [];
    const PARTICLE_COUNT = 36;
    const LINK_DIST = 110;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const createParticle = (): Particle => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.2 + 0.05,
      targetAlpha: Math.random() * 0.2 + 0.05,
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      if (!visible) return;

      ctx.clearRect(0, 0, w(), h());

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w();
        if (p.x > w()) p.x = 0;
        if (p.y < 0) p.y = h();
        if (p.y > h()) p.y = 0;

        p.alpha += (p.targetAlpha - p.alpha) * 0.02;
        if (Math.random() < 0.005) {
          p.targetAlpha = Math.random() * 0.25 + 0.04;
        }
      }

      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    // Only animate while the hero is on screen; stop when scrolled past so the
    // canvas never competes with page scrolling.
    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          cancelAnimationFrame(animId);
          animId = requestAnimationFrame(animate);
        }
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(canvas);

    animate();

    return () => {
      cancelAnimationFrame(animId);
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
