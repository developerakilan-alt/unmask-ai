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
    <div className="fixed bottom-5 left-5 z-[90] w-[calc(100%-2.5rem)] max-w-sm">
      <div className="glass rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
            <Cookie className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white/90">We respect your privacy</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              We only store a lightweight preference in your browser. Uploaded images are processed in memory and
              never stored. See our{' '}
              <a href="#/privacy" className="text-neon">
                Privacy Policy
              </a>
              .
            </p>
            <div className="mt-3 flex gap-2">
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
    </div>
  );
}
