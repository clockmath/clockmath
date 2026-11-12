// What analytics may see of an address (lib/analyticsUrl.ts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsSafeUrl, urlHasVisitorData } from '../lib/analyticsUrl.ts';

test('visitor data is dropped, campaign tags kept', () => {
  assert.equal(
    analyticsSafeUrl('https://clockmath.com/tools/days-between-dates/?from=1990-05-04&to=2026-11-12&inclusive=1&utm_source=bing#faq'),
    'https://clockmath.com/tools/days-between-dates/?utm_source=bing',
  );
  assert.equal(analyticsSafeUrl('https://clockmath.com/tools/countdown/?to=2026-12-25T00:00&title=Party'), 'https://clockmath.com/tools/countdown/');
  assert.equal(analyticsSafeUrl('not a url'), '');
});

test('pages whose address carries visitor data are spotted (Clarity stays off)', () => {
  assert.equal(urlHasVisitorData('?from=1990-05-04'), true);
  assert.equal(urlHasVisitorData('?to=2026-11-12'), true);
  assert.equal(urlHasVisitorData('?d=abc'), true);
  assert.equal(urlHasVisitorData('?title=x'), true);
  assert.equal(urlHasVisitorData('?utm_source=bing'), false);
  assert.equal(urlHasVisitorData(''), false);
});
