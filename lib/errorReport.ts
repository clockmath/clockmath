/**
 * The site's own error log, browser side (Nov 2026): turns an uncaught error
 * into a small report for /api/error (handleErrorApi in scripts/worker/api.js,
 * which keeps it 30 days; `npm run errors` reads it). Instead of Sentry: no
 * package, no third party, no CSP change.
 *
 * Only errors from the site's own scripts are reported. Browser extensions,
 * Google's and Clarity's scripts throw on our pages too, and "Script error."
 * (another origin's error, details hidden by the browser) says nothing, so
 * those are dropped. The page is sent as a path only: share links carry a
 * timesheet in the query string.
 */
export interface ErrorReport {
  message: string;
  source: string;
  stack: string;
  path: string;
  kind: 'error' | 'rejection';
}

export interface ErrorInput {
  message?: string;
  filename?: string;
  line?: number;
  col?: number;
  stack?: string;
  kind: 'error' | 'rejection';
}

/** Errors that say nothing we can act on. */
const NOISE = [/^Script error\.?$/i, /ResizeObserver loop/i, /^Load failed$/i, /^Failed to fetch$/i, /^NetworkError when attempting to fetch/i];
const FOREIGN = /(chrome|moz|safari-web|safari)-extension:\/\/|googletagmanager\.com|google-analytics\.com|clarity\.ms|cloudflareinsights\.com/;

export function toReport(e: ErrorInput, origin: string, pathname: string): ErrorReport | null {
  const message = (e.message || '').trim();
  if (!message || NOISE.some((r) => r.test(message))) return null;
  const stack = e.stack || '';
  // A file from another origin (an extension, a tag), or a stack that runs
  // through one and never through ours
  if (e.filename && !e.filename.startsWith(origin)) return null;
  if (FOREIGN.test(stack) && !stack.includes(origin)) return null;
  const local = (s: string) => s.split(origin).join('');
  const source = e.filename ? `${local(e.filename)}${e.line ? `:${e.line}:${e.col ?? 0}` : ''}` : '';
  return {
    message: message.slice(0, 300),
    source: source.slice(0, 200),
    stack: local(stack).slice(0, 1500),
    path: pathname.split(/[?#]/)[0].slice(0, 200),
    kind: e.kind,
  };
}

/** Reports per page load, and the same message only once: a loop can't flood the log. */
export const MAX_REPORTS_PER_PAGE = 5;
