import type { ReactNode } from 'react';

/**
 * One-line answers to the exact questions a tool page gets asked
 * ("9 to 5:30 is how many hours", "if I wake up at 6:30 when should I go to
 * bed"). Bing's AI Performance report (Oct 2026) showed Copilot citing these
 * pages ~1K times a day for questions like these, so each answer is a
 * complete, self-contained sentence in the static HTML — quotable without
 * running the tool. Callers compute the values with the tool's own helpers.
 */
export interface QuickAnswer {
  /** The bold lead, e.g. "9 AM to 5:30 PM". */
  lead: string;
  /** The rest of the sentence, e.g. "is 8 hours 30 minutes (8.5 hours)." */
  rest: ReactNode;
}

export default function QuickAnswers({ heading, intro, items }: { heading: string; intro?: ReactNode; items: QuickAnswer[] }) {
  return (
    <section className="max-w-3xl mx-auto mb-section">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">{heading}</h2>
      {intro && <p className="text-muted-foreground mb-4">{intro}</p>}
      <ul className="grid sm:grid-cols-2 gap-x-6 bg-card dark:bg-slate-800 rounded-2xl px-4 sm:px-5 py-2 border border-border/50 dark:border-slate-700/50">
        {items.map((item) => (
          <li key={item.lead} className="py-2 border-b border-border/40 dark:border-slate-700/40 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0 text-muted-foreground">
            <strong className="text-foreground font-semibold">{item.lead}</strong> {item.rest}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 510 → "8 hours 30 minutes", 480 → "8 hours", 45 → "45 minutes". */
export function durationWords(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hours = h === 1 ? '1 hour' : `${h} hours`;
  const minutes = m === 1 ? '1 minute' : `${m} minutes`;
  if (!h) return minutes;
  return m ? `${hours} ${minutes}` : hours;
}

/** 510 → "8.5 hours", 500 → "8.33 hours" (2 dp, trailing zeros dropped). */
export const decimalHoursWords = (mins: number): string => `${Number((mins / 60).toFixed(2))} hours`;
