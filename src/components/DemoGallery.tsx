import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, Camera, Loader2 } from 'lucide-react';
import { generateSampleImage, type SampleKind } from '../lib/image';

interface DemoGalleryProps {
  onFile: (file: File) => void;
  onClose: () => void;
}

const SAMPLES: { kind: SampleKind; title: string; desc: string; accent: string }[] = [
  { kind: 'ai', title: 'AI-Generated Sample', desc: 'A synthetic image with diffusion-style artifacts to test detection.', accent: 'border-danger/40' },
  { kind: 'real', title: 'Real Photo Sample', desc: 'A camera-like scene with sensor noise and natural gradients.', accent: 'border-neon/40' },
];

export default function DemoGallery({ onFile, onClose }: DemoGalleryProps) {
  const [loading, setLoading] = useState<SampleKind | null>(null);

  const pick = async (kind: SampleKind) => {
    setLoading(kind);
    try {
      const file = await generateSampleImage(kind);
      onFile(file);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="glass w-full max-w-lg rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Wand2 className="h-4 w-4 text-neon" /> Try a demo image
          </p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close samples"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLES.map((s) => (
            <button
              key={s.kind}
              onClick={() => pick(s.kind)}
              disabled={loading !== null}
              className={`glass group relative overflow-hidden rounded-2xl border-2 ${s.accent} p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(0,255,102,0.15)] disabled:cursor-wait disabled:opacity-70`}
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-neon/20 bg-neon/10">
                {loading === s.kind ? (
                  <Loader2 className="h-5 w-5 animate-spin text-neon" />
                ) : (
                  <Camera className="h-5 w-5 text-neon" />
                )}
              </div>
              <p className="mt-3 text-sm font-bold text-white">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{s.desc}</p>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/35">
          Samples are generated locally in your browser — nothing is downloaded.
        </p>
      </motion.div>
    </motion.div>
  );
}
