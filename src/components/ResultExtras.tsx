import { Fingerprint, Globe, ShieldQuestion, Camera, AlertTriangle } from 'lucide-react';

interface ResultExtrasProps {
  result: {
    attribution?: { generator: string | null; confidence: number; hints: string[] } | null;
    sourceUrl?: string;
  };
}

export default function ResultExtras({ result }: ResultExtrasProps) {
  const attr = result.attribution?.generator ? result.attribution : null;
  const hasPublicUrl = !!result.sourceUrl && /^https?:\/\//i.test(result.sourceUrl);

  if (!attr && !hasPublicUrl) {
    return null;
  }

  return (
    <div className="space-y-3">
      {attr && (
        <div className="glass rounded-2xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Fingerprint className="h-4 w-4 text-neon" /> Generator attribution
          </h4>
          <p className="mt-2 text-lg font-bold text-neon">
            {attr.generator}
            <span className="ml-2 text-xs font-medium text-white/40">{attr.confidence}% heuristic match</span>
          </p>
          <ul className="mt-2 space-y-1">
            {attr.hints.map((h) => (
              <li key={h} className="flex gap-1.5 text-xs text-white/55">
                <span className="text-neon">·</span> {h}
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-white/35">
            <AlertTriangle className="h-3 w-3" /> Heuristic estimate, not a verified identification.
          </p>
        </div>
      )}

      {hasPublicUrl && (
        <div className="glass rounded-2xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Globe className="h-4 w-4 text-neon" /> Reverse image search
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(result.sourceUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-white/70 hover:text-neon"
            >
              <Globe className="h-3 w-3" /> Google Lens
            </a>
            <a
              href={`https://tineye.com/search?url=${encodeURIComponent(result.sourceUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-white/70 hover:text-neon"
            >
              <ShieldQuestion className="h-3 w-3" /> TinEye
            </a>
            <a
              href={`https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(result.sourceUrl!)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-white/70 hover:text-neon"
            >
              <Camera className="h-3 w-3" /> Yandex
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
