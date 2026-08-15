/**
 * Global click ripple. Adds a small expanding ink blob to any button, link or
 * element with role="button" on pointerdown. Elements can opt out with
 * `data-no-ripple="true"`.
 */
let enabled = false;

export function enableRipple(): void {
  if (enabled) return;
  enabled = true;

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest?.('button, a, [role="button"]');
    if (!el || !(el instanceof HTMLElement)) return;
    if (el.dataset.noRipple === 'true') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const size = Math.max(rect.width, rect.height) * 2;
    const span = document.createElement('span');
    span.className = 'ripple-ink';
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 700);
  };

  document.addEventListener('pointerdown', onPointerDown, true);
}
