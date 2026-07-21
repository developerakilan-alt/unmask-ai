import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Scan,
  Upload,
  X,
  FileImage,
  ArrowRight,
  ArrowLeft,
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Gauge,
  Layers,
  Sparkles,
  Grid3x3,
  LogOut,
  Lock,
  Mail,
  Fingerprint,
  Eye,
  Download,
  Camera,
  Menu,
} from 'lucide-react';
import { analyzeImage, type AnalysisResult } from './analyze';
import { useAuth } from './lib/auth';
import NeuralBackground from './components/NeuralBackground';
import {
  StatsSection,
  TechSection,
  WhyUsSection,
  ModelsSection,
  TestimonialsSection,
  ApiSection,
  FaqSection,
  CtaSection,
  Footer,
} from './components/sections';

type Page = 'home' | 'analyzing' | 'result';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      const okType = /image\/(jpeg|jpg|png|webp)/i.test(f.type);
      const okExt = /\.(jpe?g|png|webp)$/i.test(f.name);
      if (!okType && !okExt) return;
      setFile(f);
      setResult(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [previewUrl],
  );

  const startAnalysis = () => {
    if (!file) return;
    setPage('analyzing');
  };

  const onAnalyzed = (res: AnalysisResult) => {
    setResult(res);
    setPage('result');
  };

  const reset = () => {
    setPage('home');
    setResult(null);
  };

  const newImage = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setPage('home');
  };

  const scrollToUpload = () => {
    document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-equinox">
      <LiquidBackground />
      <div className="relative z-10">
        <Navbar onAuthOpen={() => setAuthOpen(true)} onUpload={scrollToUpload} />
        {page === 'home' && (
          <>
            <HomePage
              file={file}
              previewUrl={previewUrl}
              onFiles={handleFiles}
              onAnalyze={startAnalysis}
            />
            <StatsSection />
            <TechSection />
            <WhyUsSection />
            <ModelsSection />
            <TestimonialsSection />
            <ApiSection />
            <FaqSection />
            <CtaSection onUpload={scrollToUpload} />
          </>
        )}
        {page === 'analyzing' && (
          <AnalyzingPage previewUrl={previewUrl} onDone={onAnalyzed} onCancel={reset} />
        )}
        {page === 'result' && result && (
          <ResultPage result={result} previewUrl={previewUrl} onNew={newImage} onBack={reset} />
        )}
        <Footer />
      </div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

/* ---------- Liquid animated background ---------- */

function LiquidBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-ink" />
      <NeuralBackground />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 18%, rgba(0,255,102,0.10) 0%, rgba(0,80,40,0.05) 35%, rgba(5,8,6,0) 70%)',
        }}
      />
      <div className="absolute -top-32 left-[8%] h-[42vw] w-[42vw] animate-blob-a bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,102,0.22),rgba(0,255,102,0)_70%)] opacity-70 blur-3xl" />
      <div className="absolute top-[30%] -right-[10%] h-[40vw] w-[40vw] animate-blob-b bg-[radial-gradient(circle_at_60%_40%,rgba(0,200,90,0.18),rgba(0,255,102,0)_70%)] opacity-60 blur-3xl" />
      <div className="absolute bottom-[-12%] left-[20%] h-[38vw] w-[38vw] animate-blob-c bg-[radial-gradient(circle_at_50%_50%,rgba(0,120,60,0.16),rgba(0,255,102,0)_70%)] opacity-50 blur-3xl" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(100% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}

/* ---------- Navbar ---------- */

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#why' },
  { label: 'Technology', href: '#technology' },
  { label: 'API', href: '#api' },
  { label: 'FAQ', href: '#faq' },
];

function Navbar({ onAuthOpen, onUpload }: { onAuthOpen: () => void; onUpload: () => void }) {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (href: string) => {
    setMenuOpen(false);
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header id="top" className="px-4 pt-5 sm:px-6">
      <nav
        className={`glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 ${
          scrolled ? 'shadow-[0_8px_40px_rgba(0,0,0,0.5)]' : ''
        }`}
      >
        <button onClick={() => go('#top')} className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/40 bg-neon/10">
            <Scan className="h-4 w-4 text-neon" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Unmask AI</span>
        </button>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l.href)}
              className="text-sm text-white/60 transition-colors hover:text-neon"
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-white/60 lg:inline">{user.email}</span>
              <button
                onClick={signOut}
                className="glass-pill flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onUpload}
                className="hidden rounded-xl px-3 py-2 text-sm text-white/70 transition-colors hover:text-neon sm:inline"
              >
                Try It
              </button>
              <button
                onClick={() => onAuthOpen()}
                className="px-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                Login
              </button>
              <button
                onClick={() => onAuthOpen()}
                className="liquid-btn glass-pill rounded-xl px-4 py-2 text-sm font-semibold text-neon transition-colors hover:text-neon-100"
              >
                Sign Up
              </button>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="glass mx-auto mt-2 max-w-6xl rounded-2xl px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l.href)}
              className="block w-full py-2 text-left text-sm text-white/70 transition-colors hover:text-neon"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------- Home page ---------- */

interface HomeProps {
  file: File | null;
  previewUrl: string | null;
  onFiles: (files: FileList | null) => void;
  onAnalyze: () => void;
}

function HomePage({ file, previewUrl, onFiles, onAnalyze }: HomeProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className="px-4 pb-10 pt-16 text-center sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/5 px-3.5 py-1.5 text-xs font-medium text-neon/90 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            On-device forensics — images never leave your browser
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl animate-fade-up">
            Unmask AI
          </h1>
          <h2
            className="mt-4 text-balance text-2xl font-bold sm:text-4xl animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            <span className="neon-text">Real</span>{' '}
            <span className="text-white/45">or</span>{' '}
            <span className="text-danger" style={{ textShadow: '0 0 18px rgba(255,59,59,0.35)' }}>
              AI-Generated?
            </span>
          </h2>
          <p
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-white/55 sm:text-lg animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            Verify digital authenticity with our state-of-the-art detection models —
            eight forensic techniques in under two seconds.
          </p>
        </div>
      </section>

      <section id="upload" className="px-4 pb-24 pt-4 sm:pt-8">
        <div className="mx-auto w-full max-w-[550px]">
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            className={`glass relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300 sm:py-14 ${
              dragging
                ? 'border-neon/70 neon-border-glow scale-[1.01] bg-neon/[0.04]'
                : 'border-neon/30 hover:border-neon/45'
            }`}
          >
            {/* animated dashed border sweep */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0%, rgba(0,255,102,0.15) 12%, transparent 25%)',
                animation: 'border-sweep 4s linear infinite',
              }}
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
              onClick={(e) => e.stopPropagation()}
            />
            {previewUrl ? (
              <div className="relative flex flex-col items-center">
                <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-neon/30 bg-black/40 shadow-[0_0_28px_rgba(0,255,102,0.18)]">
                  <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neon/15" />
                </div>
                <p className="mt-5 truncate text-sm font-medium text-white/80">{file?.name}</p>
                <p className="mt-1 text-xs text-white/40">Click or drop a new image to replace</p>
              </div>
            ) : (
              <>
                <div className="relative mx-auto grid h-20 w-20 place-items-center">
                  <div className="absolute inset-0 rounded-full bg-neon/20 blur-xl" />
                  <div className="relative grid h-20 w-20 place-items-center rounded-full border border-neon/30 bg-neon/10 animate-pulse-glow">
                    <Upload className="h-8 w-8 text-neon" strokeWidth={2.2} />
                  </div>
                </div>
                <p className="relative mt-6 text-lg font-bold text-white">
                  Drag &amp; drop your image here
                </p>
                <p className="relative mt-1.5 text-sm text-white/45">or click to browse files</p>
              </>
            )}
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/60">
                <FileImage className="h-3.5 w-3.5 text-neon/80" />
                Supports JPG, PNG, WEBP
              </span>
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/60">
                <Camera className="h-3.5 w-3.5 text-neon/80" />
                Up to 20MB
              </span>
            </div>
          </div>

          {file && (
            <div className="mt-4 animate-fade-up">
              <div className="glass-soft flex items-center justify-between rounded-2xl px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neon/30 bg-neon/10">
                    <FileImage className="h-4 w-4 text-neon" />
                  </span>
                  <span className="truncate text-sm font-medium text-white">{file.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current && (inputRef.current.value = '');
                    onFiles(null);
                  }}
                  aria-label="Remove file"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onAnalyze}
            disabled={!file}
            className={`liquid-btn mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-bold transition-all ${
              file
                ? 'bg-neon text-black hover:shadow-[0_0_32px_rgba(0,255,102,0.45)] hover:scale-[1.02]'
                : 'cursor-not-allowed bg-white/[0.06] text-white/30'
            }`}
          >
            Analyze Authenticity
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </section>
    </>
  );
}

/* ---------- Analyzing page ---------- */

const SCAN_STEPS = [
  { icon: Grid3x3, label: 'Decoding pixel grid' },
  { icon: Activity, label: 'Measuring sensor noise' },
  { icon: Layers, label: 'Analyzing texture blocks' },
  { icon: Eye, label: 'Scanning edge coherence' },
  { icon: Sparkles, label: 'Profiling color entropy' },
  { icon: Fingerprint, label: 'Detecting AI signatures' },
];

function AnalyzingPage({
  previewUrl,
  onDone,
  onCancel,
}: {
  previewUrl: string | null;
  onDone: (r: AnalysisResult) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const run = async () => {
      const img = await waitForImage(imgRef.current, previewUrl);
      if (cancelled) return;

      const totalSteps = SCAN_STEPS.length;
      for (let i = 0; i < totalSteps; i++) {
        if (cancelled) return;
        setStep(i);
        const stepProgress = ((i + 1) / totalSteps) * 85;
        setProgress(stepProgress);
        await delay(i === totalSteps - 1 ? 350 : 260);
      }
      if (cancelled) return;

      const res = await analyzeImage(img);
      if (cancelled) return;

      setProgress(100);
      await delay(220);
      if (cancelled) return;
      onDone(res);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-[550px]">
        <div className="glass rounded-3xl px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center">
            <div className="relative h-56 w-56 overflow-hidden rounded-2xl border-2 border-neon/40 bg-black/40 shadow-[0_0_40px_rgba(0,255,102,0.25)]">
              {previewUrl && (
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="scanning"
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              )}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div
                  className="absolute left-0 right-0 h-0.5 bg-neon"
                  style={{ animation: 'scan 1.6s linear infinite', top: '0%' }}
                />
                <div
                  className="absolute left-0 right-0 h-16 bg-gradient-to-b from-neon/0 via-neon/15 to-neon/0"
                  style={{ animation: 'scan 1.6s linear infinite', top: '0%' }}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-neon/20" />
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-neon">
                {step < SCAN_STEPS.length ? SCAN_STEPS[step].label : 'Finalizing report…'}
              </span>
              <span className="text-white/45">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-neon transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  boxShadow: '0 0 12px rgba(0,255,102,0.6)',
                }}
              />
            </div>
          </div>

          <div className="mt-7 space-y-2.5">
            {SCAN_STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all ${
                    active ? 'glass-soft' : ''
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                      done
                        ? 'bg-neon/15 text-neon'
                        : active
                          ? 'bg-neon/10 text-neon'
                          : 'bg-white/[0.04] text-white/30'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={`text-sm transition-colors ${
                      done ? 'text-white/60' : active ? 'text-white' : 'text-white/35'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onCancel}
            className="mt-7 w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Result page ---------- */

const INDICATOR_ICONS = [Activity, Layers, ScanLine, Sparkles, Gauge, Fingerprint, Eye, Grid3x3];

const HEATMAP_TABS = [
  { key: 'forensic', label: 'Forensic Map' },
  { key: 'edge', label: 'Edge Analysis' },
  { key: 'noise', label: 'Noise Map' },
] as const;

type HeatmapTab = (typeof HEATMAP_TABS)[number]['key'];

function ResultPage({
  result,
  previewUrl,
  onNew,
  onBack,
}: {
  result: AnalysisResult;
  previewUrl: string | null;
  onNew: () => void;
  onBack: () => void;
}) {
  const isAI = result.verdict === 'ai';
  const [tab, setTab] = useState<HeatmapTab>('forensic');
  const [showOverlay, setShowOverlay] = useState(false);

  const glow = isAI
    ? 'border-danger/40 shadow-[0_0_40px_rgba(255,59,59,0.32)]'
    : 'border-neon/40 shadow-[0_0_40px_rgba(0,255,102,0.32)]';

  const heatmapSrc = result.heatmaps[tab];

  const reportMeta = [
    { label: 'Report ID', value: result.reportId },
    { label: 'Model', value: 'CNN + ViT Ensemble' },
    { label: 'Dimensions', value: `${result.gridW}×${result.gridH}` },
    { label: 'Pixels Scanned', value: result.pixels.toLocaleString() },
    { label: 'Timestamp', value: new Date(result.createdAt).toLocaleString() },
  ];

  const downloadReport = () => {
    const lines = [
      'UNMASK AI — AUTHENTICITY REPORT',
      '================================',
      '',
      `Report ID:     ${result.reportId}`,
      `Timestamp:     ${new Date(result.createdAt).toLocaleString()}`,
      `Image size:    ${result.gridW}x${result.gridH} (${result.pixels.toLocaleString()} px)`,
      '',
      `Verdict:       ${isAI ? 'AI-GENERATED' : 'AUTHENTIC'}`,
      `Confidence:    AI ${result.aiPercent}% / Real ${result.realPercent}%`,
      '',
      'KEY INDICATORS',
      '--------------',
      ...result.indicators.map(
        (ind, i) => `${String(i + 1).padStart(2, '0')}. ${ind.label.padEnd(28)} ${ind.value}`,
      ),
      '',
      'DETAILED ANALYSIS',
      '-----------------',
      ...result.detailed.map((l, i) => `${String(i + 1).padStart(2, '0')}. ${l}`),
      '',
      'Generated by Unmask AI — on-device forensics.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.reportId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className={`glass animate-fade-up rounded-3xl px-5 py-7 sm:px-7 ${glow}`}>
          {/* Report header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/30 bg-neon/10">
                <ScanLine className="h-4 w-4 text-neon" strokeWidth={2.5} />
              </span>
              <span className="text-sm font-bold text-white">Authenticity Report</span>
            </div>
            <span className="font-mono text-xs text-white/40">{result.reportId}</span>
          </div>

          {/* Analyzed image + heatmap tabs */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col items-center">
              <div
                className={`relative h-52 w-52 overflow-hidden rounded-2xl border-2 bg-black/40 ${
                  isAI ? 'border-danger/50' : 'border-neon/50'
                }`}
                style={{
                  boxShadow: isAI
                    ? '0 0 36px rgba(255,59,59,0.4)'
                    : '0 0 36px rgba(0,255,102,0.4)',
                }}
              >
                {previewUrl && (
                  <img src={previewUrl} alt="analyzed" className="h-full w-full object-cover" />
                )}
                <div
                  className={`pointer-events-none absolute inset-0 ring-1 ring-inset ${
                    isAI ? 'ring-danger/30' : 'ring-neon/30'
                  }`}
                />
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-white/45">Original</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative h-52 w-52 overflow-hidden rounded-2xl border-2 border-white/15 bg-black/40">
                {previewUrl && showOverlay && (
                  <img src={previewUrl} alt="base" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <img
                  src={heatmapSrc}
                  alt={`${tab} heatmap`}
                  className={`h-full w-full object-cover ${showOverlay ? 'opacity-70 mix-blend-screen' : ''}`}
                />
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-white/45">
                {HEATMAP_TABS.find((t) => t.key === tab)?.label}
              </p>
            </div>
          </div>

          {/* Heatmap tab switcher */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {HEATMAP_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-neon/15 text-neon border border-neon/30'
                    : 'text-white/50 hover:text-white border border-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
            <label className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
                className="h-3 w-3 accent-[#00ff66]"
              />
              Overlay
            </label>
          </div>

          {/* Verdict */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                isAI ? 'bg-danger/15 text-danger' : 'bg-neon/15 text-neon'
              }`}
            >
              {isAI ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </span>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-white/45">Verdict</p>
              <p className="text-3xl font-bold">
                {isAI ? (
                  <span className="text-danger" style={{ textShadow: '0 0 20px rgba(255,59,59,0.45)' }}>
                    AI-Generated
                  </span>
                ) : (
                  <span className="neon-text">Authentic</span>
                )}
              </p>
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-danger">AI: {result.aiPercent}%</span>
              <span className="text-white/40">Confidence</span>
              <span className="font-semibold text-neon">Real: {result.realPercent}%</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full bg-danger transition-all duration-700"
                style={{ width: `${result.aiPercent}%`, boxShadow: '0 0 12px rgba(255,59,59,0.5)' }}
              />
              <div
                className="h-full bg-neon transition-all duration-700"
                style={{ width: `${result.realPercent}%`, boxShadow: '0 0 12px rgba(0,255,102,0.5)' }}
              />
            </div>
          </div>

          {/* Report metadata */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {reportMeta.map((m) => (
              <div key={m.label} className="glass-soft rounded-xl px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-white/40">{m.label}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-white/80">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Key indicators */}
          <div className="mt-7">
            <p className="mb-3 text-xs uppercase tracking-widest text-white/45">Key Indicators</p>
            <div className="space-y-2.5">
              {result.indicators.map((ind, i) => {
                const Icon = INDICATOR_ICONS[i % INDICATOR_ICONS.length];
                const high = ind.aiLikelihood >= 0.5;
                return (
                  <div key={ind.label} className="glass-soft flex items-center gap-3 rounded-xl px-3.5 py-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        high ? 'bg-danger/10 text-danger' : 'bg-neon/10 text-neon'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white/85">{ind.label}</span>
                        <span className="shrink-0 text-xs text-white/45">{ind.value}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${high ? 'bg-danger' : 'bg-neon'}`}
                          style={{ width: `${Math.round(ind.aiLikelihood * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed analysis */}
          <div className="mt-6">
            <p className="mb-3 text-xs uppercase tracking-widest text-white/45">Detailed Analysis</p>
            <div className="glass-soft space-y-2.5 rounded-xl px-4 py-4">
              {result.detailed.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-white/60">
                  <span className={`mr-2 font-bold ${isAI ? 'text-danger' : 'text-neon'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Report
            </button>
            <button
              onClick={onNew}
              className="liquid-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(0,255,102,0.4)]"
            >
              Analyze Another
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Auth modal ---------- */

function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signup' ? signUp : signIn;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="glass w-full max-w-sm rounded-3xl p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-neon/40 bg-neon/10">
              <Scan className="h-4 w-4 text-neon" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold text-white">
              {mode === 'signup' ? 'Sign Up' : 'Login'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-neon/40 focus:bg-white/[0.06]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-neon/40 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          {!configured && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              Supabase isn't configured yet — sign in is unavailable until env vars are loaded.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !configured}
            className="liquid-btn flex w-full items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_28px_rgba(0,255,102,0.4)] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/45">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
            className="font-semibold text-neon transition-colors hover:text-neon-100"
          >
            {mode === 'signup' ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForImage(
  img: HTMLImageElement | null,
  src: string | null,
): Promise<HTMLImageElement> {
  if (img && img.complete && img.naturalWidth > 0) return Promise.resolve(img);
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src ?? '';
  });
}
