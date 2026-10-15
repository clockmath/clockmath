'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Info } from 'lucide-react';

/**
 * A small ⓘ that reveals one tool hint. Replaces the grey helper lines that
 * cluttered the tools (Oct 2026). Opens on tap/click (phones have no hover),
 * on mouse hover, and from the keyboard; closes on Escape, a tap outside, or
 * the mouse leaving. Disclosure pattern rather than role="tooltip" because a
 * hint may contain a link. Use sparingly — one per non-obvious control.
 */
export default function InfoTip({
  label,
  children,
}: {
  /** What the hint is about, for the button's accessible name. */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false); // opened by tap/click, not hover
  const id = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Horizontal nudge (px) that keeps the panel on screen: icons near the
  // right edge of a phone would otherwise push it off the side.
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) {
      setShift(0);
      return;
    }
    const margin = 8;
    // clientWidth, not innerWidth: on phones innerWidth grows to fit content
    // that overflows — including this panel — so it can't be the limit.
    const vw = document.documentElement.clientWidth;
    const r = panelRef.current.getBoundingClientRect();
    const base = r.left - shift; // position without the current nudge
    const width = r.width;
    let next = 0;
    if (base + width > vw - margin) next = vw - margin - width - base;
    if (base + next < margin) next = margin - base;
    if (next !== shift) setShift(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setPinned(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  const hoverOpen = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || pinned) return;
    // Small delay so the pointer can travel from the icon into the panel.
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <span ref={rootRef} className="relative inline-flex align-middle" onPointerEnter={hoverOpen} onPointerLeave={hoverClose}>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (open && pinned) close();
          else {
            setOpen(true);
            setPinned(true);
          }
        }}
        className="inline-grid place-items-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <span
        ref={panelRef}
        id={id}
        hidden={!open}
        // `left`, not a transform: a transformed panel still widens the page
        // by its original box while open (sideways scroll on phones).
        style={{ left: shift }}
        className="absolute top-full mt-1.5 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border dark:border-slate-600 bg-card dark:bg-slate-800 shadow-md px-3 py-2 text-xs leading-relaxed font-normal normal-case tracking-normal text-left text-muted-foreground dark:text-slate-300"
      >
        {children}
      </span>
    </span>
  );
}
