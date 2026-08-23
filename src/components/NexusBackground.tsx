import { useEffect, useRef } from 'react';

/**
 * "Nexus" full-bleed WebGL background field — a meditative dot-matrix particle
 * grid on a black cinematic foundation (mint #6EE7B7 / emerald #10B981 accents)..
 *
 * Render pipeline: one fullscreen gradient/atmosphere quad + one gl.POINTS
 * draw call, both driven by custom shaders. Motion is a slow traveling
 * breathing pulse; the pointer only produces a subtle depth-aware drift.
 *
 * Perf: DPR clamped, particle count scales with viewport/device, the loop
 * pauses when the tab is hidden or light theme is active, reduced-motion
 * users get a single static frame, and everything is disposed on unmount.
 */

const ATMOS_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const ATMOS_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vUv;
  float ar = uRes.x / max(uRes.y, 1.0);
  vec2 sp = vec2(p.x * ar, p.y);
  vec3 col = vec3(0.0);

  // Primary mint aura — upper left, barely-there, drifting very slowly.
  vec2 g1 = vec2(0.22 + 0.04 * sin(uTime * 0.045), 0.94);
  col += vec3(0.431, 0.905, 0.718) * 0.055 * exp(-distance(sp, vec2(g1.x * ar, g1.y)) * 2.0);

  // Supporting emerald aura — lower right.
  vec2 g2 = vec2(0.88, 0.08 + 0.05 * sin(uTime * 0.036 + 2.1));
  col += vec3(0.063, 0.725, 0.506) * 0.07 * exp(-distance(sp, vec2(g2.x * ar, g2.y)) * 2.15);

  // Atmospheric noise wisps tying the two accents together.
  float n = fbm(sp * 2.1 + vec2(uTime * 0.012, -uTime * 0.009));
  float wisp = smoothstep(0.42, 0.96, n);
  col += mix(vec3(0.063, 0.725, 0.506), vec3(0.431, 0.905, 0.718), n) * wisp * 0.032;

  // Cinematic vignette — edges fall to pure black.
  float vig = smoothstep(1.38, 0.32, length((p - 0.5) * vec2(ar, 1.0)));
  col *= 0.25 + 0.75 * vig;

  // Fine dither kills banding across the near-black gradients.
  col += (hash(p * uRes + fract(uTime) * 61.7) - 0.5) * 0.012;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;

const DOTS_VERT = `
precision highp float;
attribute vec4 aDot;     // x, y (css px), depth 0..1 (far -> near), seed
attribute float aAccent; // sparse accent nodes
uniform vec2 uRes;       // css px
uniform float uDpr;
uniform float uTime;
uniform vec2 uPointer;   // css px
uniform float uPointerOn;
varying float vDepth;
varying float vSeed;
varying float vAccent;
varying float vGlow;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  float depth = aDot.z;
  float seed = aDot.w;
  vec2 px = aDot.xy;
  vec2 uv = px / uRes;

  // Slow breathing pulse traveling outward through the field.
  float radial = distance(uv, vec2(0.5));
  float breath = 0.5 + 0.5 * sin(uTime * 0.62 - radial * 3.1 + seed * 0.9);

  // Organic positional drift — layered low-frequency sines, no sharp motion.
  float t = uTime;
  vec2 drift = vec2(
    sin(t * 0.11 + seed * 17.0) + 0.55 * sin(t * 0.23 + seed * 29.0),
    cos(t * 0.09 + seed * 23.0) + 0.55 * cos(t * 0.19 + seed * 13.0)
  ) * (1.6 + depth * 4.2);

  // Pointer-reactive drift: gentle parallax by depth plus a soft local push.
  vec2 pn = (uPointer / uRes) * 2.0 - 1.0;
  vec2 toP = px - uPointer;
  float pd2 = dot(toP, toP);
  float infl = exp(-pd2 / 67600.0) * uPointerOn;
  vec2 repel = normalize(toP + vec2(0.001)) * infl * 14.0;
  vec2 parallax = -pn * (5.0 + depth * 20.0) * uPointerOn;

  vec2 pos = px + drift + repel + parallax;
  vec2 clip = (pos / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

  float tw = 0.78 + 0.22 * sin(t * (0.22 + hash(seed) * 0.5) + seed * 61.0);
  float sizePx = (1.35 + depth * depth * 2.7 + aAccent * 1.2) * (0.82 + breath * 0.36);
  gl_PointSize = max(sizePx * tw, 0.9) * uDpr;

  vDepth = depth;
  vSeed = seed;
  vAccent = aAccent;
  vGlow = (0.35 + breath * 0.65) * tw;
}
`;

const DOTS_FRAG = `
precision mediump float;
varying float vDepth;
varying float vSeed;
varying float vAccent;
varying float vGlow;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 5.0);
  float halo = exp(-r2 * 2.0) * 0.34;

  vec3 mint = vec3(0.431, 0.905, 0.718); // #6EE7B7 — Aether primary
  vec3 emerald = vec3(0.063, 0.725, 0.506); // #10B981 — Aether tertiary
  float k = clamp(vDepth * 0.85 + vAccent * 0.35 + fract(vSeed * 7.31) * 0.25 - 0.15, 0.0, 1.0);
  vec3 col = mix(emerald, mint, k);
  col = mix(col, vec3(0.925, 0.992, 0.961), core * 0.38); // #ECFDF5 core

  // Soft depth fade: far dots sink into black, near accents glow gently.
  float bright = mix(0.17, 0.78, vDepth) * vGlow + vAccent * 0.16 * vGlow;
  float alpha = (core + halo) * bright;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

interface Scene {
  render: (t: number) => void;
  resize: () => void;
  setPointer: (x: number, y: number) => void;
  fadePointerOut: () => void;
  dispose: () => void;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[NexusBackground] shader error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[NexusBackground] program link error:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function createScene(canvas: HTMLCanvasElement): Scene | null {
  const gl =
    (canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    }) as WebGLRenderingContext | null) ||
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (!gl) return null;

  const atmosProg = linkProgram(gl, ATMOS_VERT, ATMOS_FRAG);
  const dotsProg = linkProgram(gl, DOTS_VERT, DOTS_FRAG);
  if (!atmosProg || !dotsProg) return null;

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const dotBuf = gl.createBuffer();

  const atmosLoc = {
    aPos: gl.getAttribLocation(atmosProg, 'aPos'),
    uRes: gl.getUniformLocation(atmosProg, 'uRes'),
    uTime: gl.getUniformLocation(atmosProg, 'uTime'),
  };
  const dotsLoc = {
    aDot: gl.getAttribLocation(dotsProg, 'aDot'),
    aAccent: gl.getAttribLocation(dotsProg, 'aAccent'),
    uRes: gl.getUniformLocation(dotsProg, 'uRes'),
    uDpr: gl.getUniformLocation(dotsProg, 'uDpr'),
    uTime: gl.getUniformLocation(dotsProg, 'uTime'),
    uPointer: gl.getUniformLocation(dotsProg, 'uPointer'),
    uPointerOn: gl.getUniformLocation(dotsProg, 'uPointerOn'),
  };

  let dpr = 1;
  let wCss = 0;
  let hCss = 0;
  let dotCount = 0;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  const quality = coarse || smallScreen ? 0.55 : 1;

  const buildDots = () => {
    const area = Math.max(wCss * hCss, 1);
    const desired = Math.round(Math.min(Math.max(area / 7800, 420), 2300) * quality);
    const s = Math.sqrt(area / desired);
    const cols = Math.ceil(wCss / s);
    const rows = Math.ceil(hCss / s);
    const data = new Float32Array(cols * rows * 5);
    let n = 0;
    for (let iy = 0; iy < rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        const o = n * 5;
        data[o] = (ix + 0.5 + (Math.random() - 0.5) * 0.66) * s;
        data[o + 1] = (iy + 0.5 + (Math.random() - 0.5) * 0.66) * s;
        // pow biases the distribution toward far dots -> soft depth fade.
        data[o + 2] = Math.pow(Math.random(), 1.55);
        data[o + 3] = Math.random() * 100.0;
        data[o + 4] = Math.random() < 0.05 ? 1 : 0;
        n++;
      }
    }
    dotCount = n;
    gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  };

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, quality < 1 ? 1.5 : 1.75);
    const changed = w !== wCss || h !== hCss;
    wCss = w;
    hCss = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (changed || !dotCount) buildDots();
  };
  resize();

  const render = (t: number) => {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Pass 1: atmosphere gradients on black.
    gl.disable(gl.BLEND);
    gl.useProgram(atmosProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.enableVertexAttribArray(atmosLoc.aPos);
    gl.vertexAttribPointer(atmosLoc.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(atmosLoc.uRes, wCss, hCss);
    gl.uniform1f(atmosLoc.uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Pass 2: dot matrix with premultiplied-alpha blending.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(dotsProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf);
    gl.enableVertexAttribArray(dotsLoc.aDot);
    gl.vertexAttribPointer(dotsLoc.aDot, 4, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(dotsLoc.aAccent);
    gl.vertexAttribPointer(dotsLoc.aAccent, 1, gl.FLOAT, false, 20, 16);
    gl.uniform2f(dotsLoc.uRes, wCss, hCss);
    gl.uniform1f(dotsLoc.uDpr, dpr);
    gl.uniform1f(dotsLoc.uTime, t);
    gl.uniform2f(dotsLoc.uPointer, pointer.curX, pointer.curY);
    gl.uniform1f(dotsLoc.uPointerOn, pointer.active);
    gl.drawArrays(gl.POINTS, 0, dotCount);
  };

  const pointer = {
    tgtX: wCss / 2,
    tgtY: hCss / 2,
    curX: wCss / 2,
    curY: hCss / 2,
    active: 0,
    activeTgt: 0,
  };
  const easePointer = () => {
    pointer.curX += (pointer.tgtX - pointer.curX) * 0.055;
    pointer.curY += (pointer.tgtY - pointer.curY) * 0.055;
    pointer.active += (pointer.activeTgt - pointer.active) * 0.03;
  };
  const renderEased = (t: number) => {
    easePointer();
    render(t);
  };

  return {
    render: renderEased,
    resize,
    setPointer: (x, y) => {
      pointer.tgtX = x;
      pointer.tgtY = y;
      pointer.activeTgt = 1;
    },
    fadePointerOut: () => {
      pointer.activeTgt = 0;
    },
    dispose: () => {
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(dotBuf);
      gl.deleteProgram(atmosProg);
      gl.deleteProgram(dotsProg);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    },
  };
}

export default function NexusBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    host.appendChild(canvas);

    let scene = createScene(canvas);
    if (!scene) {
      // DOM fallback: keep an atmospheric black field via CSS gradients.
      host.dataset.fallback = 'true';
      canvas.remove();
      return;
    }

    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let running = false;
    let hidden = document.hidden;
    let lightTheme = document.documentElement.classList.contains('light');

    const shouldRun = () => !reduceMq.matches && !hidden && !lightTheme && !!scene;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      scene?.render(now / 1000);
    };
    const start = () => {
      if (running || !shouldRun()) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const renderStaticFrame = () => {
      scene?.render(4.2);
    };

    const onResize = () => {
      scene?.resize();
      if (!running) renderStaticFrame();
    };
    const onVis = () => {
      hidden = document.hidden;
      if (running && !shouldRun()) stop();
      else start();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      scene?.setPointer(e.clientX, e.clientY);
    };
    const onLeave = () => scene?.fadePointerOut();
    const onContextLost = (e: Event) => {
      e.preventDefault();
      stop();
    };
    const onContextRestored = () => {
      scene?.dispose();
      scene = createScene(canvas);
      if (!scene) {
        stop();
        return;
      }
      scene.resize();
      if (running) {
        stop();
        start();
      }
      if (!shouldRun()) renderStaticFrame();
    };

    const themeObserver = new MutationObserver(() => {
      const light = document.documentElement.classList.contains('light');
      if (light === lightTheme) return;
      lightTheme = light;
      host.classList.toggle('nexus-off', light);
      if (light) stop();
      else if (reduceMq.matches) renderStaticFrame();
      else start();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    reduceMq.addEventListener?.('change', onMotionPrefChange);
    function onMotionPrefChange() {
      if (reduceMq.matches) {
        stop();
        renderStaticFrame();
      } else {
        start();
      }
    }

    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (!isCoarse) {
      window.addEventListener('pointermove', onMove, { passive: true });
    }
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    host.classList.toggle('nexus-off', lightTheme);
    if (shouldRun()) start();
    else renderStaticFrame();

    return () => {
      stop();
      themeObserver.disconnect();
      reduceMq.removeEventListener?.('change', onMotionPrefChange);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      scene?.dispose();
      scene = null;
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="nexus-bg pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true" />;
}
