'use client';

import { useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import { copyText } from '@/lib/clipboard';
import { MINUTES_CHART } from '@/lib/decimalChart';

type Code = 'html' | 'markdown' | 'bbcode';

const CODES: Array<{ id: Code; label: string }> = [
  { id: 'html', label: 'HTML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'bbcode', label: 'Forum' },
];

const { png, width, height, alt, page } = MINUTES_CHART;
const IMG = `https://clockmath.com${png}`;

// The code for each format. The image links to the converter with the alt
// text as its anchor; the HTML also carries a credit line whose link text is
// the brand, as on the widgets (keyword-stuffed widget links are what
// Google's link-spam policy targets).
const CODE: Record<Code, string> = {
  html:
    `<a href="${page}"><img src="${IMG}" alt="${alt}" width="${width}" height="${height}" style="max-width:100%;height:auto;border:0"></a>\n` +
    `<p style="font:13px/1.4 sans-serif;margin:6px 0 0">Chart from <a href="${page}">ClockMath</a></p>`,
  markdown: `[![${alt}](${IMG})](${page})`,
  bbcode: `[url=${page}][img]${IMG}[/img][/url]`,
};

/**
 * "Put this chart on your site" for /tools/decimal-hours/ (Nov 2026, item 8
 * of the links plan): the minutes-to-decimal chart as an image for payroll,
 * HR and small-business blogs. A sibling of EmbedCode's Badge format rather
 * than a fourth format there: no iframe, no live preview, one fixed image.
 * Loads from other sites are counted by the worker (embeds:…:chart:…).
 */
export function ChartEmbedCode() {
  const [code, setCode] = useState<Code>('html');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    // Clipboard blocked: the code is selectable in the box
    if (await copyText(CODE[code])) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    gaEvent({ action: 'embed_code_copied', params: { chart: 'minutes_to_decimal', format: `chart_${code}` } });
  };

  return (
    <div className="st-embedcode">
      {/* eslint-disable-next-line @next/next/no-img-element -- the exact file other sites load, at its own size */}
      <img src={png} alt={alt} width={width} height={height} loading="lazy" className="st-embedcode-chart" />

      <div className="st-embedcode-formats">
        <div className="st-seg st-seg-small" role="group" aria-label="Chart code">
          {CODES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={code === c.id}
              onClick={() => {
                setCode(c.id);
                setCopied(false);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="st-embedcode-label" htmlFor="embed-chart-code">
        Paste this into your page
      </label>
      <textarea id="embed-chart-code" readOnly value={CODE[code]} rows={code === 'html' ? 5 : 3} onFocus={(e) => e.currentTarget.select()} />
      <div className="st-actions">
        <button type="button" className="st-btn primary" onClick={copy}>
          {copied ? 'Copied' : 'Copy chart code'}
        </button>
      </div>

      <p className="st-embedcode-help">
        A {width}-pixel image, sharp on high-resolution screens, that shrinks to fit a narrower column. WordPress: a Custom
        HTML block. Squarespace: a Code block. Forums: the Forum code. Newsletters and README files: Markdown. Free to use,
        with the link back to the converter; saving the image and uploading it to your own site is fine too.
      </p>
    </div>
  );
}
