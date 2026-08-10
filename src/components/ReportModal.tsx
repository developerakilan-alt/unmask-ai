import { useState } from 'react';
import { Flag, X, Send, Loader2 } from 'lucide-react';
import { reportScan } from '../api';
import { useToast } from '../lib/toast';

interface ReportModalProps {
  scanId?: string;
  onClose: () => void;
}

const REASONS = ['Wrong verdict', 'Image belongs to me', 'Offensive content', 'Other'];

export default function ReportModal({ scanId, onClose }: ReportModalProps) {
  const { push } = useToast();
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await reportScan(scanId, reason, contact);
      push('success', 'Report submitted', 'Our team will review this scan.');
      onClose();
    } catch (e) {
      push('error', 'Report failed', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Flag className="h-5 w-5 text-danger" /> Report this scan
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                reason === r
                  ? 'border-danger/40 bg-danger/10 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/25'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Your email (optional — for follow-up)"
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-neon/40"
        />

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!reason || busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-bold text-black hover:bg-danger/90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}
