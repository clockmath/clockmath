'use client';

import { useEffect } from 'react';
import { MAX_REPORTS_PER_PAGE, toReport, type ErrorInput } from '@/lib/errorReport';

/**
 * Sends uncaught errors from the site's own scripts to the site's error log
 * (Nov 2026; lib/errorReport.ts, /api/error). Renders nothing. Off on the dev
 * server, which has no /api/error and shows errors in its own overlay.
 */
export default function ErrorReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    const sent = new Set<string>();
    const send = (input: ErrorInput) => {
      if (sent.size >= MAX_REPORTS_PER_PAGE) return;
      const report = toReport(input, window.location.origin, window.location.pathname);
      if (!report || sent.has(report.message)) return;
      sent.add(report.message);
      try {
        void fetch('/api/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* reporting must never cause an error itself */
      }
    };
    const onError = (e: ErrorEvent) =>
      send({ message: e.message, filename: e.filename, line: e.lineno, col: e.colno, stack: e.error instanceof Error ? e.error.stack : '', kind: 'error' });
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: unknown = e.reason;
      send({ message: r instanceof Error ? `${r.name}: ${r.message}` : String(r), stack: r instanceof Error ? r.stack : '', kind: 'rejection' });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
