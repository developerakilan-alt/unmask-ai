import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { type AnalysisResult } from './api';
import { parseHash, type Route } from './lib/router';
import { SmoothScroll } from './lib/smooth';
import { compressImage } from './lib/image';
import { saveResult } from './lib/history';

import LiquidBackground from './components/LiquidBackground';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import Statistics from './components/Statistics';
import HowItWorks from './components/HowItWorks';
import DetectionMethods from './components/DetectionMethods';
import WhyChooseUs from './components/WhyChooseUs';
import Testimonials from './components/Testimonials';
import SupportedModels from './components/SupportedModels';
import APIPreview from './components/APIPreview';
import ResearchSection from './components/ResearchSection';
import BeforeAfterDemo from './components/BeforeAfterDemo';
import WhatCanYouCheck from './components/WhatCanYouCheck';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ImageEditor from './components/ImageEditor';
import BatchPanel from './components/BatchPanel';
import ScrollProgress from './components/ScrollProgress';
import CommandPalette from './components/CommandPalette';
import NotFoundPage from './components/NotFoundPage';
import ReportModal from './components/ReportModal';
import GDPRConsent from './components/GDPRConsent';

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
const PricingModal = lazy(() => import('./components/PricingModal'));

type Flow = 'home' | 'analyzing' | 'result';

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neon/40 border-t-neon" />
        <p className="text-sm text-white/60">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route | null>(() => parseHash());
  const [flow, setFlow] = useState<Flow>('home');
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  const startUrlAnalysis = useCallback(
    (url: string) => {
      setFile(null);
      setSourceUrl(url);
      setResult(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setFlow('analyzing');
      window.scrollTo(0, 0);
    },
    [previewUrl],
  );

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
    ['dashboard', 'docs', 'playground', 'status', 'privacy', 'terms', 'compare', 'video', 'source'].includes(route.name);

  return (
    <div className="relative min-h-screen overflow-hidden font-equinox">
      <LiquidBackground />
      <ScrollProgress />
      <SmoothScroll>
        <div className="relative z-10 lg:px-44 xl:px-56">
          <Navbar
            onAuthOpen={() => setAuthOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
            onOpenPricing={() => setPricingOpen(true)}
          />

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
                    onUrl={startUrlAnalysis}
                  />
                  <section className="relative z-10 mx-auto w-full max-w-[620px] px-4 pb-10">
                    <BatchPanel />
                  </section>
                  <Statistics />
                  <HowItWorks />
                  <DetectionMethods />
                  <BeforeAfterDemo />
                  <WhatCanYouCheck />
                  <WhyChooseUs />
                  <Testimonials />
                  <SupportedModels />
                  <APIPreview />
                  <ResearchSection />
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
                    onReport={() => setReportOpen(true)}
                  />
                </Suspense>
              )}
            </>
          )}

          <Footer />
          <GDPRConsent />
        </div>
      </SmoothScroll>

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        {editing && file && (
          <ImageEditor file={file} onCancel={() => setEditing(false)} onApply={applyEdited} />
        )}
        {reportOpen && (
          <ReportModal scanId={result?.scanId} onClose={() => setReportOpen(false)} />
        )}
        {pricingOpen && (
          <Suspense fallback={null}>
            <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
