'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Feedback when a tool works something out (Oct 2026: pressing Calculate on
 * an unchanged answer did nothing visible, and on phones the answer was
 * usually below the screen, so the tools felt as if they hadn't run).
 */

/** Scroll an answer into view if it isn't fully on screen (instantly for reduced motion). */
export function revealIfHidden(el: HTMLElement | null): void {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (r.top >= 0 && r.bottom <= vh) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: r.height > vh ? 'start' : 'nearest' });
}

/**
 * For Calculate / Start: `round` keys the answer's tiles so every press
 * flips them again (even when the answer is the same), `updated` is true for
 * a moment after (for the button's "Updated" and the screen-reader status),
 * and the answer is brought into view.
 */
export function useCalculateFeedback(answerRef: RefObject<HTMLElement | null>) {
  const [round, setRound] = useState(0);
  const [updated, setUpdated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const confirm = useCallback(() => {
    setRound((n) => n + 1);
    setUpdated(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setUpdated(false), 1500);
    // Once the new answer has rendered
    setTimeout(() => revealIfHidden(answerRef.current), 0);
  }, [answerRef]);

  return { round, updated, confirm };
}

/**
 * For the tools that answer as you type: a count that goes up once a changed
 * answer has settled (after typing pauses), never for the first render or a
 * draft restored on arrival. Feed it to flashClass.
 */
export function useSettledChange(value: string, delay = 350): number {
  const [n, setN] = useState(0);
  const mountedAt = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (Date.now() - mountedAt.current < 1000) return;
    const id = setTimeout(() => setN((x) => x + 1), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return n;
}

/** The board's flash after a change: two class names that take turns, so each change restarts it */
export const flashClass = (n: number) => (n === 0 ? '' : n % 2 ? ' st-flash-a' : ' st-flash-b');
