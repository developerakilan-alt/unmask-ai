import { useEffect, useState } from 'react';
import { BadgeCheck, Flame, Image as ImageIcon, ArrowUp } from 'lucide-react';
import { isSupabaseConfigured, getSupabase } from '../lib/supabase';

interface GalleryItem {
  id: string;
  image_url?: string;
  label: string;
  kind: 'ai' | 'real';
  source?: string;
  votes: number;
  verified: boolean;
}

const FALLBACK: GalleryItem[] = [
  { id: 'f1', label: 'Synthetic portrait', kind: 'ai', source: 'StyleGAN', votes: 412, verified: true },
  { id: 'f2', label: 'Mobile photo', kind: 'real', source: 'iPhone 15', votes: 388, verified: true },
  { id: 'f3', label: 'Text-to-image scene', kind: 'ai', source: 'Midjourney v6', votes: 351, verified: true },
  { id: 'f4', label: 'DSLR landscape', kind: 'real', source: 'Sony A7 IV', votes: 297, verified: false },
  { id: 'f5', label: 'Deepfake face', kind: 'ai', source: 'face-swap', votes: 264, verified: true },
  { id: 'f6', label: 'Document scan', kind: 'real', source: 'scanner', votes: 233, verified: false },
];

function hashGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = (h & 0xffffff) >>> 0;
  const r1 = (a >> 16) & 0xff, g1 = (a >> 8) & 0xff, b1 = a & 0xff;
  const r2 = (255 - r1) >> 0, g2 = (g1 + 80) % 256, b2 = (b1 + 120) % 256;
  return `linear-gradient(135deg, rgb(${r1},${g1},${b1}) 0%, rgb(${r2},${g2},${b2}) 100%)`;
}

export default function CommunityGallery({ onJoinWaitlist }: { onJoinWaitlist?: () => void }) {
  const [items, setItems] = useState<GalleryItem[]>(FALLBACK);
  const [live, setLive] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('community_images')
          .select('id, image_url, note, kind, source, votes, verified')
          .order('votes', { ascending: false })
          .limit(9);
        if (error) throw error;
        if (data && data.length > 0) {
          setItems(
            data.map((d) => ({
              id: d.id,
              image_url: d.image_url ?? undefined,
              label: d.note || 'Community submission',
              kind: d.kind === 'real' ? 'real' : 'ai',
              source: d.source ?? undefined,
              votes: d.votes ?? 0,
              verified: !!d.verified,
            })),
          );
          setLive(true);
        }
      } catch (e) {
        console.warn('[gallery] live load failed, using fallback', e);
      }
    })();
  }, []);

  const vote = (id: string) => {
    if (voted.has(id)) return;
    setVoted((prev) => new Set(prev).add(id));
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, votes: it.votes + 1 } : it)));
    if (live) {
      getSupabase()
        .from('community_images')
        .update({ votes: (items.find((it) => it.id === id)?.votes ?? 0) + 1 })
        .eq('id', id)
        .then(() => {}, () => {});
    }
  };

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neon">Community gallery</p>
        <h2 className="font-equinox mt-3 text-3xl font-bold text-white sm:text-4xl">Real images. Fakes. Verified.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/50">
          Members submit images they've confirmed as AI-generated or real. Every verified entry carries a forensic
          badge — browse the patterns, then test your own.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-transform duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="relative aspect-square">
              {it.image_url ? (
                <img src={it.image_url} alt={it.label} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: hashGradient(it.id) }}>
                  <ImageIcon className="h-8 w-8 text-black/30" />
                </div>
              )}
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                  it.kind === 'ai' ? 'bg-danger/80 text-white' : 'bg-neon/80 text-black'
                }`}
              >
                {it.kind === 'ai' ? 'AI' : 'Real'}
              </span>
              {it.verified && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold text-neon backdrop-blur-md">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-6">
                <p className="truncate text-[11px] font-semibold text-white">{it.label}</p>
                {it.source && <p className="truncate text-[9px] text-white/50">{it.source}</p>}
              </div>
            </div>
            <button
              onClick={() => vote(it.id)}
              className={`flex w-full items-center justify-center gap-1.5 py-2 text-[10px] font-semibold transition-colors ${
                voted.has(it.id) ? 'bg-neon/15 text-neon' : 'bg-white/[0.02] text-white/45 hover:text-neon'
              }`}
            >
              <ArrowUp className="h-3 w-3" /> {it.votes}
            </button>
          </div>
        ))}
      </div>

      {!live && (
        <p className="mt-4 text-center text-[10px] text-white/30">
          Live gallery syncs when Supabase is configured. Showing sample entries now.
        </p>
      )}

      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/50">
          <Flame className="h-3.5 w-3.5 text-amber-400" /> Verified entries are scored by the same forensic pipeline used
          for live scans.
        </div>
        {onJoinWaitlist && (
          <button
            onClick={onJoinWaitlist}
            className="liquid-btn rounded-xl border border-neon/30 bg-neon/10 px-5 py-2.5 text-sm font-bold text-neon transition-all hover:bg-neon/20 hover:shadow-[0_0_24px_rgba(88,221,242,0.2)]"
          >
            Submit yours — join the waitlist
          </button>
        )}
      </div>
    </section>
  );
}
