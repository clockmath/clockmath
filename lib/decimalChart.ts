/**
 * The minutes-to-decimal chart as an image other sites can put on their
 * pages (Nov 2026, item 8 of the links plan): payroll, HR and small-business
 * blogs paste it in with a link back to /tools/decimal-hours/.
 *
 * The SVG is drawn here from minutesToDecimal, the same function as the
 * page's chart and print sheet, so the three can't disagree.
 * `node scripts/brand/chart.mjs` writes it to public/charts/ and renders the
 * PNG the embed code uses (PNG because email apps, WordPress's media library
 * and many forums won't take an SVG); tests/decimalChart.test.ts fails if
 * either file is out of date.
 *
 * Black on white with plain attributes, no <style> or web fonts: an SVG in
 * an <img> can't load fonts, and the worker's CSP (no inline styles without
 * a nonce) applies when someone opens the file itself.
 */
import { minutesToDecimal } from '@/lib/decimalTime';

export const MINUTES_CHART = {
  /** The image in the embed code: 2x for sharp text on high-density screens. */
  png: '/charts/minutes-to-decimal.png',
  svg: '/charts/minutes-to-decimal.svg',
  /** CSS pixels (the PNG is twice this). */
  width: 600,
  height: 540,
  /** The image's alt text, which is the anchor text of the link around it. */
  alt: 'Minutes to decimal hours chart (ClockMath)',
  /** Where the image links. */
  page: 'https://clockmath.com/tools/decimal-hours/',
} as const;

const FONT = 'Arial, Helvetica, sans-serif';
const COLS = 4;
const ROWS = 15;
const MARGIN = 24;
const GRID_TOP = 112;
const ROW_H = 26;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(x: number, y: number, s: string, size: number, opts: { weight?: number; fill?: string; anchor?: 'end' } = {}): string {
  return (
    `<text x="${x}" y="${y}" font-size="${size}"` +
    (opts.weight ? ` font-weight="${opts.weight}"` : '') +
    (opts.anchor ? ` text-anchor="${opts.anchor}"` : '') +
    ` fill="${opts.fill ?? '#000'}">${esc(s)}</text>`
  );
}

/** The chart: 1–60 minutes in four columns, filled top to bottom like the page's. */
export function minutesChartSvg(): string {
  const { width: W, height: H, alt } = MINUTES_CHART;
  const colW = (W - MARGIN * 2) / COLS;
  const gridBottom = GRID_TOP + ROWS * ROW_H;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(alt)}">`,
    `<title>${esc(alt)}</title>`,
    `<rect width="${W}" height="${H}" fill="#fff"/>`,
    `<g font-family="${FONT}">`,
    text(MARGIN, 46, 'Minutes to decimal hours', 28, { weight: 700 }),
    text(MARGIN, 74, 'Hours = minutes ÷ 60, to two places. 7:45 is 7.75 hours, not 7.45.', 15, { fill: '#333' }),
  ];
  // Every other row shaded across the whole width, so a row reads across
  for (let r = 1; r < ROWS; r += 2) {
    parts.push(`<rect x="${MARGIN}" y="${GRID_TOP + r * ROW_H}" width="${W - MARGIN * 2}" height="${ROW_H}" fill="#f0f0f0"/>`);
  }
  for (let c = 0; c < COLS; c++) {
    const x = MARGIN + c * colW;
    parts.push(text(x + 10, GRID_TOP - 10, 'Min', 13, { weight: 700, fill: '#333' }));
    parts.push(text(x + colW - 14, GRID_TOP - 10, 'Hours', 13, { weight: 700, fill: '#333', anchor: 'end' }));
    if (c > 0) parts.push(`<rect x="${x}" y="${GRID_TOP}" width="1" height="${ROWS * ROW_H}" fill="#c8c8c8"/>`);
    for (let r = 0; r < ROWS; r++) {
      const minutes = c * ROWS + r + 1;
      const y = GRID_TOP + r * ROW_H + 18;
      parts.push(text(x + 30, y, String(minutes), 16, { fill: '#333', anchor: 'end' }));
      parts.push(text(x + colW - 14, y, minutesToDecimal(minutes).toFixed(2), 17, { weight: 700, anchor: 'end' }));
    }
  }
  parts.push(
    `<rect x="${MARGIN}" y="${GRID_TOP - 2}" width="${W - MARGIN * 2}" height="2" fill="#000"/>`,
    `<rect x="${MARGIN}" y="${gridBottom}" width="${W - MARGIN * 2}" height="2" fill="#000"/>`,
    text(MARGIN, gridBottom + 28, 'Rounding to 6 or 15 minutes? Round first, then convert.', 13, { fill: '#333' }),
    text(W - MARGIN, gridBottom + 28, 'clockmath.com', 13, { weight: 700, anchor: 'end' }),
    '</g>',
    '</svg>',
  );
  return parts.join('\n') + '\n';
}
