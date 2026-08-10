import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { type AnalysisResult } from './api';
import { parseHash, type Route } from './lib/router';

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
import AnalyzingPage from './components/AnalyzingPage';
import ResultPage from './components/ResultPage';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import ImageEditor from './components/ImageEditor';
import BatchPanel from './components/BatchPanel';
import Dashboard from './components/Dashboard';
import DocsPage from './components/DocsPage';
import PlaygroundPage from './components/PlaygroundPage';
import StatusPage from './components/StatusPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import ShareView from './components/ShareView';
import ReportModal from './components/ReportModal';
import GDPRConsent from './components/GDPRConsent';

type Flow = 'home' | 'analyzing' | 'result';

export default function App() {
  const [route, setRoute] = useState<Route | null>(() => parseHash());
  const [flow, setFlow] = useState<Flow>('home');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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
    setFlow('analyzing');
    window.scrollTo(0, 0);
  };

  const onAnalyzed = (res: AnalysisResult) => {
    setResult(res);
    setFlow('result');
    window.scrollTo(0, 0);
  };

  const reset = () => setFlow('home');

  const newImage = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setFlow('home');
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const applyEdited = (edited: File) => {
    setFile(edited);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(edited));
    setResult(null);
    setEditing(false);
  };

  const onStatic = route && ['dashboard', 'docs', 'playground', 'status', 'privacy', 'terms'].includes(route.name);

  return (
    <div className="relative min-h-screen overflow-hidden font-equinox">
      <LiquidBackground />
      <div className="relative z-10">
        <Navbar onAuthOpen={() => setAuthOpen(true)} />

        {route?.name === 'share' ? (
          <ShareView key={route.shareId} shareId={route.shareId || ''} />
        ) : route?.name === 'dashboard' ? (
          <Dashboard />
        ) : route?.name === 'docs' ? (
          <DocsPage />
        ) : route?.name === 'playground' ? (
          <PlaygroundPage />
        ) : route?.name === 'status' ? (
          <StatusPage />
        ) : route?.name === 'privacy' ? (
          <PrivacyPage />
        ) : route?.name === 'terms' ? (
          <TermsPage />
        ) : onStatic ? null : (
          <>
            {flow === 'home' && (
              <>
                <UploadZone
                  file={file}
                  previewUrl={previewUrl}
                  onFiles={handleFiles}
                  onAnalyze={startAnalysis}
                  onRemove={removeFile}
                  onEdit={() => setEditing(true)}
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
              <AnalyzingPage
                previewUrl={previewUrl}
                file={file}
                onDone={onAnalyzed}
                onCancel={reset}
              />
            )}

            {flow === 'result' && result && (
              <ResultPage
                result={result}
                previewUrl={previewUrl}
                onNew={newImage}
                onBack={reset}
                onReport={() => setReportOpen(true)}
              />
            )}
          </>
        )}

        <Footer />
      </div>

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        {editing && file && (
          <ImageEditor file={file} onCancel={() => setEditing(false)} onApply={applyEdited} />
        )}
        {reportOpen && (
          <ReportModal scanId={result?.scanId} onClose={() => setReportOpen(false)} />
        )}
      </AnimatePresence>

      <GDPRConsent />
    </div>
  );
}
