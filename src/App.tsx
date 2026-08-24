import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { type AnalysisResult } from './api';
import { parseHash, type Route } from './lib/router';
import { SmoothScroll } from './lib/smooth';
import { initScrollReveals } from './lib/scrollReveal';
import { compressImage } from './lib/image';
import { saveResult } from './lib/history';
import { enableRipple } from './lib/ripple';

import FlowWaveBackground from './components/FlowWaveBackground';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import AuthModal from './components/AuthModal';
import ImageEditor from './components/ImageEditor';
import ScrollProgress from './components/ScrollProgress';
import NotFoundPage from './components/NotFoundPage';
import GDPRConsent from './components/GDPRConsent';
import SplashScreen from './components/SplashScreen';
import BackToTop from './components/BackToTop';
import InstallPrompt from './components/InstallPrompt';
import { PageSkeleton } from './components/Skeleton';

// Route pages are lazy-loaded so the landing page ships first.
const AnalyzingPage = lazy(() => import('./components/AnalyzingPage'));
const ResultPage = lazy(() => import('./components/ResultPage'));
const ShareView = lazy(() => import('./components/ShareView'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const DocsPage = lazy(() => import('./components/DocsPage'));
const PlaygroundPage = lazy(() => import('./components/PlaygroundPage'));
const StatusPage = lazy(() => import('./components/StatusPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));
const ComparePanel = lazy(() => import('./components/ComparePanel'));
const VideoAnalyzer = lazy(() => import('./components/VideoAnalyzer'));
const SourceChecker = lazy(() => import('./components/SourceChecker'));
const FeaturesPage = lazy(() => import('./components/FeaturesPage'));
const WidgetPage = lazy(() => import('./components/WidgetPage'));
const CalibrationPage = lazy(() => import('./components/CalibrationPage'));
const HowItWorksSection = lazy(() => import('./components/HowItWorks'));
const AboutSection = lazy(() => import('./components/ResearchSection'));
import PricingModal from './components/PricingModal';

type Flow = 'home' | 'analyzing' | 'result';

function RouteFallback() {
  return <PageSkeleton />;
}

export default function App() {
  const [route, setRoute] = useState<Route | null>(() => parseHash());
  const [flow, setFlow] = useState<Flow>('home');
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // GSAP ScrollTrigger reveals for the home page's top-level sections.
  useLayoutEffect(() => {
    if (route || flow !== 'home') return;
    return initScrollReveals();
  }, [route, flow]);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    enableRipple();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    (file: File) => {
      const okType = /image\/(jpeg|jpg|png|webp)/i.test(file.type);
      const okExt = /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!okType && !okExt) return;
      setFile(file);
      setSourceUrl(null);
      setResult(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      handleFile(files[0]);
    },
    [handleFile],
  );

  const startAnalysis = useCallback(async () => {
    if (!file) return;
    const opt = await compressImage(file);
    setFile(opt.file);
    if (opt.compressed) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(opt.file));
    }
    setFlow('analyzing');
    window.scrollTo(0, 0);
  }, [file, previewUrl]);

  const onAnalyzed = (res: AnalysisResult) => {
    setResult(res);
    setFlow('result');
    window.scrollTo(0, 0);
    saveResult(res);
  };

  const reset = () => setFlow('home');

  const newImage = () => {
    setFile(null);
    setSourceUrl(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setFlow('home');
  };

  const removeFile = () => {
    setFile(null);
    setSourceUrl(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const applyEdited = (edited: File) => {
    handleFile(edited);
    setEditing(false);
  };

  const onStatic =
    route &&
    ['dashboard', 'docs', 'playground', 'status', 'privacy', 'terms', 'compare', 'video', 'source', 'calibration'].includes(route.name);

  // The widget route is a bare analyzer meant to run inside an iframe —
  // no chrome, no smooth scroll, no background.
  if (route?.name === 'widget') {
    return (
      <Suspense fallback={null}>
        <WidgetPage />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden font-equinox">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-neon focus:focus:px-4 focus:focus:py-2 focus:text-sm focus:font-bold focus:text-black"
      >
        Skip to content
      </a>
      <FlowWaveBackground />
      <ScrollProgress />
      <BackToTop />
      <InstallPrompt />
      <SplashScreen />
      <SmoothScroll>
          <div className="relative z-10">
            <main id="main">
            <Navbar onAuthOpen={() => setAuthOpen(true)} onPricingOpen={() => setPricingOpen(true)} />

          {route?.name === 'share' ? (
            <Suspense fallback={<RouteFallback />}>
              <ShareView key={route.shareId} shareId={route.shareId || ''} />
            </Suspense>
          ) : route?.name === 'dashboard' ? (
            <Suspense fallback={<RouteFallback />}>
              <Dashboard />
            </Suspense>
          ) : route?.name === 'docs' ? (
            <Suspense fallback={<RouteFallback />}>
              <DocsPage />
            </Suspense>
          ) : route?.name === 'playground' ? (
            <Suspense fallback={<RouteFallback />}>
              <PlaygroundPage />
            </Suspense>
          ) : route?.name === 'status' ? (
            <Suspense fallback={<RouteFallback />}>
              <StatusPage />
            </Suspense>
          ) : route?.name === 'privacy' ? (
            <Suspense fallback={<RouteFallback />}>
              <PrivacyPage />
            </Suspense>
          ) : route?.name === 'terms' ? (
            <Suspense fallback={<RouteFallback />}>
              <TermsPage />
            </Suspense>
          ) : route?.name === 'compare' ? (
            <Suspense fallback={<RouteFallback />}>
              <ComparePanel />
            </Suspense>
          ) : route?.name === 'video' ? (
            <Suspense fallback={<RouteFallback />}>
              <VideoAnalyzer />
            </Suspense>
          ) : route?.name === 'source' ? (
            <Suspense fallback={<RouteFallback />}>
              <SourceChecker />
            </Suspense>
          ) : route?.name === 'calibration' ? (
            <Suspense fallback={<RouteFallback />}>
              <CalibrationPage />
            </Suspense>
          ) : route?.name === 'features' ? (
            <Suspense fallback={<RouteFallback />}>
              <FeaturesPage />
            </Suspense>
          ) : route?.name === 'notfound' ? (
            <NotFoundPage />
          ) : onStatic ? null : (
            <>
              {flow === 'home' && (
                <>
                  <UploadZone
                    file={file}
                    previewUrl={previewUrl}
                    onFiles={handleFiles}
                    onFile={handleFile}
                    onAnalyze={startAnalysis}
                    onRemove={removeFile}
                    onEdit={() => setEditing(true)}
                  />
                  <Suspense fallback={null}>
                    <HowItWorksSection />
                  </Suspense>
                  <Suspense fallback={null}>
                    <AboutSection />
                  </Suspense>
                </>
              )}

              {flow === 'analyzing' && (
                <Suspense fallback={<RouteFallback />}>
                  <AnalyzingPage
                    previewUrl={previewUrl}
                    file={file}
                    sourceUrl={sourceUrl}
                    onDone={onAnalyzed}
                    onCancel={reset}
                  />
                </Suspense>
              )}

              {flow === 'result' && result && (
                <Suspense fallback={<RouteFallback />}>
                  <ResultPage
                    result={result}
                    previewUrl={previewUrl}
                    onNew={newImage}
                    onBack={reset}
                  />
                </Suspense>
              )}
            </>
          )}

          <GDPRConsent />
          </main>        </div>
      </SmoothScroll>

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        {pricingOpen && <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />}
        {editing && file && (
          <ImageEditor file={file} onCancel={() => setEditing(false)} onApply={applyEdited} />
        )}
      </AnimatePresence>
    </div>
  );
}
