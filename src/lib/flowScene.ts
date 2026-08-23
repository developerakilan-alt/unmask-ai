import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import {
  pointsVert,
  pointsFrag,
  finalPassShader,
  motesVert,
  motesFrag,
} from './flowShaders';

const bgColor = '#02160c';
const flameColor = '#0aff7f';
const flameColor2 = '#aef0c0';
const flameAmt = 0.2;
const atmoColor = '#7affbf';
const atmoCount = 300;
const atmoSize = 24;
const atmoSpeed = 1.0;
const colorLow = '#02160c';
const colorHigh = '#34e89a';
const opacity = 0.26;
const pointSize = 5.5;
const brightness = 0.45;
const waveHeight = 3;
const flow = 1;
const tilt = 0;
const scale = 0.275;
const scrollRise = 1.0;
const camStartY = 7,
  camStartZ = 16;
const camEndY = 0.8,
  camEndZ = -2;
const lookStartZ = 2,
  lookEndZ = -16;
const parallax = 1.2;
const pointerRadius = 7.0;
const pointerStrength = 0.9;

const Lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function hexToVec3(hex: string): THREE.Vector3 {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export interface FlowScene {
  render(scroll: number, mouse: { x: number; y: number }): void;
  setPointer(active: boolean): void;
  resize(): void;
  dispose(): void;
}

export function createFlowScene(
  canvas: HTMLCanvasElement,
  opts?: { staticMode?: boolean },
): FlowScene {
  const staticMode = !!opts?.staticMode;

  const renderer = new THREE.WebGL1Renderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 0, 15);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 7, 16);

  const LAYERS = { NONE: 0, TORUS_SCENE: 1, BLOOM_SCENE: 2, ENTIRE_SCENE: 3 };
  camera.layers.enable(LAYERS.TORUS_SCENE);
  camera.layers.enable(LAYERS.BLOOM_SCENE);
  camera.layers.enable(LAYERS.ENTIRE_SCENE);
  scene.add(camera);

  const group = new THREE.Group();
  scene.add(group);

  const geo = new THREE.SphereGeometry(4.2, 200, 600);
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uStream: { value: 0 },
    uAppear: { value: 0 },
    uColLow: { value: hexToVec3(colorLow) },
    uColHigh: { value: hexToVec3(colorHigh) },
    uOpacity: { value: opacity },
    uSize: { value: pointSize },
    uBrightness: { value: brightness },
    uWaveHeight: { value: waveHeight },
    uFlow: { value: flow },
    uScale: { value: scale },
    uCursor: { value: new THREE.Vector3() },
    uRepelRadius: { value: pointerRadius },
    uRepelStrength: { value: pointerStrength },
    uActivity: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: pointsVert,
    fragmentShader: pointsFrag,
  });

  const pts = new THREE.Points(geo, material);
  pts.frustumCulled = false;
  pts.layers.enable(LAYERS.ENTIRE_SCENE);
  group.add(pts);

  const fpUniforms = {
    ...finalPassShader.uniforms,
    uBg: { value: hexToVec3(bgColor) },
    uFlameA: { value: hexToVec3(flameColor) },
    uFlameB: { value: hexToVec3(flameColor2) },
    uFlameAmt: { value: flameAmt },
  };
  const finalPass = new ShaderPass({
    uniforms: fpUniforms,
    vertexShader: finalPassShader.vertexShader,
    fragmentShader: finalPassShader.fragmentShader,
  });

  const torusComposer = new EffectComposer(renderer);
  torusComposer.renderToScreen = false;
  torusComposer.addPass(new RenderPass(scene, camera));
  torusComposer.addPass(new ShaderPass(GammaCorrectionShader));
  torusComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.2, 0),
  );
  torusComposer.addPass(new ShaderPass(CopyShader));

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera));
  bloomComposer.addPass(
    new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.55, 0),
  );
  bloomComposer.addPass(new ShaderPass(GammaCorrectionShader));

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(new RenderPass(scene, camera));
  finalComposer.addPass(finalPass);
  fpUniforms.bloomTexture.value = bloomComposer.renderTarget1.texture;
  fpUniforms.torusTexture.value = torusComposer.renderTarget1.texture;

  const motesGeo = (() => {
    const N = Math.round(atmoCount);
    const positions = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = Math.random() * 2 - 1;
      positions[i * 3 + 1] = Math.random() * 2 - 1;
      positions[i * 3 + 2] = Math.random() * 2 - 1;
      sizes[i] = atmoSize * (0.4 + Math.random());
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    return g;
  })();

  const motesMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: hexToVec3(atmoColor) },
      uRes: {
        value: new THREE.Vector2(
          window.innerWidth * renderer.getPixelRatio(),
          window.innerHeight * renderer.getPixelRatio(),
        ),
      },
    },
    vertexShader: motesVert,
    fragmentShader: motesFrag,
  });

  const motes = new THREE.Points(motesGeo, motesMat);
  motes.frustumCulled = false;
  motes.layers.enable(LAYERS.ENTIRE_SCENE);
  motes.onBeforeRender = () => {
    const t = performance.now() / 1000;
    motesMat.uniforms.uTime.value = t * atmoSpeed * 8.0;
    motes.position.copy(camera.position);
    fpUniforms.iTime.value = t;
  };
  scene.add(motes);

  const POINTER = { world: new THREE.Vector3(), activity: 0, active: false, lastMove: 0 };
  const _ndc = new THREE.Vector3(),
    _dir = new THREE.Vector3(),
    _tgt = new THREE.Vector3();
  function updatePointerWorld(mouse: { x: number; y: number }) {
    _tgt.set(0, 0, 0);
    if (POINTER.active) {
      _ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      _dir.copy(_ndc).sub(camera.position).normalize();
      const dn = _dir.z;
      if (Math.abs(dn) > 1e-4) {
        const tt = -camera.position.z / dn;
        if (tt > 0 && Number.isFinite(tt)) _tgt.copy(camera.position).addScaledVector(_dir, tt);
      }
    }
    POINTER.world.lerp(_tgt, 0.12);
    const idle = (performance.now() - POINTER.lastMove) / 1000;
    POINTER.activity += (((POINTER.active && idle < 3) ? 1 : 0) - POINTER.activity) * 0.06;
  }

  let stream = 0;
  let tPrev = performance.now() / 1000;
  function updateScene(scroll: number, mouse: { x: number; y: number }) {
    const t = performance.now() / 1000;
    const dt = staticMode ? 0 : Math.min(0.05, Math.max(0, t - tPrev));
    tPrev = t;

    uniforms.uTime.value = staticMode ? uniforms.uTime.value : t;
    stream += dt * (flow * 2.0) * 4.0;
    uniforms.uStream.value = stream;
    uniforms.uWaveHeight.value = waveHeight * (1 + scroll * scrollRise);

    const ea = Math.min(scroll / 0.35, 1.0);
    const e = ea * ea * (3 - 2 * ea);
    const camY = Lerp(camStartY, camEndY, e);
    const camZ = Lerp(camStartZ, camEndZ, e);
    camera.position.set(mouse.x * parallax, camY + mouse.y * parallax * 0.3, camZ);
    camera.lookAt(mouse.x * parallax * 0.5, Lerp(0.0, 0.6, e), Lerp(lookStartZ, lookEndZ, e));
    group.rotation.x = -tilt;
    group.rotation.y = 0;
    updatePointerWorld(mouse);

    uniforms.uCursor.value.copy(POINTER.world);
    uniforms.uActivity.value = POINTER.activity;
    uniforms.uAppear.value = staticMode ? 1 : Math.max(0, Math.min(1, (performance.now() - born - 200) / 1400));
  }

  const born = performance.now();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const c of [torusComposer, bloomComposer, finalComposer]) {
      c.setPixelRatio(dpr);
      c.setSize(w, h);
    }
    motesMat.uniforms.uRes.value.set(w * dpr, h * dpr);
  }

  return {
    render(scroll: number, mouse: { x: number; y: number }) {
      updateScene(scroll, mouse);
      camera.layers.set(LAYERS.TORUS_SCENE);
      torusComposer.render();
      camera.layers.set(LAYERS.BLOOM_SCENE);
      bloomComposer.render();
      camera.layers.set(LAYERS.ENTIRE_SCENE);
      finalComposer.render();
    },
    setPointer(active: boolean) {
      POINTER.active = active;
      if (active) POINTER.lastMove = performance.now();
    },
    resize,
    dispose() {
      geo.dispose();
      material.dispose();
      motesGeo.dispose();
      motesMat.dispose();
      scene.remove(pts, motes, camera, group);
      try {
        torusComposer.renderTarget1?.dispose?.();
        torusComposer.renderTarget2?.dispose?.();
        bloomComposer.renderTarget1?.dispose?.();
        bloomComposer.renderTarget2?.dispose?.();
        finalComposer.renderTarget1?.dispose?.();
        finalComposer.renderTarget2?.dispose?.();
      } catch {
        /* noop */
      }
      renderer.dispose();
    },
  };
}
