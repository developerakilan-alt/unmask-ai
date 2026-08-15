import { useState } from 'react';
import { AnimatedSection } from './AnimatedSection';
import TiltCard from './TiltCard';
import { Code2, ArrowRight, Play, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '../api';

export default function APIPreview({ onJoinWaitlist }: { onJoinWaitlist?: () => void }) {
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<AnalysisResult | null>(null);

  const runSample = async () => {
    if (running) return;
    setRunning(true);
    setLive(null);
    try {
      const { generateSampleImage } = await import('../lib/image');
      const { localDetectImage } = await import('../lib/localDetect');
      const file = await generateSampleImage('real');
      const result = await localDetectImage(file);
      setLive(result);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section id="api" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            API Preview
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Integrate forensic analysis into your workflow. Try the live demo below — it runs the same
            Quick Scan on your device.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <TiltCard max={5} glow className="mt-12 rounded-3xl">
            <div className="glass overflow-hidden rounded-3xl">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-danger/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-neon/60" />
                </div>
                <span className="ml-2 text-xs text-white/40">POST /api/v1/analyze</span>
                <button
                  onClick={runSample}
                  disabled={running}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-neon/25 bg-neon/10 px-3 py-1.5 text-[10px] font-bold text-neon transition-colors hover:bg-neon/20 disabled:opacity-60"
                >
                  {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  {running ? 'Analyzing…' : 'Run live sample'}
                </button>
              </div>

              {/* Code blocks */}
              <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-white/[0.06]">
                {/* Request */}
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-neon/60" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Request</span>
                  </div>
                  <pre className="text-xs leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-neon">curl</span>{' '}
                      <span className="text-white/70">-X POST</span>{' '}
                      <span className="text-yellow-400/80">/api/v1/analyze</span>{'\n'}
                      <span className="text-white/50">  -H</span>{' '}
                      <span className="text-green-400/80">"Authorization: Bearer $API_KEY"</span>{'\n'}
                      <span className="text-white/50">  -F</span>{' '}
                      <span className="text-green-400/80">"image=@photo.jpg"</span>
                    </code>
                  </pre>
                </div>

                {/* Response */}
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-neon/60" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Response</span>
                  </div>
                  <pre className="text-xs leading-relaxed overflow-x-auto">
                    <code>
                      {live ? <LiveResponse result={live} /> : <StaticResponse />}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Coming soon banner */}
              <div className="border-t border-white/[0.06] px-5 py-3 text-center">
                <span className="text-xs text-white/40">
                  API access is currently in private beta.{' '}
                  <button
                    onClick={onJoinWaitlist}
                    className="cursor-pointer font-semibold text-neon hover:text-neon-100"
                  >
                    Join waitlist
                  </button>
                </span>
              </div>
            </div>
          </TiltCard>
        </AnimatedSection>
      </div>
    </section>
  );
}

function StaticResponse() {
  return (
    <>
      <span className="text-white/40">{'{'}</span>{'\n'}
      <span className="text-white/70">  "prediction": </span>
      <span className="text-neon">"real"</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "confidence": </span>
      <span className="text-neon">0.967</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "ai_score": </span>
      <span className="text-neon">0.033</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "heatmap_url": </span>
      <span className="text-yellow-400/80">"/heatmaps/abc123.png"</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "metadata": </span>
      <span className="text-white/40">{'{'}</span>{'\n'}
      <span className="text-white/70">    "exif_found": </span>
      <span className="text-neon">true</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">    "camera": </span>
      <span className="text-yellow-400/80">"Canon EOS R5"</span>{'\n'}
      <span className="text-white/40">  {'}'}</span>{'\n'}
      <span className="text-white/40">{'}'}</span>
    </>
  );
}

function LiveResponse({ result }: { result: AnalysisResult }) {
  const exif = result.forensics?.exif;
  const camera = exif?.tags?.Model || exif?.tags?.model || null;
  return (
    <>
      <span className="text-white/40">{'{'}</span>{'\n'}
      <span className="text-white/70">  "prediction": </span>
      <span className="text-neon">"{result.classification === 'AI_GENERATED' ? 'ai' : result.classification === 'REAL' ? 'real' : 'uncertain'}"</span>
      <span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "confidence": </span>
      <span className="text-neon">{result.confidence.toFixed(3)}</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "ai_score": </span>
      <span className="text-neon">{(result.aiPercent / 100).toFixed(3)}</span><span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "model": </span>
      <span className="text-yellow-400/80">"{(result.modelUsed || 'quick-scan').replace(/"/g, '')}"</span>
      <span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">  "metadata": </span>
      <span className="text-white/40">{'{'}</span>{'\n'}
      <span className="text-white/70">    "exif_found": </span>
      <span className="text-neon">{exif ? (exif.present ? 'true' : 'false') : 'false'}</span>
      <span className="text-white/40">,</span>{'\n'}
      <span className="text-white/70">    "noise_level": </span>
      <span className="text-neon">{(result.forensics?.noise?.noise_level ?? 0).toFixed(3)}</span>
      {camera ? (
        <>
          <span className="text-white/40">,</span>{'\n'}
          <span className="text-white/70">    "camera": </span>
          <span className="text-yellow-400/80">"{camera}"</span>
        </>
      ) : null}
      {'\n'}
      <span className="text-white/40">  {'}'}</span>{'\n'}
      <span className="text-white/40">{'}'}</span>
    </>
  );
}
