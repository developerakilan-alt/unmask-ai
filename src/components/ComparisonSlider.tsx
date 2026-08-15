import { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';

/**
 * Before/after image comparison slider with a draggable handle.
 */
export function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel,
  afterLabel,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-white/10 bg-black/40"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <span className="overlay-label absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
        {afterLabel}
      </span>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <span className="overlay-label absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute inset-y-0 z-10 w-0.5 bg-neon" style={{ left: `${pos}%`, boxShadow: '0 0 12px rgba(88,221,242,0.7)' }} />
      <div
        className="overlay-label-strong absolute top-1/2 z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-neon/50 bg-black/70 backdrop-blur"
        style={{ left: `${pos}%` }}
      >
        <MoveHorizontal className="h-4 w-4" />
      </div>
    </div>
  );
}
