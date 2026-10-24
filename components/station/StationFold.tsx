'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { event as gaEvent } from '@/lib/gtag';

/**
 * The explanations, quick answers and FAQs under a tool, folded into one
 * closed section so the page ends at the tool (Oct 2026: "I hate how the
 * large instructions look"). A native <details>: no script needed to open
 * it, and the text stays in the HTML, where search engines and Copilot read
 * it and the FAQ schema still matches visible content.
 *
 * The client part only handles links into it (opens itself when the URL's
 * #fragment points inside, which browsers don't do reliably) and sends
 * explainer_opened so we can see whether anyone reads it.
 */
export default function StationFold({
  summary = 'How it works and common questions',
  id,
  children,
}: {
  summary?: string;
  id?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const openForHash = () => {
      const details = ref.current;
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!details || !hash) return;
      const target = document.getElementById(hash);
      if (target && (target === details || details.contains(target))) {
        if (!details.open) details.open = true;
        target.scrollIntoView();
      }
    };
    openForHash();
    window.addEventListener('hashchange', openForHash);
    return () => window.removeEventListener('hashchange', openForHash);
  }, []);

  return (
    <details
      ref={ref}
      id={id}
      className="st-fold"
      onToggle={(e) => {
        if (e.currentTarget.open) {
          gaEvent({ action: 'explainer_opened', params: { page: window.location.pathname, section: id ?? 'explainers' } });
        }
      }}
    >
      <summary className="st-fold-summary">
        <span>{summary}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="st-fold-body">{children}</div>
    </details>
  );
}
