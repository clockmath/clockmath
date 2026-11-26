// node --test tests/ — which browser errors reach the site's error log, and
// what a report carries (lib/errorReport.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toReport } from '../lib/errorReport.ts';

const O = 'https://clockmath.com';

test('our own error: path only, origin trimmed from the file and stack', () => {
  const r = toReport(
    {
      message: 'TypeError: Cannot read properties of undefined',
      filename: `${O}/_next/static/chunks/app.js`,
      line: 1,
      col: 2045,
      stack: `TypeError: Cannot read properties of undefined\n    at f (${O}/_next/static/chunks/app.js:1:2045)`,
      kind: 'error',
    },
    O,
    '/tools/timesheet/?d=SECRET-TIMESHEET#top',
  );
  assert.deepEqual(r, {
    message: 'TypeError: Cannot read properties of undefined',
    source: '/_next/static/chunks/app.js:1:2045',
    stack: 'TypeError: Cannot read properties of undefined\n    at f (/_next/static/chunks/app.js:1:2045)',
    path: '/tools/timesheet/',
    kind: 'error',
  });
});

test('not ours or nothing to act on: dropped', () => {
  const drop = (e: Parameters<typeof toReport>[0]) => assert.equal(toReport(e, O, '/'), null);
  drop({ message: 'Script error.', kind: 'error' });
  drop({ message: '', kind: 'error' });
  drop({ message: 'ResizeObserver loop completed with undelivered notifications.', kind: 'error' });
  drop({ message: 'TypeError: Failed to fetch', filename: 'chrome-extension://abc/content.js', kind: 'error' });
  drop({ message: 'x is not defined', filename: 'https://www.googletagmanager.com/gtag/js', kind: 'error' });
  drop({ message: 'Boom', stack: 'Error: Boom\n    at chrome-extension://abc/inject.js:3:9', kind: 'rejection' });
  drop({ message: 'Failed to fetch', kind: 'rejection' });
});

test('a rejection with no file but our stack is kept; long fields are clipped', () => {
  const r = toReport({ message: 'Error: ' + 'x'.repeat(500), stack: `at g (${O}/_next/static/chunks/b.js:1:1)\n` + 'y'.repeat(3000), kind: 'rejection' }, O, '/' + 'p'.repeat(300));
  assert.ok(r);
  assert.equal(r.message.length, 300);
  assert.equal(r.stack.length, 1500);
  assert.equal(r.path.length, 200);
  assert.equal(r.source, '');
  assert.equal(r.kind, 'rejection');
});
