import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

const ToastContext = createContext<{ push: (kind: ToastKind, title: string, message?: string) => void }>({
  push: () => {},
});

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, kind, title, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-neon" />,
    error: <XCircle className="h-5 w-5 text-danger" />,
    info: <Info className="h-5 w-5 text-sky-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="glass pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 shadow-xl"
            >
              <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white/90">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-white/50">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-white/40 hover:text-white" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
