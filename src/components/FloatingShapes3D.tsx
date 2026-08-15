import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FloatingShapes3DProps {
  className?: string;
}

interface Shape {
  mesh: THREE.Mesh;
  baseY: number;
  phase: number;
  bobSpeed: number;
  spinX: number;
  spinY: number;
}

/**
 * Full-viewport Three.js scene of floating, slowly rotating neon wireframe
 * shapes (icosahedrons, torus knots, octahedrons…). The whole group parallaxes
 * with the mouse and drifts gently with scroll. Kept very subtle (low opacity)
 * so it sits behind the content as depth rather than noise.
 *
 * Perf: shared geometries/materials, capped pixel ratio, render loop stops
 * when the tab is hidden, and reduced-motion users get a single static frame.
 */
export default function FloatingShapes3D({ className = '' }: FloatingShapes3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x58ddf2, wireframe: true, transparent: true, opacity: 0.16 });
    const solidMat = new THREE.MeshBasicMaterial({ color: 0x58ddf2, transparent: true, opacity: 0.045 });

    const geos = [
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusGeometry(1, 0.34, 10, 24),
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.TorusKnotGeometry(0.8, 0.3, 64, 10),
      new THREE.ConeGeometry(0.9, 1.7, 6),
      new THREE.TetrahedronGeometry(1, 0),
    ];

    const shapes: Shape[] = geos.map((geo, i) => {
      const mesh = new THREE.Mesh(geo, i % 3 === 2 ? solidMat : wireMat);
      const angle = (i / geos.length) * Math.PI * 2 + Math.random() * 0.6;
      const radius = 3.2 + Math.random() * 3.4;
      const baseY = Math.sin(angle) * radius * 0.55;
      mesh.position.set(Math.cos(angle) * radius, baseY, -3 - Math.random() * 7);
      const s = 0.7 + Math.random() * 1.1;
      mesh.scale.setScalar(s);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(mesh);
      return {
        mesh,
        baseY,
        phase: Math.random() * Math.PI * 2,
        bobSpeed: 0.35 + Math.random() * 0.6,
        spinX: (Math.random() - 0.5) * 0.5,
        spinY: (Math.random() - 0.5) * 0.5,
      };
    });

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    const onScroll = () => {
      group.position.y = window.scrollY * 0.0012;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const resize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const renderFrame = () => renderer.render(scene, camera);

    if (reduce) {
      renderFrame();
      return () => {
        ro.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();
      for (const sh of shapes) {
        sh.mesh.rotation.x += sh.spinX * 0.016;
        sh.mesh.rotation.y += sh.spinY * 0.016;
        sh.mesh.position.y = sh.baseY + Math.sin(t * sh.bobSpeed + sh.phase) * 0.5;
      }
      group.rotation.y += (mouse.x * 0.12 - group.rotation.y) * 0.02;
      group.rotation.x += (-mouse.y * 0.08 - group.rotation.x) * 0.02;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        clock.getDelta();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      renderer.dispose();
      geos.forEach((g) => g.dispose());
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden />;
}
