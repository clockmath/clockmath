// ---- Image badges and embed use counts (injected into _worker.js) ----
// Plain worker code, concatenated into the generated worker by
// scripts/build-worker.js after live-counts.js (it uses liveDays and
// liveNextDate from there); scripts/worker/badges.test.js loads it in Node.
//
// Expects BADGES in scope: the table from lib/badges.ts, which the build
// writes to out/badge/countdown/data.json and build-worker.js bakes in.

// /badge/countdown/<slug>.svg: "42 days until Christmas" as an image, for
// sites that strip iframes (Nov 2026). The count is the viewer's: whole
// calendar days in their zone (request.cf.timezone), like the event pages'
// answer sentences, so the badge and the page agree.
const BADGE_PATH = /^\/badge\/countdown\/([a-z0-9-]+)\.svg$/;
const BADGE_FONT = 'Arial, Helvetica, sans-serif';

const xmlEscape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

// Width of text in the badge's bold sans, roughly: Arial Bold averages about
// 0.55em a character, the wider fallbacks (DejaVu Sans on Linux) nearer
// 0.6. Erring wide only leaves a little more padding; too narrow would clip.
const badgeTextWidth = (s, size) => Math.ceil(Array.from(String(s)).length * size * 0.58);

/**
 * The badge's SVG. `days` is the count, or null while the event is on
 * (`arrived` is shown) or once no date is left (`over`: the title alone).
 */
function badgeSvg(entry, days, over) {
  const H = 64;
  const site = 'clockmath.com';
  const counting = days !== null && !over;
  const label = counting
    ? days.toLocaleString('en-US') + (days === 1 ? ' day' : ' days') + ' until ' + entry.title
    : over
      ? entry.title
      : entry.arrived;
  const head = (W) =>
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
    xmlEscape(label + ' (ClockMath)') + '">' +
    '<title>' + xmlEscape(label + ' (ClockMath)') + '</title>' +
    '<rect width="' + W + '" height="' + H + '" rx="10" fill="' + xmlEscape(entry.color) + '"/>';
  const text = (x, y, size, weight, opacity, s, anchor) =>
    '<text x="' + x + '" y="' + y + '" font-family="' + BADGE_FONT + '" font-size="' + size + '" font-weight="' + weight + '"' +
    (anchor ? ' text-anchor="' + anchor + '"' : '') + ' fill="' + xmlEscape(entry.ink) + '"' +
    (opacity < 1 ? ' fill-opacity="' + opacity + '"' : '') + '>' + xmlEscape(s) + '</text>';

  if (!counting) {
    const main = over ? entry.title : entry.arrived;
    const W = 16 + Math.max(badgeTextWidth(main, 18), badgeTextWidth(site, 10)) + 16;
    return head(W) + text(16, 32, 18, 700, 1, main) + text(16, 50, 10, 400, 0.8, site) + '</svg>';
  }

  // The count on a tile (the boards' split-flap shade), then "days until" / the title / the site
  const number = days.toLocaleString('en-US');
  const tileW = Math.max(48, badgeTextWidth(number, 32) + 16);
  const textX = 8 + tileW + 12;
  const lines = [days === 1 ? 'day until' : 'days until', entry.title, site];
  const W = textX + Math.max(badgeTextWidth(lines[0], 13), badgeTextWidth(lines[1], 18), badgeTextWidth(lines[2], 10)) + 14;
  return (
    head(W) +
    '<rect x="8" y="8" width="' + tileW + '" height="48" rx="6" fill="' + xmlEscape(entry.tile) + '"/>' +
    text(8 + tileW / 2, 44, 32, 700, 1, number, 'middle') +
    text(textX, 23, 13, 400, 0.85, lines[0]) +
    text(textX, 42, 18, 700, 1, lines[1]) +
    text(textX, 56, 10, 400, 0.75, lines[2]) +
    '</svg>'
  );
}

/** The badge for `pathname` at `nowMs` in `timeZone`: { status, body }. */
function badgeFor(pathname, nowMs, timeZone) {
  const m = BADGE_PATH.exec(pathname);
  const entry = m && Object.prototype.hasOwnProperty.call(BADGES, m[1]) ? BADGES[m[1]] : null;
  if (!entry) return { status: 404, body: null };
  const days = liveDays(entry.spec, nowMs, timeZone);
  // A "d:" list with nothing left (Hanukkah past the last listed year): not
  // "arrived" for ever, just the title until a deploy adds dates.
  const over = days === null && entry.spec.startsWith('d:') && liveNextDate(entry.spec, nowMs, timeZone) === null;
  return { status: 200, body: badgeSvg(entry, days, over) };
}

function handleBadge(request) {
  const { pathname } = new URL(request.url);
  const timeZone = (request.cf && request.cf.timezone) || 'UTC';
  const { status, body } = badgeFor(pathname, Date.now(), timeZone);
  if (status !== 200) return new Response('Not found', { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    // Any site may show it (an <img> needs no CORS, but canvas and some
    // README renderers fetch it); the cache time is cacheControlFor's.
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

// ---- Who uses the embeds and badges (Nov 2026) ----
// GA doesn't run on /embed/ (it would set cookies on other people's sites),
// so until now there was no way to see whether anyone used them. Each day,
// the first request for an embed or badge from a new host page writes one KV
// key: embeds:<UTC day>:<embed|badge>:<slug>:<host>. The host is the
// Referer's hostname only (browsers send just the origin cross-site); no IP,
// no path, nothing about the visitor. Kept 90 days; read with
// `npm run embeds`. One write per host, embed and day keeps well inside KV's
// free 1,000 writes a day; a Set per isolate saves repeat reads.
const EMBED_USE_TTL = 60 * 60 * 24 * 90;
const EMBED_PATH = /^\/embed\/countdown\/(?:([a-z0-9-]+)\/)?$/;
const OWN_HOST = /(^|\.)clockmath\.com$|(^|\.)clockmath\.pages\.dev$/;
const embedUseSeen = new Set();

/** The KV key for one embed or badge request, or null if it isn't counted. */
function embedUseKey(pathname, referer, nowMs) {
  let kind;
  const badge = BADGE_PATH.exec(pathname);
  const embed = EMBED_PATH.exec(pathname);
  if (badge) kind = 'badge:' + badge[1];
  else if (embed) kind = 'embed:' + (embed[1] || 'custom');
  else return null;
  let host = '(none)';
  if (referer) {
    try {
      host = new URL(referer).hostname.toLowerCase().slice(0, 100) || '(none)';
    } catch (e) {
      host = '(unreadable)';
    }
  }
  if (OWN_HOST.test(host)) return null; // the previews on ClockMath's own pages
  return 'embeds:' + new Date(nowMs).toISOString().slice(0, 10) + ':' + kind + ':' + host;
}

async function countEmbedUse(request, env, pathname, status) {
  if (!env || !env.QUIZ_KV || status !== 200 || request.method !== 'GET') return;
  const key = embedUseKey(pathname, request.headers.get('Referer'), Date.now());
  if (!key || embedUseSeen.has(key)) return;
  if (embedUseSeen.size > 5000) embedUseSeen.clear();
  embedUseSeen.add(key);
  if ((await env.QUIZ_KV.get(key)) !== null) return;
  await env.QUIZ_KV.put(key, '1', { expirationTtl: EMBED_USE_TTL });
}
