import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

export default function GDPRConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('unmask-gdpr')) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  const choose = (value: string) => {
    try {
      localStorage.setItem('unmask-gdpr', value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10">
      <div className="glass w-full rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
            <Cookie className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/50">
            <span className="font-semibold text-white/90">We respect your privacy.</span>{' '}
            Uploaded images are processed in memory and never stored. See our{' '}
            <a href="#/privacy" className="text-neon">
              Privacy Policy
            </a>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => choose('accepted')}
              className="rounded-lg bg-neon px-3 py-1.5 text-xs font-bold text-black"
            >
              Accept
            </button>
            <button
              onClick={() => choose('dismissed')}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
