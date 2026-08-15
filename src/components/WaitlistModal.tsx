import { useState } from 'react';
import { X, Mail, Check, Loader2, PartyPopper } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { joinWaitlist } from '../lib/waitlist';

export default function WaitlistModal({ onClose, source = 'site' }: { onClose: () => void; source?: string }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || done) return;
    setBusy(true);
    setError(null);
    const res = await joinWaitlist(email, source);
    setBusy(false);
    if (!res.ok) {
      setError(res.message ?? 'Something went wrong.');
      return;
    }
    setDone(true);
  };

  return (
    <ModalShell label="Join the waitlist" onClose={onClose}>
      <div className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0f1a]/95 p-7 shadow-2xl backdrop-blur-xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {done ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon/15 text-neon">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-white">You're on the list!</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">
              We'll email <span className="font-semibold text-neon">{email.trim()}</span> the moment early
              access opens. No spam, unsubscribe anytime.
            </p>
            <button
              onClick={onClose}
              className="liquid-btn mt-5 rounded-xl bg-neon px-6 py-2.5 text-sm font-bold text-black"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Mail className="h-5 w-5 text-neon" /> Join the early-access list
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">
              Get notified when Unmask AI launches the full API, community gallery and pro plans.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 outline-none transition-colors placeholder:text-white/30 focus:border-neon/50"
              />
              {error && <p className="text-xs font-medium text-danger">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="liquid-btn flex w-full items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {busy ? 'Signing up…' : 'Notify me'}
              </button>
              <p className="text-center text-[10px] text-white/30">We'll only use this to send waitlist updates.</p>
            </form>
          </>
        )}
      </div>
    </ModalShell>
  );
}
