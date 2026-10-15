// node scripts/worker/live-counts.test.js — checks the worker's countdown
// maths against EventCountdown's client-side maths for the same instants.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, 'live-counts.js'), 'utf8');
const { liveDays, liveDateLabel, cacheControlFor, weeksPhrase } = new Function(
  `${code}; return { liveDays, liveDateLabel, cacheControlFor, weeksPhrase };`,
)();

const at = (iso) => Date.parse(iso);
const NY = 'America/New_York';
const thanksgiving = 'd:2026-11-26,2027-11-25,2028-11-23';

// Recurring dates: whole calendar days in the visitor's zone.
assert.strictEqual(liveDays(thanksgiving, at('2026-10-15T12:00:00-04:00'), NY), 42);
assert.strictEqual(liveDays(thanksgiving, at('2026-11-25T23:30:00-05:00'), NY), 1);
assert.strictEqual(liveDays(thanksgiving, at('2026-11-26T09:00:00-05:00'), NY), null); // the day itself
assert.strictEqual(liveDays(thanksgiving, at('2026-11-27T00:00:01-05:00'), NY), 363); // rolled to 2027 (Nov 27 → Nov 25)
// 03:00 UTC Nov 26 is still Nov 25 in New York but already Nov 26 in Sydney.
assert.strictEqual(liveDays(thanksgiving, at('2026-11-26T03:00:00Z'), NY), 1);
assert.strictEqual(liveDays(thanksgiving, at('2026-11-26T03:00:00Z'), 'Australia/Sydney'), null);
assert.strictEqual(liveDays(thanksgiving, at('2026-10-15T12:00:00Z'), 'Not/AZone'), 42); // bad zone → UTC
assert.strictEqual(liveDays('d:2026-11-26', at('2026-12-01T00:00:00Z'), NY), null); // list exhausted

// Fixed instants: Math.ceil of the remaining time, like the client.
const eclipse = `t:${Date.UTC(2028, 6, 22, 2, 55, 23)}`;
assert.strictEqual(liveDays(eclipse, Date.UTC(2028, 6, 21, 2, 55, 24), NY), 1);
assert.strictEqual(liveDays(eclipse, Date.UTC(2028, 6, 21, 2, 55, 22), NY), 2);
assert.strictEqual(liveDays(eclipse, Date.UTC(2028, 6, 22, 3, 0, 0), NY), null);

// Weekly (the weekend: Saturday, spanning 2 days). Oct 15 2026 is a Thursday.
assert.strictEqual(liveDays('w:6:2', at('2026-10-15T12:00:00-04:00'), NY), 2);
assert.strictEqual(liveDays('w:6:2', at('2026-10-17T12:00:00-04:00'), NY), null); // Saturday
assert.strictEqual(liveDays('w:6:2', at('2026-10-18T12:00:00-04:00'), NY), null); // Sunday
assert.strictEqual(liveDays('w:6:2', at('2026-10-19T12:00:00-04:00'), NY), 5); // Monday

// Date label in the visitor's zone (the 2028 eclipse is a Friday in the Americas).
assert.strictEqual(liveDateLabel(Date.UTC(2028, 6, 22, 2, 55, 23), NY), 'Friday, July 21, 2028');
assert.strictEqual(liveDateLabel(Date.UTC(2028, 6, 22, 2, 55, 23), 'Australia/Sydney'), 'Saturday, July 22, 2028');

// Weeks phrase.
assert.strictEqual(weeksPhrase(42), " That's 6 weeks.");
assert.strictEqual(weeksPhrase(43), " That's 6 weeks and 1 day.");
assert.strictEqual(weeksPhrase(10), " That's 1 week and 3 days.");
assert.strictEqual(weeksPhrase(6), '');
assert.strictEqual(weeksPhrase(400), '');

// Cache policy.
const res = (type, status = 200) => ({ status, headers: new Map([['Content-Type', type]]) });
assert.strictEqual(cacheControlFor('/_next/static/chunks/a.js', res('application/javascript')), 'public, max-age=31536000, immutable');
assert.strictEqual(cacheControlFor('/countdown/thanksgiving/', res('text/html; charset=utf-8')), 'public, max-age=0, must-revalidate');
assert.strictEqual(cacheControlFor('/tools/index.txt', res('text/x-component')), 'public, max-age=0, must-revalidate');
assert.strictEqual(cacheControlFor('/sitemap.xml', res('application/xml')), 'public, max-age=0, must-revalidate');
assert.strictEqual(cacheControlFor('/og-image.png', res('image/png')), 'public, max-age=86400');
assert.strictEqual(cacheControlFor('/api/quiz', res('application/json')), null);
assert.strictEqual(cacheControlFor('/tools/', res('text/html', 301)), null);

console.log('live-counts: all checks passed');
