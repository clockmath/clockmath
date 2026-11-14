// node scripts/indexnow.test.js — the IndexNow change detection ignores the
// values the worker rewrites per request, and nothing else.
const assert = require('assert');
const { visibleText, metaDescription, isUpdated } = require('./indexnow.js');

const page = ({ a, b, sentence, today, days, row }) => `<html><head><title>T</title></head><body><main>
  <h1>New York to London</h1>
  <span data-pair="sentence">${sentence}</span>
  <div data-pair-spec="0:-300:0" data-pair-names="New York|London"><span data-pair="time-a">${a}</span><span data-pair="time-b">${b}</span></div>
  <p>Today is <span data-live-today="long">${today}</span>.</p>
  <p>There are <span data-live="days">${days}</span> days left.</p>
  <ul>${row ? '<li data-live-until="1805007600000">Mar 14: New York moves</li>' : ''}<li>Mar 28: London moves</li></ul>
  <script>self.__x = 1</script>
</main></body></html>`;

const base = { a: 'Thursday 3:57 PM', b: 'Thursday 8:57 PM', sentence: 'London is 5 hours ahead of New York', today: 'Thursday, November 12, 2026', days: '14', row: true };

// Build-instant clocks, sentence, today's date and day counts: same text
assert.strictEqual(
  visibleText(page(base)),
  visibleText(page({ ...base, a: 'Friday 9:02 AM', b: 'Friday 2:02 PM', sentence: 'London is 4 hours ahead of New York', today: 'Friday, November 13, 2026', days: '13' })),
);
// Real content still counts: a clock-change row dropped after its date
assert.notStrictEqual(visibleText(page(base)), visibleText(page({ ...base, row: false })));
// The fixed text around the live values is kept
const text = visibleText(page(base));
assert.ok(text.includes('New York to London') && text.includes('Mar 28: London moves') && text.includes('days left'));
assert.ok(!text.includes('3:57') && !text.includes('self.__x'));

// Meta descriptions: read from the head (either attribute order), '' without one
assert.strictEqual(metaDescription('<head><meta name="description" content="Hours between two times."/></head>'), 'Hours between two times.');
assert.strictEqual(metaDescription('<meta content="Either order" name="description">'), 'Either order');
assert.strictEqual(metaDescription('<meta property="og:description" content="Not this one"/>'), '');

// Fingerprints are "content.description": a description change alone counts
assert.strictEqual(isUpdated('aaaaaaaaaaaaaaaa.11111111', 'aaaaaaaaaaaaaaaa.11111111'), false);
assert.strictEqual(isUpdated('aaaaaaaaaaaaaaaa.11111111', 'aaaaaaaaaaaaaaaa.22222222'), true);
assert.strictEqual(isUpdated('aaaaaaaaaaaaaaaa.11111111', 'bbbbbbbbbbbbbbbb.11111111'), true);
// State saved before descriptions were fingerprinted: compared on content only
assert.strictEqual(isUpdated('aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa.22222222'), false);
assert.strictEqual(isUpdated('aaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbb.22222222'), true);

console.log('indexnow: all checks passed');
