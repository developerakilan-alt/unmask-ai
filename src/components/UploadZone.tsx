import { lazy, Suspense, useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, FileImage, ArrowRight, Crop, Link2, Camera, Wand2, Loader2, ScanLine, ClipboardPaste } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import HeroParticles from './HeroParticles';
import CameraCapture from './CameraCapture';
import DemoGallery from './DemoGallery';
import Magnetic from './Magnetic';
import { useToast } from '../lib/toast';

// Three.js is ~600KB — load it only when the hero is actually shown.
const NeuralMesh = lazy(() => import('./NeuralMesh'));

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  onFiles: (files: FileList | null) => void;
  onFile: (file: File) => void;
  onAnalyze: () => void;
  onRemove: () => void;
  onEdit?: () => void;
  onUrl: (url: string) => void;
}

function isValidImageUrl(value: string): boolean {
  return /^https?:\/\/.+\..+/.test(value.trim());
}

export default function UploadZone({ file, previewUrl, onFiles, onFile, onAnalyze, onRemove, onEdit, onUrl }: UploadZoneProps) {
  const { push } = useToast();
  const [dragging, setDragging] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Paste-to-upload: Ctrl+V (or Cmd+V) anywhere on the page pastes an image
  // straight into the analyzer.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) {
            onFile(f);
            push('success', 'Pasted from clipboard', f.name);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile, push]);

  const readClipboard = async () => {
    try {
      const items = await navigator.clipboard?.read();
      if (!items) return;
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const f = await item.getType(type);
          onFile(new File([f], 'clipboard-image.png', { type }));
          push('success', 'Pasted from clipboard', 'clipboard-image.png');
          return;
        }
      }
      push('info', 'Clipboard has no image', 'Copy an image, then press paste.');
    } catch {
      push('info', 'Clipboard not accessible', 'Press Ctrl+V with an image copied instead.');
    }
  };

  // Subtle parallax drift as the hero scrolls out of view.
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const yPreview = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [46, -46]);
  const yCopy = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [18, -18]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  const submitUrl = () => {
    if (!isValidImageUrl(urlValue) || urlBusy) return;
    setUrlBusy(true);
    // Let the button state settle, then hand off to the backend URL analyzer.
    setTimeout(() => {
      onUrl(urlValue.trim());
      setUrlOpen(false);
      setUrlValue('');
      setUrlBusy(false);
    }, 120);
  };

  const quickActions = [
    { icon: Upload, label: 'Upload', onClick: () => inputRef.current?.click() },
    { icon: Link2, label: 'From URL', onClick: () => setUrlOpen((o) => !o) },
    { icon: ClipboardPaste, label: 'Paste', onClick: readClipboard },
    { icon: Camera, label: 'Webcam', onClick: () => setCameraOpen(true) },
    { icon: Wand2, label: 'Samples', onClick: () => setDemoOpen(true) },
  ];

  return (
    <>
      {/* Hero Section — one large translucent glass panel */}
      <div id="home">
        <section ref={sectionRef} id="detector" className="relative px-4 pb-14 pt-10 sm:pt-14">
          <HeroParticles />
          <Suspense fallback={null}>
            <NeuralMesh className="neural-mesh pointer-events-none absolute inset-0 opacity-[0.25]" />
          </Suspense>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="glass relative z-10 mx-auto max-w-6xl overflow-hidden rounded-[36px]"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
              e.currentTarget.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
            }}
          >
            {/* glass top highlight + cursor sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_var(--mx,50%)_0%,rgba(255,255,255,0.16),transparent_70%)]" />
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-[100%] bg-white/10 blur-3xl" />

            <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:gap-14">
              {/* LEFT — copy + actions */}
              <motion.div style={{ y: yCopy }} className="flex flex-col justify-center">
                <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                  <ScanLine className="h-3.5 w-3.5 text-neon" />
                  AI Content Detection
                </div>

                <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
                  Is this image{' '}
                  <span className="neon-text">real</span> or{' '}
                  <span className="bg-gradient-to-r from-white via-neon-200 to-neon text-transparent bg-clip-text">
                    AI-generated?
                  </span>
                </h1>

                <p className="mt-5 max-w-md text-balance text-base leading-relaxed text-white/60">
                  Upload any image and let our forensic engine analyze metadata, texture patterns and AI signatures to reveal its true origin.
                </p>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Magnetic strength={0.3}>
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="glass-btn-primary h-12 px-7 text-sm font-bold"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </button>
                  </Magnetic>
                  <Magnetic strength={0.3}>
                    <button
                      onClick={onAnalyze}
                      disabled={!file}
                      className="glass-btn h-12 px-7 text-sm font-bold"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Analyze
                    </button>
                  </Magnetic>
                </div>

                {/* quick actions */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {quickActions.map((a) => (
                    <button
                      key={a.label}
                      onClick={a.onClick}
                      className="glass-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white/70 transition-all hover:border-white/50 hover:text-white"
                    >
                      <a.icon className="h-3.5 w-3.5 text-neon" /> {a.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {urlOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-soft mt-4 flex max-w-md items-center gap-2 rounded-2xl p-2">
                        <Link2 className="ml-2 h-4 w-4 shrink-0 text-neon" />
                        <input
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitUrl()}
                          placeholder="https://example.com/image.jpg"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                          aria-label="Image URL"
                        />
                        <button
                          onClick={submitUrl}
                          disabled={!isValidImageUrl(urlValue) || urlBusy}
                          className="glass-btn-primary flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {urlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                          Analyze
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* selected file bar */}
                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="mt-5"
                    >
                      <div className="glass-soft flex max-w-md items-center justify-between rounded-2xl px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/30 bg-white/10">
                            <FileImage className="h-4 w-4 text-neon" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-white/45">{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
                            aria-label="Edit image"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-neon"
                          >
                            <Crop className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}
                            aria-label="Remove file"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* RIGHT — image preview glass-in-glass */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                className="flex flex-col"
              >
                <motion.div style={{ y: yPreview }} className="flex flex-1 flex-col">
                <div className="glass-soft relative flex flex-1 flex-col overflow-hidden rounded-[28px] p-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60" />

                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Image Preview</p>
                    <span className="glass-pill rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                      {file ? 'Ready' : 'Empty'}
                    </span>
                  </div>

                  {/* preview stage */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                    className={`relative flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 sm:min-h-[320px] ${
                      dragging ? 'scale-[1.01]' : ''
                    }`}
                    style={{
                      background: dragging
                        ? 'rgba(88, 221, 242, 0.14)'
                        : 'rgba(3, 23, 46, 0.35)',
                      backdropFilter: 'blur(18px) saturate(140%)',
                      borderColor: dragging ? 'rgba(184, 248, 255, 0.8)' : 'rgba(220, 255, 255, 0.35)',
                      boxShadow: dragging
                        ? '0 0 0 1px rgba(184, 248, 255, 0.4), 0 0 44px rgba(88, 221, 242, 0.25), inset 0 0 30px rgba(88, 221, 242, 0.06)'
                        : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(88, 221, 242, 0.05), 0 8px 32px rgba(2, 14, 28, 0.35)',
                    } as React.CSSProperties}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => onFiles(e.target.files)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {previewUrl ? (
                      <div className="relative h-full w-full">
                        <img src={previewUrl} alt="preview" className="mx-auto max-h-[300px] w-auto max-w-full rounded-xl object-contain shadow-[0_0_40px_rgba(88,221,242,0.2)]" />
                        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
                        <div className="scan-line pointer-events-none absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon to-transparent" />
                      </div>
                    ) : (
                      <>
                        <div className="relative grid h-20 w-20 place-items-center">
                          <div className="absolute inset-0 rounded-full bg-neon/20 blur-2xl" />
                          <div className="relative grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                            <Upload className="h-7 w-7 text-neon" strokeWidth={2} />
                          </div>
                        </div>
                        <p className="mt-5 text-lg font-bold text-white">Drag &amp; drop your image here</p>
                        <p className="mt-1.5 text-sm text-white/45">or click to browse files</p>
                        <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-white/35">
                          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">Ctrl</kbd>
                          <span>+</span>
                          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">V</kbd>
                          <span className="ml-1">to paste from clipboard</span>
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                          <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65">
                            <FileImage className="h-3.5 w-3.5 text-neon/80" />
                            JPG, PNG, WEBP
                          </span>
                          <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/65">
                            <svg className="h-3.5 w-3.5 text-neon/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Privacy First
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* AI score footer */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">AI Score</p>
                      <p className="text-xs font-bold text-neon">{file ? '--%' : '72.8%'}</p>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/15 bg-ink/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neon/40 via-neon to-neon-200 shadow-[0_0_12px_rgba(88,221,242,0.6)] transition-all duration-700"
                        style={{ width: file ? '8%' : '72.8%' }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-white/40">
                      {file ? 'Ready to analyze — press Analyze to get a verdict.' : 'Illustrative score — upload an image to run a real analysis.'}
                    </p>
                  </div>
                </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      <AnimatePresence>
        {cameraOpen && (
          <CameraCapture
            onCapture={onFile}
            onClose={() => setCameraOpen(false)}
          />
        )}
        {demoOpen && <DemoGallery onFile={onFile} onClose={() => setDemoOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
