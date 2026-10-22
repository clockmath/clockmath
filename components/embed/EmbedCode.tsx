'use client';

import { useMemo, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';

const ORIGIN = 'https://clockmath.com';

interface EmbedCodeProps {
  /** The embed's path, e.g. /embed/countdown/thanksgiving/ (query allowed). */
  src: string;
  /** Where the credit under the embed links: the event page or shared countdown. */
  creditHref: string;
  /** For the iframe's accessible title: "Countdown to Thanksgiving". */
  label: string;
  /** For analytics: the event slug, or "custom". */
  id: string;
}

// The copy-paste code for an embeddable countdown, with a live preview of
// exactly what it renders. The credit under the iframe is a plain link with
// the brand as its text — the attribution other sites carry back to the
// page (keyword-stuffed widget links are what Google's spam policy targets).
export function EmbedCode({ src, creditHref, label, id }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const code = useMemo(
    () =>
      `<iframe src="${ORIGIN}${src}" title="${label.replace(/"/g, '&quot;')}" width="100%" height="230" style="max-width:560px;border:0" loading="lazy"></iframe>\n` +
      `<p style="font:13px/1.4 sans-serif;margin:6px 0 0">Countdown from <a href="${creditHref}">ClockMath</a></p>`,
    [src, creditHref, label],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the code is selectable in the box */
    }
    gaEvent({ action: 'embed_code_copied', params: { countdown: id } });
  };

  return (
    <div className="st-embedcode">
      <iframe src={src} title={label} width="100%" height={230} loading="lazy" className="st-embedcode-preview" />
      <label className="st-embedcode-label" htmlFor={`embed-${id}`}>
        Paste this into your page&apos;s HTML
      </label>
      <textarea id={`embed-${id}`} readOnly value={code} rows={4} onFocus={(e) => e.currentTarget.select()} />
      <div className="st-actions">
        <button type="button" className="st-btn primary" onClick={copy}>
          {copied ? 'Copied' : 'Copy embed code'}
        </button>
      </div>
      <p className="st-embedcode-help">
        It updates itself every second and fits any width, from a sidebar to a full column. No sign-up, and it sets
        no cookies on your site.
      </p>
    </div>
  );
}
