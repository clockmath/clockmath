// node --test tests/ — the AdSense switch and ads.txt line (lib/ads.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adsConfigValid, adsTxt, isAdHost } from '../lib/ads.ts';

test('ads stay off until both IDs are real', () => {
  assert.equal(adsConfigValid('', ''), false);
  assert.equal(adsConfigValid('ca-pub-1234567890123456', ''), false, 'no slot');
  assert.equal(adsConfigValid('', '1234567890'), false, 'no publisher');
  assert.equal(adsConfigValid('pub-1234567890123456', '1234567890'), false, 'needs the ca- prefix');
  assert.equal(adsConfigValid('ca-pub-123', '1234567890'), false, 'too short');
  assert.equal(adsConfigValid('ca-pub-1234567890123456', '1234567890'), true);
});

test('ads.txt names the publisher without the ca- prefix', () => {
  assert.equal(adsTxt('ca-pub-1234567890123456'), 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
});

test('real ads only on the live host', () => {
  assert.equal(isAdHost('clockmath.com'), true);
  for (const h of ['localhost', '127.0.0.1', 'www.clockmath.com', 'abc123.clockmath.pages.dev', 'clockmath.com.evil.test']) {
    assert.equal(isAdHost(h), false, h);
  }
});
