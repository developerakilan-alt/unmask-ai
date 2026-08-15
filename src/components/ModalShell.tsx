import { useEffect, useRef, type ReactNode } from 'react';

/** Trap Tab focus inside a modal container and restore focus on unmount. */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose?: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const prior = document.activeElement as HTMLElement | null;
    root.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('keydown', onKeyDown);
      prior?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}

interface ModalShellProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Accessible modal backdrop: dialog role, focus trap, Escape-to-close. */
export function ModalShell({ label, onClose, children, className = '' }: ModalShellProps) {
  const ref = useFocusTrap<HTMLDivElement>(true, onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      ref={ref}
      tabIndex={-1}
      className={`fixed inset-0 z-[95] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm outline-none ${className}`}
      onClick={onClose}
    >
      <div className="w-full" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
