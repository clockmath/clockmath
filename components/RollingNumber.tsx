/**
 * RollingNumber — ClockMath's signature numeric treatment.
 *
 * Renders a value character-by-character; when a digit changes, the new digit
 * slides up into place (split-flap style, ~180ms). Only changed digits
 * animate, so a ticking countdown rolls its seconds while the rest holds
 * still. Non-digit characters (h, m, :, commas) render statically.
 *
 * Digits are keyed by their value inside a clipping cell: a change remounts
 * the inner span, which replays the `digit-roll` CSS animation defined in
 * globals.css (disabled under prefers-reduced-motion). Screen readers get the
 * whole value as visually hidden text; the per-character spans are
 * aria-hidden. (Until the Oct 2026 review it was an aria-label on a plain
 * span, which ARIA doesn't allow and many screen readers skip, so figures
 * like gross pay and the quiz score could go unread.)
 */

import React from 'react';

interface RollingNumberProps {
  value: string | number;
  className?: string;
}

export function RollingNumber({ value, className = '' }: RollingNumberProps) {
  const text = String(value);
  return (
    <span className={`tabular-nums ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split('').map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={`cell-${i}`} className="digit-cell">
              <span key={ch} className="digit-roll">
                {ch}
              </span>
            </span>
          ) : (
            <span key={`static-${i}-${ch}`}>{ch}</span>
          ),
        )}
      </span>
    </span>
  );
}
