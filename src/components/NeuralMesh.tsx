import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NeuralMeshProps {
  className?: string;
}

/**
 * Lightweight Three.js wireframe "neural network" — three layers of glowing
 * nodes connected by lines, slowly rotating and reacting to the mouse.
 */
export default function NeuralMesh({ className = '' }: NeuralMeshProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
    camera.position.z = 4.6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.4 });
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.85 });

    const LAYER_COUNTS = [7, 9, 5];
    const LAYER_X = [-1.7, 0, 1.7];
    const nodes: THREE.Vector3[] = [];

    LAYER_COUNTS.forEach((count, li) => {
      for (let i = 0; i < count; i++) {
        const y = ((i - (count - 1) / 2) / Math.max(count - 1, 1)) * 2.4;
        const z = Math.sin((i / Math.max(count, 1)) * Math.PI * 2) * 0.35;
        nodes.push(new THREE.Vector3(LAYER_X[li], y, z));
      }
    });

    // Interconnect consecutive layers
    const positions: number[] = [];
    const offsets: number[] = [];
    let acc = 0;
    for (const c of LAYER_COUNTS) {
      offsets.push(acc);
      acc += c;
    }
    for (let li = 0; li < LAYER_COUNTS.length - 1; li++) {
      const a0 = offsets[li];
      const b0 = offsets[li + 1];
      for (let a = a0; a < a0 + LAYER_COUNTS[li]; a++) {
        for (let b = b0; b < b0 + LAYER_COUNTS[li + 1]; b++) {
          positions.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    const sphereGeo = new THREE.SphereGeometry(0.075, 14, 14);
    nodes.forEach((n) => {
      const mesh = new THREE.Mesh(sphereGeo, nodeMat);
      mesh.position.copy(n);
      group.add(mesh);
    });

    group.scale.set(1.05, 1.05, 1.05);
    scene.add(group);

    const mouse = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouse);

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

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    const animate = () => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.22 + mouse.x * 0.35;
      group.rotation.x = mouse.y * 0.3 + Math.sin(t * 0.2) * 0.06;
      nodeMat.opacity = 0.55 + Math.sin(t * 2) * 0.25;
      lineMat.opacity = 0.28 + (Math.sin(t * 1.4) * 0.12 + 0.12);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    // Pause the render loop while the hero is scrolled out of view so the
    // WebGL context never competes with page scrolling.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          cancelAnimationFrame(raf);
          clock.getDelta();
          raf = requestAnimationFrame(animate);
        }
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(container);
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('mousemove', onMouse);
      renderer.dispose();
      lineGeo.dispose();
      sphereGeo.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden />;
}
