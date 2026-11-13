// node scripts/worker/badges.test.js — the image badges and the embed use
// counter, with a small BADGES table in place of the build's.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BADGES = {
  christmas: {
    name: 'Christmas',
    title: 'Christmas',
    arrived: 'Merry Christmas! 🎄',
    spec: 'd:2026-12-25,2027-12-25',
    color: '#1f5f3f',
    ink: '#ffffff',
    tile: '#164a30',
    path: '/countdown/christmas/',
  },
  'valentines-day': {
    name: "Valentine's Day",
    title: "Valentine's Day",
    arrived: "Happy Valentine's Day! ❤️",
    spec: 'd:2027-02-14',
    color: '#a3123a',
    ink: '#ffffff',
    tile: '#7d0e2c',
    path: '/countdown/valentines-day/',
  },
  eclipse: {
    name: 'Eclipse',
    title: 'the <eclipse> & more',
    arrived: 'Eclipse day',
    spec: 't:' + Date.UTC(2027, 7, 2, 10, 6, 37),
    color: '#000000',
    ink: '#f3c74f',
    tile: '#222222',
    path: '/countdown/eclipse/',
  },
};

const code = ['live-counts.js', 'badges.js'].map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
const { badgeFor, badgeSvg, embedUseKey, countEmbedUse, cacheControlFor } = new Function(
  'BADGES',
  `${code}; return { badgeFor, badgeSvg, embedUseKey, countEmbedUse, cacheControlFor };`,
)(BADGES);

const at = (iso) => Date.parse(iso);
const NY = 'America/New_York';

// The count: whole calendar days in the viewer's zone, as on the event page
let b = badgeFor('/badge/countdown/christmas.svg', at('2026-11-12T12:00:00-05:00'), NY);
assert.strictEqual(b.status, 200);
assert.match(b.body, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="\d+" height="64"/);
assert.match(b.body, />43<\/text>/);
assert.match(b.body, />days until<\/text>/);
assert.match(b.body, /aria-label="43 days until Christmas \(ClockMath\)"/);
assert.match(b.body, />clockmath\.com<\/text>/);
assert.match(b.body, /fill="#164a30"/); // the tile shade
// 04:00 UTC Dec 24 is still Dec 23 in New York (2 days) but Dec 24 in Sydney (1 day)
assert.match(badgeFor('/badge/countdown/christmas.svg', at('2026-12-24T04:00:00Z'), NY).body, />2<\/text>/);
b = badgeFor('/badge/countdown/christmas.svg', at('2026-12-24T04:00:00Z'), 'Australia/Sydney');
assert.match(b.body, />1<\/text>/);
assert.match(b.body, />day until<\/text>/);
// On the day: the arrived label, no tile
b = badgeFor('/badge/countdown/christmas.svg', at('2026-12-25T12:00:00-05:00'), NY);
assert.match(b.body, /Merry Christmas! 🎄/);
assert.doesNotMatch(b.body, /days? until/);
// Rolled to next year the day after
assert.match(badgeFor('/badge/countdown/christmas.svg', at('2026-12-26T12:00:00-05:00'), NY).body, />364<\/text>/);
// Thousands get a separator
assert.match(badgeFor('/badge/countdown/eclipse.svg', at('2024-01-01T12:00:00Z'), 'UTC').body, />1,309<\/text>/);
// A list with no date left: the title alone, not "arrived" for ever
b = badgeFor('/badge/countdown/valentines-day.svg', at('2027-03-01T12:00:00Z'), NY);
assert.match(b.body, /Valentine&apos;s Day/);
assert.doesNotMatch(b.body, /Happy|until/);
// Text is escaped
b = badgeFor('/badge/countdown/eclipse.svg', at('2027-01-01T12:00:00Z'), NY);
assert.match(b.body, /the &lt;eclipse&gt; &amp; more/);
assert.doesNotMatch(b.body, /<eclipse>/);
// A fixed instant later today counts 0 days
assert.match(badgeFor('/badge/countdown/eclipse.svg', at('2027-08-02T01:00:00Z'), 'UTC').body, />0<\/text>/);
// The text fits: a longer title makes a wider badge
const width = (svg) => Number(/width="(\d+)"/.exec(svg)[1]);
const short = badgeSvg({ ...BADGES.christmas, title: 'Easter' }, 5, false);
const long = badgeSvg({ ...BADGES.christmas, title: 'the 2028 annular solar eclipse' }, 5, false);
assert.ok(width(long) > width(short) + 150);
assert.ok(width(long) >= 8 + 48 + 12 + 'the 2028 annular solar eclipse'.length * 18 * 0.58);

// Unknown and malformed paths 404 (and never reach Object.prototype)
for (const p of ['/badge/countdown/nope.svg', '/badge/countdown/constructor.svg', '/badge/countdown/__proto__.svg', '/badge/countdown/Christmas.svg', '/badge/countdown/christmas.png', '/badge/countdown/christmas.svg/x']) {
  assert.strictEqual(badgeFor(p, Date.now(), NY).status, 404, p);
}

// Cache: half an hour for badges
// private: no shared cache keeps one viewer's count (Cloudflare's edge did, Nov 13)
assert.strictEqual(cacheControlFor('/badge/countdown/christmas.svg', { status: 200, headers: new Map([['Content-Type', 'image/svg+xml']]) }), 'private, max-age=1800');

// ---- Embed use counter ----
const day = at('2026-11-12T15:00:00Z');
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', 'https://blog.example.org/', day), 'embeds:2026-11-12:embed:christmas:blog.example.org');
assert.strictEqual(embedUseKey('/embed/countdown/', 'https://Teacher.Example.com/class?x=1', day), 'embeds:2026-11-12:embed:custom:teacher.example.com');
assert.strictEqual(embedUseKey('/badge/countdown/gta-6.svg', 'https://forum.example.net/thread/9', day), 'embeds:2026-11-12:badge:gta-6:forum.example.net');
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', null, day), 'embeds:2026-11-12:embed:christmas:(none)');
assert.strictEqual(embedUseKey('/embed/time/new-york-to-london/', 'https://team.example.com/wiki', day), 'embeds:2026-11-12:embed:time-new-york-to-london:team.example.com');
assert.strictEqual(embedUseKey('/embed/time/', 'https://team.example.com/', day), null);
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', 'not a url', day), 'embeds:2026-11-12:embed:christmas:(unreadable)');
// ClockMath's own previews, other paths and the embed's own files aren't counted
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', 'https://clockmath.com/countdown/christmas/', day), null);
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', 'https://www.clockmath.com/', day), null);
assert.strictEqual(embedUseKey('/embed/countdown/christmas/', 'https://abc123.clockmath.pages.dev/', day), null);
assert.strictEqual(embedUseKey('/countdown/christmas/', 'https://blog.example.org/', day), null);
assert.strictEqual(embedUseKey('/embed/countdown/christmas/index.txt', 'https://blog.example.org/', day), null);
assert.ok(embedUseKey('/embed/countdown/christmas/', 'https://' + 'a'.repeat(300) + '.com/', day).length < 200);

// The response itself: SVG, any site may load it, and Cloudflare's edge keeps no copy
{
  const res = new Function('BADGES', `${code}; return handleBadge;`)(BADGES)({ url: 'https://clockmath.com/badge/countdown/christmas.svg', method: 'GET', cf: { timezone: NY } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('Content-Type'), 'image/svg+xml; charset=utf-8');
  assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.strictEqual(res.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
}

(async () => {
  const store = new Map();
  let writes = 0;
  let reads = 0;
  const env = {
    QUIZ_KV: {
      get: async (k) => (reads++, store.has(k) ? store.get(k) : null),
      put: async (k, v, opts) => {
        writes++;
        assert.strictEqual(opts.expirationTtl, 60 * 60 * 24 * 90);
        store.set(k, v);
      },
    },
  };
  const req = (url, referer, method = 'GET') => ({ url, method, headers: { get: (h) => (h === 'Referer' ? referer : null) } });
  const r = req('https://clockmath.com/embed/countdown/christmas/', 'https://blog.example.org/post');
  await countEmbedUse(r, env, '/embed/countdown/christmas/', 200);
  await countEmbedUse(r, env, '/embed/countdown/christmas/', 200); // same host, same day: no second read or write
  assert.strictEqual(writes, 1);
  assert.strictEqual(reads, 1);
  assert.ok([...store.keys()][0].endsWith(':embed:christmas:blog.example.org'));
  // A key another isolate already wrote: read, not written again
  const other = 'embeds:' + new Date().toISOString().slice(0, 10) + ':embed:christmas:other.example.org';
  store.set(other, '1');
  await countEmbedUse(req('https://clockmath.com/embed/countdown/christmas/', 'https://other.example.org/'), env, '/embed/countdown/christmas/', 200);
  assert.strictEqual(writes, 1);
  // Not counted: errors, 304s, HEAD, no KV binding
  await countEmbedUse(req('https://clockmath.com/embed/countdown/x/', 'https://a.example/'), env, '/embed/countdown/x/', 404);
  await countEmbedUse(req('https://clockmath.com/embed/countdown/christmas/', 'https://b.example/'), env, '/embed/countdown/christmas/', 304);
  await countEmbedUse(req('https://clockmath.com/badge/countdown/christmas.svg', 'https://c.example/', 'HEAD'), env, '/badge/countdown/christmas.svg', 200);
  await countEmbedUse(req('https://clockmath.com/badge/countdown/christmas.svg', 'https://d.example/'), {}, '/badge/countdown/christmas.svg', 200);
  assert.strictEqual(writes, 1);
  console.log('badges.test.js: all passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
