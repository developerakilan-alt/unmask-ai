import { useEffect, useRef, useState } from 'react';

interface NavOrbProps {
  size?: number;
}

/**
 * Tiny glowing 3D orb for the navbar brand — three.js is lazy-loaded so it
 * never blocks first paint. Falls back to a pure-CSS orb when WebGL is
 * unavailable; renders a single static frame under prefers-reduced-motion.
 */
export default function NavOrb({ size = 30 }: NavOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import('three');
        if (disposed || !canvasRef.current) return;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size, size, false);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 10);
        camera.position.z = 3.4;

        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.95, 48, 48),
          new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x0e9f7a,
            emissiveIntensity: 0.55,
            roughness: 0.22,
            metalness: 0.15,
          }),
        );
        scene.add(core);

        // Faint glassy halo shell around the core
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 32, 32),
          new THREE.MeshBasicMaterial({
            color: 0x6ee7b7,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        scene.add(halo);

        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const key = new THREE.DirectionalLight(0xffffff, 1.6);
        key.position.set(-2, 2.4, 3);
        scene.add(key);
        const rim = new THREE.PointLight(0x34d399, 5, 8);
        rim.position.set(2.2, -1.6, 1.4);
        scene.add(rim);

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        const clock = new THREE.Clock();

        const tick = () => {
          const t = clock.getElapsedTime();
          core.rotation.y = t * 0.35;
          core.rotation.x = Math.sin(t * 0.4) * 0.18;
          core.position.y = Math.sin(t * 1.1) * 0.07;
          halo.position.y = core.position.y;
          rim.intensity = 4.4 + Math.sin(t * 2.1) * 1.1;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };

        if (reduceMotion) renderer.render(scene, camera);
        else raf = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(raf);
          renderer.dispose();
          core.geometry.dispose();
          (core.material as THREE.Material).dispose();
          halo.geometry.dispose();
          (halo.material as THREE.Material).dispose();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [size]);

  if (failed) {
    return <span className="nav-orb-fallback" style={{ width: size, height: size }} aria-hidden="true" />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 drop-shadow-[0_0_10px_rgba(110,231,183,0.45)]"
      aria-hidden="true"
    />
  );
}
