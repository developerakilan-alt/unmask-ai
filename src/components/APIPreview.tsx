import { AnimatedSection } from './AnimatedSection';
import { Code2, ArrowRight } from 'lucide-react';

export default function APIPreview() {
  return (
    <section id="api" className="relative z-10 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <AnimatedSection>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            API Preview
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/50">
            Integrate forensic analysis into your workflow. API coming soon.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <div className="mt-12 glass overflow-hidden rounded-3xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-danger/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-neon/60" />
              </div>
              <span className="ml-2 text-xs text-white/40">POST /api/v1/analyze</span>
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
                  </code>
                </pre>
              </div>
            </div>

            {/* Coming soon banner */}
            <div className="border-t border-white/[0.06] px-5 py-3 text-center">
              <span className="text-xs text-white/40">
                API access is currently in private beta.{' '}
                <span className="text-neon font-semibold cursor-pointer hover:text-neon-100">Join waitlist</span>
              </span>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
