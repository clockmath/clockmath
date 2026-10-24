/**
 * Line colours: like a metro map, each part of ClockMath has its own colour
 * so you know where you are at a glance. A page's line colours its answer
 * board, the rule over its main band and its tab; the tools hub shows every
 * line. The colours themselves live in components/station/lines.css (keyed by
 * data-line); this file only says which page and link belongs to which line.
 * Every colour is >= 4.5:1 against its board's numerals.
 */
export type LineId = 'time' | 'work' | 'zones' | 'sleep' | 'countdowns' | 'quiz' | 'guides';

const BY_TOOL: Record<string, LineId> = {
  calculator: 'time',
  timesheet: 'work',
  overtime: 'work',
  'decimal-hours': 'work',
  timezone: 'zones',
  'market-hours': 'zones',
  sleep: 'sleep',
  countdown: 'countdowns',
  quiz: 'quiz',
  articles: 'guides',
};

/** The line a page belongs to (StationChrome's currentTool), or none. */
export function lineForTool(tool: string): LineId | null {
  return BY_TOOL[tool] ?? null;
}

/** The line a link leads to, from its href; none for site pages. */
export function lineForHref(href: string): LineId | null {
  const path = href.replace(/\/+$/, '') || '/';
  if (path === '/') return 'time';
  if (/^\/tools\/(timesheet|overtime|decimal-hours)$/.test(path)) return 'work';
  if (/^\/tools\/(timezone|market-hours)$/.test(path)) return 'zones';
  if (path === '/tools/sleep') return 'sleep';
  if (path === '/tools/countdown' || path.startsWith('/countdown')) return 'countdowns';
  if (path === '/tools/quiz') return 'quiz';
  if (path.startsWith('/articles')) return 'guides';
  return null;
}
