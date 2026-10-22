'use client';

import { useEffect } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import StationChrome from '@/components/station/StationChrome';

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
    <StationChrome currentTool="error">
      <div className="st-intro">
        <h1 className="st-h1">Something went wrong</h1>
        <p className="st-lede">This page hit an error. Trying again usually fixes it.</p>
      </div>
      <div className="st-cta">
        <button type="button" onClick={reset} className="st-btn primary">
          Try again
        </button>
        <button type="button" onClick={() => window.location.reload()} className="st-btn quiet">
          Reload the page
        </button>
      </div>
    </StationChrome>
  );
}
