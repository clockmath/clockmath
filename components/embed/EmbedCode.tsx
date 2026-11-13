'use client';

import { useMemo, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import { copyText } from '@/lib/clipboard';

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
  /** Event countdowns also come as an image badge (lib/badges.ts). */
  badge?: { src: string; name: string };
}

type Format = 'widget' | 'badge' | 'link';
type BadgeCode = 'html' | 'markdown' | 'bbcode';

const FORMATS: Array<{ id: Format; label: string }> = [
  { id: 'widget', label: 'Widget' },
  { id: 'badge', label: 'Badge' },
  { id: 'link', label: 'Link' },
];
const BADGE_CODES: Array<{ id: BadgeCode; label: string }> = [
  { id: 'html', label: 'HTML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'bbcode', label: 'Forum' },
];

// The copy-paste code for an embeddable countdown, with a live preview of
// exactly what it renders. The credit under the iframe is a plain link with
// the brand as its text — the attribution other sites carry back to the
// page (keyword-stuffed widget links are what Google's spam policy targets).
//
// Nov 2026: three formats, because the iframe and its credit only survive
// editors that take raw HTML (self-hosted WordPress, Squarespace, Blogger,
// Ghost). An image badge in a link survives where iframes are stripped
// (WordPress.com's cheaper plans, forums, newsletters, READMEs), and
// Notion, Google Sites and Wix take the embed's address, not code.
export function EmbedCode({ src, creditHref, label, id, badge }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<Format>('widget');
  const [badgeCode, setBadgeCode] = useState<BadgeCode>('html');
  const [badgeBroken, setBadgeBroken] = useState(false);
  const formats = badge ? FORMATS : FORMATS.filter((f) => f.id !== 'badge');

  const code = useMemo(() => {
    if (format === 'link') return `${ORIGIN}${src}`;
    if (format === 'badge' && badge) {
      const img = `${ORIGIN}${badge.src}`;
      const alt = `${badge.name} countdown from ClockMath`;
      if (badgeCode === 'markdown') return `[![${alt}](${img})](${creditHref})`;
      if (badgeCode === 'bbcode') return `[url=${creditHref}][img]${img}[/img][/url]`;
      return `<a href="${creditHref}"><img src="${img}" alt="${alt.replace(/"/g, '&quot;')}" height="64" style="border:0"></a>`;
    }
    return (
      `<iframe src="${ORIGIN}${src}" title="${label.replace(/"/g, '&quot;')}" width="100%" height="230" style="max-width:560px;border:0" loading="lazy"></iframe>\n` +
      `<p style="font:13px/1.4 sans-serif;margin:6px 0 0">Countdown from <a href="${creditHref}">ClockMath</a></p>`
    );
  }, [format, badgeCode, src, creditHref, label, badge]);

  const pick = (f: Format) => {
    setFormat(f);
    setCopied(false);
  };

  const copy = async () => {
    // Clipboard blocked: the code is selectable in the box
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    gaEvent({ action: 'embed_code_copied', params: { countdown: id, format: format === 'badge' ? `badge_${badgeCode}` : format } });
  };

  return (
    <div className="st-embedcode">
      {format === 'badge' && badge ? (
        <p className="st-embedcode-badge">
          {badgeBroken ? (
            // The badge is drawn by the worker, so `next dev` has none
            <span className="st-embedcode-help">The badge preview shows on clockmath.com.</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- drawn per request by the worker, not a static asset
            <img src={badge.src} alt={`${badge.name} countdown from ClockMath`} height={64} onError={() => setBadgeBroken(true)} />
          )}
        </p>
      ) : (
        <iframe src={src} title={label} width="100%" height={230} loading="lazy" className="st-embedcode-preview" />
      )}

      <div className="st-embedcode-formats">
        <div className="st-seg" role="group" aria-label="Embed format">
          {formats.map((f) => (
            <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => pick(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        {format === 'badge' && (
          <div className="st-seg st-seg-small" role="group" aria-label="Badge code">
            {BADGE_CODES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={badgeCode === c.id}
                onClick={() => {
                  setBadgeCode(c.id);
                  setCopied(false);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="st-embedcode-label" htmlFor={`embed-${id}`}>
        {format === 'link' ? 'Paste this address where your site builder asks for one' : 'Paste this into your page'}
      </label>
      <textarea id={`embed-${id}`} readOnly value={code} rows={format === 'widget' ? 5 : format === 'badge' ? 4 : 2} onFocus={(e) => e.currentTarget.select()} />
      <div className="st-actions">
        <button type="button" className="st-btn primary" onClick={copy}>
          {copied ? 'Copied' : format === 'link' ? 'Copy address' : format === 'badge' ? 'Copy badge code' : 'Copy embed code'}
        </button>
      </div>

      {format === 'widget' && (
        <p className="st-embedcode-help">
          A live countdown that ticks every second and fits any width, from a sidebar to a full column. WordPress: add a
          Custom HTML block. Squarespace: a Code block. Blogger: an HTML/JavaScript gadget. Ghost: an HTML card. No
          sign-up, and it sets no cookies on your site.
        </p>
      )}
      {format === 'badge' && (
        <p className="st-embedcode-help">
          An image of the days left, as the viewer’s calendar counts them, that links to the countdown. For places that
          strip widgets: WordPress.com’s Free and Personal plans, forums (the Forum code), newsletters, and README files
          on GitHub (Markdown).
        </p>
      )}
      {format === 'link' && (
        <p className="st-embedcode-help">
          For builders that take an address instead of code. Notion: type /embed and paste it. Google Sites: Insert,
          Embed, By URL. Wix: Embed a Site. Make the box about 230 pixels tall.
        </p>
      )}
    </div>
  );
}
