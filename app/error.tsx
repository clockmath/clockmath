'use client';

import { useEffect } from 'react';
import { event as gaEvent } from '@/lib/gtag';

/**
 * Last line of defence for a crash inside a page. Without it Next shows a
 * bare "Application error: a client-side exception has occurred" screen
 * (the Oct 2026 audit found blocked localStorage could trigger exactly
 * that). Offers a retry and a reload, and logs the error name to GA so a
 * new crash shows up in analytics instead of only in a visitor's browser.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    gaEvent({ action: 'page_error', params: { name: error.name, message: error.message.slice(0, 100) } });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-10">
      <div className="w-full max-w-lg text-center bg-card/70 dark:bg-slate-800/60 rounded-2xl p-8 shadow-sm border border-border/50 dark:border-slate-700/50">
        <h1 className="text-xl font-bold text-foreground dark:text-slate-100">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400">
          This page hit an error. Trying again usually fixes it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl border border-border dark:border-slate-600 font-semibold text-foreground hover:bg-muted/60 dark:hover:bg-slate-700/60"
          >
            Reload the page
          </button>
        </div>
      </div>
    </div>
  );
}
