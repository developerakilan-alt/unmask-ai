import { lazy, Suspense, useRef, useState, useCallback } from 'react';
import { Upload, X, FileImage, ArrowRight, Crop, Link2, Camera, Wand2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroParticles from './HeroParticles';
import CameraCapture from './CameraCapture';
import DemoGallery from './DemoGallery';

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
  const [dragging, setDragging] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    { icon: Camera, label: 'Webcam', onClick: () => setCameraOpen(true) },
    { icon: Wand2, label: 'Samples', onClick: () => setDemoOpen(true) },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 pb-10 pt-16 text-center sm:pt-24">
        <HeroParticles />
        <Suspense fallback={null}>
          <NeuralMesh className="neural-mesh pointer-events-none absolute inset-0 opacity-[0.3]" />
        </Suspense>
        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-4 py-1.5 text-xs font-medium text-neon/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              Pixel-Level Forensic Engine
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl"
          >
            Unmask <span className="neon-text animate-pulse-glow rounded-lg px-2">AI</span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-balance text-2xl font-bold sm:text-4xl"
          >
            <span className="neon-text">Real</span>{' '}
            <span className="text-white/45">or</span>{' '}
            <span className="text-danger" style={{ textShadow: '0 0 18px rgba(255,59,59,0.35)' }}>
              AI-Generated?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-white/55 sm:text-lg"
          >
            Upload any image and our forensic engine will analyze EXIF metadata, sensor noise patterns, texture signatures, and more to detect AI-generated content.
          </motion.p>
        </div>
      </section>

      {/* Quick action modes */}
      <section className="relative z-10 px-4">
        <div className="mx-auto flex max-w-[550px] flex-wrap items-center justify-center gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="glass-pill flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white/65 transition-all hover:border-neon/30 hover:text-white"
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
              <div className="mx-auto mt-3 flex max-w-[550px] items-center gap-2 rounded-2xl border border-neon/20 bg-neon/5 p-2">
                <Link2 className="ml-2 h-4 w-4 shrink-0 text-neon" />
                <input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitUrl()}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                  aria-label="Image URL"
                />
                <button
                  onClick={submitUrl}
                  disabled={!isValidImageUrl(urlValue) || urlBusy}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-neon px-4 py-2 text-xs font-bold text-black transition-all hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {urlBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  Analyze
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Upload Area */}
      <section className="relative z-10 px-4 pb-24 pt-6">
        <div className="mx-auto w-full max-w-[550px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
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
            className={`relative cursor-pointer rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 sm:py-14 overflow-hidden ${
              dragging ? 'scale-[1.01]' : ''
            }`}
            style={{
              background: dragging
                ? 'rgba(0, 200, 90, 0.08)'
                : 'rgba(8, 14, 11, 0.55)',
              backdropFilter: 'blur(18px) saturate(140%)',
              borderColor: dragging ? 'rgba(0, 200, 90, 0.7)' : 'rgba(0, 255, 102, 0.3)',
              boxShadow: dragging
                ? '0 0 0 1px rgba(0, 200, 90, 0.3), 0 0 40px rgba(0, 200, 90, 0.2), inset 0 0 30px rgba(0, 255, 102, 0.05)'
                : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), inset 0 0 24px rgba(0, 255, 102, 0.05), 0 8px 40px rgba(0, 0, 0, 0.45)',
            } as React.CSSProperties}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 60px rgba(0, 255, 102, 0.03)' }} />
            <div className="pointer-events-none absolute inset-0 rounded-3xl border border-neon/10 border-pulse" />

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
              onClick={(e) => e.stopPropagation()}
            />
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-neon/30 bg-black/40 shadow-[0_0_28px_rgba(0,255,102,0.18)]">
                  <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neon/15" />
                </div>
                <p className="mt-5 truncate text-sm font-medium text-white/80">{file?.name}</p>
                <p className="mt-1 text-xs text-white/40">Click or drop a new image to replace</p>
              </div>
            ) : (
              <>
                <div className="mx-auto grid h-20 w-20 place-items-center">
                  <div className="relative grid h-20 w-20 place-items-center rounded-full border border-neon/30 bg-neon/10 animate-pulse-glow">
                    <div className="absolute inset-0 rounded-full bg-neon/20 blur-xl" />
                    <Upload className="relative h-8 w-8 text-neon" strokeWidth={2.2} />
                  </div>
                </div>
                <p className="mt-6 text-lg font-bold text-white">Drag &amp; drop your image here</p>
                <p className="mt-1.5 text-sm text-white/45">or click to browse files</p>
              </>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/60">
                <FileImage className="h-3.5 w-3.5 text-neon/80" />
                JPG, PNG, WEBP
              </span>
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/60">
                <svg className="h-3.5 w-3.5 text-neon/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Privacy First
              </span>
            </div>
          </motion.div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4"
              >
                <div className="glass-soft flex items-center justify-between rounded-2xl px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon/30 bg-neon/10">
                      <FileImage className="h-4 w-4 text-neon" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-white/40">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
                      aria-label="Edit image"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-neon"
                    >
                      <Crop className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}
                      aria-label="Remove file"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced CTA Button */}
          <motion.button
            whileHover={file ? { scale: 1.02 } : {}}
            whileTap={file ? { scale: 0.98 } : {}}
            onClick={onAnalyze}
            disabled={!file}
            className={`mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-bold transition-all ${
              file
                ? 'bg-gradient-to-r from-neon to-neon-600 text-black shadow-[0_0_32px_rgba(0,255,102,0.35)] hover:shadow-[0_0_48px_rgba(0,255,102,0.5)]'
                : 'cursor-not-allowed bg-white/[0.06] text-white/30'
            }`}
          >
            Analyze Authenticity
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </motion.button>
        </div>
      </section>

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
