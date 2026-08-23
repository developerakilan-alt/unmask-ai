import { useEffect, useRef } from 'react';

type FlowScene = {
  render(scroll: number, mouse: { x: number; y: number }): void;
  setPointer(active: boolean): void;
  resize(): void;
  dispose(): void;
};

const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function FlowWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let raf = 0;
    let scene: FlowScene | null = null;
    let pausedByTheme = false;
    let pausedByVisibility = false;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scrollTarget = { v: 0 };
    const scrollSmooth = { v: 0 };
    const scrollCurrent = { v: 0 };
    const mouseTarget = { x: 0, y: 0 };
    const mouse = { x: 0, y: 0 };

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget.v = max > 0 ? clamp01(window.scrollY / max) : 0;
    };

    const onScroll = () => readScroll();
    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseTarget.y = -((e.clientY / window.innerHeight) * 2 - 1);
      scene?.setPointer(true);
    };
    const onMouseOut = () => scene?.setPointer(false);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!scene || pausedByTheme || pausedByVisibility) return;

      scrollSmooth.v = Lerp(scrollSmooth.v, scrollTarget.v, 0.1);
      scrollCurrent.v = Lerp(scrollCurrent.v, scrollSmooth.v, 0.06);
      mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06);
      mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06);
      scene.render(scrollCurrent.v, mouse);
    };

    const renderOnce = () => {
      if (!scene || pausedByTheme) return;
      scrollCurrent.v = scrollTarget.v;
      scene.render(scrollCurrent.v, mouse);
    };

    const applyTheme = () => {
      const light = document.documentElement.classList.contains('light');
      canvas.classList.toggle('flowwave-off', light);
      const wasPaused = pausedByTheme;
      pausedByTheme = light;
      if (wasPaused && !light && reduceMotion) renderOnce();
    };

    const themeObserver = new MutationObserver(applyTheme);

    const onVisibility = () => {
      pausedByVisibility = document.hidden;
    };

    const onResize = () => {
      readScroll();
      scene?.resize();
      if (reduceMotion) renderOnce();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    (async () => {
      const mod = await import('../lib/flowScene');
      if (cancelled || !canvas) return;
      scene = mod.createFlowScene(canvas, { staticMode: reduceMotion });
      scene.resize();
      readScroll();

      if (!reduceMotion) {
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mouseout', onMouseOut);
        raf = requestAnimationFrame(frame);
      }

      applyTheme();
      document.addEventListener('visibilitychange', onVisibility);
      if (reduceMotion) renderOnce();
    })();

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('resize', onResize);
      scene?.dispose();
      scene = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="flowwave-bg pointer-events-none" aria-hidden="true" />;
}
