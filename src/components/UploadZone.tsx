import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, FileImage, Crop, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import HeroParticles from './HeroParticles';
import { useToast } from '../lib/toast';

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  onFiles: (files: FileList | null) => void;
  onFile: (file: File) => void;
  onAnalyze: () => void;
  onRemove: () => void;
  onEdit?: () => void;
}

export default function UploadZone({ file, previewUrl, onFiles, onFile, onAnalyze, onRemove, onEdit }: UploadZoneProps) {
  const { push } = useToast();
  const [dragging, setDragging] = useState(false);
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

  // Subtle parallax drift as the hero scrolls out of view.
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const yPreview = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [46, -46]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <>
      {/* Hero Section — detector panel pinned to the far right, copy bottom-left */}
      <div id="home">
        <section ref={sectionRef} id="detector" className="relative flex min-h-[calc(100vh-6rem)] flex-col justify-center px-4 pb-48 pr-0 pt-6 sm:pb-60 sm:pt-10">
          <HeroParticles />

          {/* Bottom-left hero copy */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } } }}
            className="relative z-20 mb-10 ml-1 max-w-md sm:ml-3 lg:absolute lg:bottom-44 lg:left-14 lg:mb-0 lg:ml-0 lg:max-w-sm"
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
              className="text-balance text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]"
            >
              Is this image{' '}
              <span className="neon-text">real</span> or{' '}
              <span className="bg-gradient-to-r from-white via-neon-200 to-neon bg-clip-text text-transparent">
                AI-generated?
              </span>
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
              className="mt-4 max-w-sm text-balance text-sm leading-relaxed text-white/60"
            >
              Upload any image and let our forensic engine analyze metadata, texture patterns and AI signatures to reveal its true origin.
            </motion.p>
            <motion.div
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, delay: 0.35, ease: 'easeOut' } } }}
              className="mt-6 h-px w-40 origin-left bg-gradient-to-r from-neon/70 to-transparent"
            />
            <motion.a
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
              href="#/features"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-neon transition-colors hover:text-neon-200"
            >
              Explore all tools
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.a>
          </motion.div>

          {/* Detector panel — flush with the right edge */}
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="glass relative z-10 ml-auto mr-4 mt-8 w-full max-w-xl overflow-hidden rounded-[36px] sm:mr-10 sm:mt-14 lg:mr-16"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
              e.currentTarget.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
            }}
          >
            {/* glass top highlight + cursor sheen */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_var(--mx,50%)_0%,rgba(255,255,255,0.16),transparent_70%)]" />

            <div className="relative p-6 sm:p-8">
              <motion.div style={{ y: yPreview }} className="flex flex-col">
                <div className="animate-float-soft flex flex-1 flex-col">
                <div className="glass-soft relative flex flex-1 flex-col overflow-hidden rounded-[24px] p-5">
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
                        ? 'rgba(52, 211, 153, 0.14)'
                        : 'rgba(0, 0, 0, 0.35)',
                      backdropFilter: 'blur(18px) saturate(140%)',
                      borderColor: dragging ? 'rgba(209, 250, 229, 0.8)' : 'rgba(220, 255, 255, 0.35)',
                      boxShadow: dragging
                        ? '0 0 0 1px rgba(209, 250, 229, 0.4), 0 0 44px rgba(52, 211, 153, 0.25), inset 0 0 30px rgba(52, 211, 153, 0.06)'
                        : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(52, 211, 153, 0.05), 0 8px 32px rgba(0, 0, 0, 0.35)',
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
                        <img src={previewUrl} alt="preview" className="mx-auto max-h-[300px] w-auto max-w-full rounded-xl object-contain shadow-[0_0_40px_rgba(52, 211, 153,0.2)]" />
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

                  {/* selected file bar — appears once an image is chosen */}
                  <AnimatePresence>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-4"
                      >
                        <div className="glass-soft flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/30 bg-white/10">
                              <FileImage className="h-4 w-4 text-neon" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{file.name}</p>
                              <p className="text-xs text-white/45">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit?.(); }}
                              aria-label="Edit image"
                              className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-neon"
                            >
                              <Crop className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove(); }}
                              aria-label="Remove file"
                              className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={onAnalyze}
                              disabled={!file}
                              className="glass-btn-primary flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Analyze
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI score footer */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">AI Score</p>
                      <p className="text-xs font-bold text-neon">{file ? '--%' : '72.8%'}</p>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-white/15 bg-ink/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neon/40 via-neon to-neon-200 shadow-[0_0_12px_rgba(52, 211, 153,0.6)] transition-all duration-700"
                        style={{ width: file ? '8%' : '72.8%' }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-white/40">
                      {file ? 'Ready to analyze — press Analyze to get a verdict.' : 'Illustrative score — upload an image to run a real analysis.'}
                    </p>
                  </div>
                </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
