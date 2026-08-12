import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  BookOpen,
  TerminalSquare,
  HeartPulse,
  ShieldCheck,
  FileText,
  Home,
  ArrowRight,
} from 'lucide-react';
import { navigate } from '../lib/router';

interface Action {
  id: string;
  label: string;
  hint: string;
  icon: typeof Home;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const ROUTES: { label: string; hint: string; icon: typeof Home; route: string }[] = [
  { label: 'Home', hint: 'Go to homepage', icon: Home, route: 'home' },
  { label: 'Dashboard', hint: 'Scan history, API keys, webhooks', icon: LayoutDashboard, route: 'dashboard' },
  { label: 'API Docs', hint: 'Developer documentation', icon: BookOpen, route: 'docs' },
  { label: 'API Playground', hint: 'Test the detection API', icon: TerminalSquare, route: 'playground' },
  { label: 'System Status', hint: 'Live service health', icon: HeartPulse, route: 'status' },
  { label: 'Privacy Policy', hint: 'How we handle your data', icon: ShieldCheck, route: 'privacy' },
  { label: 'Terms of Service', hint: 'Usage terms', icon: FileText, route: 'terms' },
];

const SECTIONS: { label: string; hint: string; id: string }[] = [
  { label: 'Features', hint: 'Scroll to How It Works', id: 'features' },
  { label: 'Technology', hint: 'Scroll to Detection Technologies', id: 'technology' },
  { label: 'API', hint: 'Scroll to Developer API', id: 'api' },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo<Action[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Action[] = [];
    if (!q) {
      SECTIONS.forEach((s) =>
        out.push({
          id: `s-${s.id}`,
          label: s.label,
          hint: s.hint,
          icon: ArrowRight,
          run: () => {
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
            onClose();
          },
        }),
      );
      ROUTES.forEach((r) =>
        out.push({
          id: `r-${r.route}`,
          label: r.label,
          hint: r.hint,
          icon: r.icon,
          run: () => {
            navigate(r.route);
            onClose();
          },
        }),
      );
      return out;
    }
    for (const s of SECTIONS) {
      if (s.label.toLowerCase().includes(q) || s.hint.toLowerCase().includes(q)) {
        out.push({ id: `s-${s.id}`, label: s.label, hint: s.hint, icon: ArrowRight, run: () => { document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); onClose(); } });
      }
    }
    for (const r of ROUTES) {
      if (r.label.toLowerCase().includes(q) || r.hint.toLowerCase().includes(q)) {
        out.push({ id: `r-${r.route}`, label: r.label, hint: r.hint, icon: r.icon, run: () => { navigate(r.route); onClose(); } });
      }
    }
    return out;
  }, [query, onClose]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => (a + 1) % Math.max(actions.length, 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => (a - 1 + Math.max(actions.length, 1)) % Math.max(actions.length, 1));
      }
      if (e.key === 'Enter' && actions[active]) {
        e.preventDefault();
        actions[active].run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, actions, active, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = useCallback((a: Action) => a.run(), []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="glass w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <Search className="h-4 w-4 text-white/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, sections…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                aria-label="Search"
              />
              <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {actions.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-white/40">No matches for “{query}”.</p>
              )}
              {actions.map((a, i) => (
                <button
                  key={a.id}
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(a)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active === i ? 'bg-neon/10 text-white' : 'text-white/60'
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${active === i ? 'border-neon/30 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-white/50'}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{a.label}</span>
                    <span className="block truncate text-xs text-white/35">{a.hint}</span>
                  </span>
                  {active === i && <ArrowRight className="h-4 w-4 shrink-0 text-neon" />}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
