import { BookOpen, Code2, KeyRound, Lock, Zap } from 'lucide-react';

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/analyze',
    desc: 'Analyze a single image for AI generation. Multipart form field "file".',
    curl: "curl -X POST http://localhost:8000/api/v1/analyze \\\n  -H 'Authorization: Bearer YOUR_KEY' \\\n  -F 'file=@image.png'",
  },
  {
    method: 'POST',
    path: '/api/v1/analyze-batch',
    desc: 'Analyze up to 10 images in one request. Repeat the "files" field.',
    curl: "curl -X POST http://localhost:8000/api/v1/analyze-batch \\\n  -F 'files=@a.png' -F 'files=@b.jpg'",
  },
  {
    method: 'POST',
    path: '/api/v1/analyze-url',
    desc: 'Analyze an image fetched from a public URL (SSRF-guarded).',
    curl: "curl -X POST http://localhost:8000/api/v1/analyze-url \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"url\":\"https://example.com/image.jpg\"}'",
  },
  {
    method: 'POST',
    path: '/api/v1/face-check',
    desc: 'Run the deep detector on detected face regions.',
    curl: "curl -X POST http://localhost:8000/api/v1/face-check \\\n  -F 'file=@face.jpg'",
  },
  {
    method: 'GET',
    path: '/api/v1/scans',
    desc: 'List your scan history.',
    curl: 'curl http://localhost:8000/api/v1/scans',
  },
  {
    method: 'POST',
    path: '/api/v1/shares',
    desc: 'Create a public read-only share link for a scan.',
    curl: "curl -X POST http://localhost:8000/api/v1/shares \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"scan_id\":\"scan_xxx\"}'",
  },
  {
    method: 'POST',
    path: '/api/v1/webhooks',
    desc: 'Register a URL that receives scan.completed events.',
    curl: "curl -X POST http://localhost:8000/api/v1/webhooks \\\n  -d '{\"url\":\"https://yourapp.com/hook\"}'",
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    desc: 'Public usage counters.',
    curl: 'curl http://localhost:8000/api/v1/stats',
  },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="code-block mt-3 overflow-x-auto rounded-xl p-4 text-xs leading-relaxed text-neon-100">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <BookOpen className="h-6 w-6 text-neon" /> API Documentation
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Detect AI-generated images from your own applications. Results include classification, confidence, forensic
        indicators, a heatmap and per-signal forensics.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <KeyRound className="h-5 w-5 text-neon" />
          <h3 className="mt-2 text-sm font-bold text-white">1. Create a key</h3>
          <p className="mt-1 text-xs text-white/45">Generate an API key from your dashboard. Keys are shown once.</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <Lock className="h-5 w-5 text-neon" />
          <h3 className="mt-2 text-sm font-bold text-white">2. Authenticate</h3>
          <p className="mt-1 text-xs text-white/45">Send <code className="text-neon">Authorization: Bearer &lt;key&gt;</code>.</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <Zap className="h-5 w-5 text-neon" />
          <h3 className="mt-2 text-sm font-bold text-white">3. Analyze</h3>
          <p className="mt-1 text-xs text-white/45">POST your image and get a structured forensic report.</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  e.method === 'GET' ? 'bg-sky-500/15 text-sky-400' : e.method === 'DELETE' ? 'bg-danger/15 text-danger' : 'bg-neon/15 text-neon'
                }`}
              >
                {e.method}
              </span>
              <code className="text-sm font-medium text-white/85">{e.path}</code>
            </div>
            <p className="mt-2 text-xs text-white/50">{e.desc}</p>
            <Code>{e.curl}</Code>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-neon/20 bg-neon/[0.04] p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Code2 className="h-4 w-4 text-neon" /> Embed the widget
        </h3>
        <p className="mt-2 text-xs text-white/50">
          Add a hosted analyzer to any page with two lines. Detection runs on-device in a sandboxed iframe — nothing is
          uploaded to us.
        </p>
        <Code>{`<script src="https://unmask-ai.app/unmask-ai/unmask-ai-widget.js"></script>
<script>UnmaskWidget.init();</script>`}</Code>
        <p className="mt-3 text-xs text-white/45">
          Results arrive on your page as a <code className="text-neon">postMessage</code> with type{' '}
          <code className="text-neon">unmask:result</code>; see <code className="text-white/70">public/unmask-ai-widget.js</code> for the payload shape.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-neon/20 bg-neon/[0.04] p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Code2 className="h-4 w-4 text-neon" /> Example response
        </h3>
        <Code>
{`{
  "classification": "AI_GENERATED",
  "ai_percent": 98.4,
  "confidence": 98.2,
  "verdict": "ai",
  "indicators": [ { "label": "Sensor Noise", "aiLikelihood": 0.91, ... } ],
  "heatmap": "<base64>",
  "feature_scores": { ... },
  "forensics": { "exif": {...}, "noise": {...}, "colour": {...} },
  "scan_id": "scan_abc123",
  "debug": { "model": "Swin-B (Organika/sdxl-detector)" }
}`}
        </Code>
      </div>
    </section>
  );
}
