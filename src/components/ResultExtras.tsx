import { useEffect, useState } from 'react';
import { Fingerprint, Camera, Globe, ShieldQuestion, AlertTriangle, BadgeCheck } from 'lucide-react';
import type { HistoryEntry } from '../lib/history';

type LooseForensics = {
  exif?: { present: boolean; note?: string; tags: Record<string, string> };
  noise?: { noise_level: number; sharpness: number };
  colour?: { saturation: number; value: number };
};

interface ResultExtrasProps {
  result: {
    attribution?: { generator: string | null; confidence: number; hints: string[] } | null;
    forensics?: LooseForensics;
    sourceUrl?: string;
    phash?: string | null;
  };
  historyEntries?: HistoryEntry[];
}

export default function ResultExtras({ result, historyEntries }: ResultExtrasProps) {
  const [matches, setMatches] = useState<HistoryEntry[]>([]);
  const [all, setAll] = useState<HistoryEntry[]>(historyEntries ?? []);

  useEffect(() => {
    if (historyEntries) {
      setAll(historyEntries);
      return;
    }
    import('../lib/history').then(({ getLocalHistory }) => setAll(getLocalHistory()));
  }, [historyEntries]);

  useEffect(() => {
    const phash = result.phash;
    if (!phash || all.length === 0) {
      setMatches([]);
      return;
    }
    import('../lib/history').then(({ findMatchingHistory }) => setMatches(findMatchingHistory(all, phash)));
  }, [result.phash, all]);

  const attr = result.attribution?.generator ? result.attribution : null;
  const cameraTags = result.forensics?.exif?.tags;
  const camera = cameraTags?.Make
    ? `${cameraTags.Make}${cameraTags.Model ? ' ' + cameraTags.Model : ''}`
    : null;
  const exifNote = result.forensics?.exif?.note;
  const hasPublicUrl = !!result.sourceUrl && /^https?:\/\//i.test(result.sourceUrl);

  if (!attr && !camera && !exifNote && matches.length === 0 && !result.phash) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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

      {(camera || exifNote || result.phash) && (
        <div className="glass rounded-2xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="h-4 w-4 text-neon" /> Origin &amp; metadata
          </h4>
          <div className="mt-2 space-y-1.5 text-xs">
            {camera && (
              <p className="flex justify-between gap-2">
                <span className="text-white/45">Camera</span>
                <span className="font-medium text-white/80">{camera}</span>
              </p>
            )}
            {exifNote && (
              <p className="flex justify-between gap-2">
                <span className="text-white/45">EXIF</span>
                <span className="font-medium text-white/80">{exifNote}</span>
              </p>
            )}
            {result.phash && (
              <p className="flex justify-between gap-2">
                <span className="text-white/45">Perceptual hash</span>
                <code className="font-mono text-[10px] text-white/60">{result.phash.slice(0, 16)}…</code>
              </p>
            )}
          </div>
          {hasPublicUrl && (
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
          )}
        </div>
      )}

      {matches.length > 0 && (
        <div className="glass rounded-2xl border-amber-400/30 p-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Seen before
          </h4>
          <p className="mt-2 text-xs text-white/55">
            This image perceptually matches {matches.length === 1 ? 'a previous scan' : `${matches.length} previous scans`} —
            it may have resurfaced elsewhere.
          </p>
          <ul className="mt-2 space-y-1">
            {matches.slice(0, 3).map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-xs text-white/50">
                <BadgeCheck className="h-3 w-3 text-amber-400/60" />
                <span className="truncate">{m.filename}</span>
                <span className="ml-auto shrink-0 text-[10px] text-white/30">{new Date(m.created_at * 1000).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
