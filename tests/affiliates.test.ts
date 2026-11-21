// node --test tests/ — when a partner card shows (lib/affiliates.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUSTO, partnerShows } from '../lib/affiliates.ts';

test('no link, no card, anywhere', () => {
  assert.equal(partnerShows({ ...GUSTO, url: '' }, 'US'), false);
});

test('with a link: its countries only, never an unknown country', () => {
  const live = { ...GUSTO, url: 'https://example.com/ref' };
  assert.equal(partnerShows(live, 'US'), true);
  assert.equal(partnerShows(live, 'CA'), false);
  assert.equal(partnerShows(live, 'GB'), false);
  assert.equal(partnerShows(live, null), false);
});

test('Gusto is US-only and labelled as a partner link would need', () => {
  assert.deepEqual(GUSTO.countries, ['US']);
  assert.ok(GUSTO.heading && GUSTO.body && GUSTO.cta);
});
