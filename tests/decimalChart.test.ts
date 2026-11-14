// node --test tests/ — the embeddable minutes-to-decimal chart
// (lib/decimalChart.ts): the files in public/charts/ must be what the lib
// draws now, so the image other sites show can't drift from the page's chart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MINUTES_CHART, minutesChartSvg } from '../lib/decimalChart.ts';
import { minutesToDecimal } from '../lib/decimalTime.ts';

const PUBLIC = path.join(import.meta.dirname, '../public');
const RERUN = 'out of date: run `node scripts/brand/chart.mjs` and commit public/charts/';

test('the chart shows every minute from 1 to 60 with its decimal hours', () => {
  const svg = minutesChartSvg();
  for (let m = 1; m <= 60; m++) {
    // The minute's cell and, right after it, its hours
    assert.match(svg, new RegExp(`>${m}</text>\\n<text [^>]*>${minutesToDecimal(m).toFixed(2)}</text>`), `${m} minutes`);
  }
  assert.match(svg, />0\.75<\/text>/);
  assert.match(svg, />1\.00<\/text>/);
  assert.match(svg, />clockmath\.com<\/text>/);
  assert.match(svg, new RegExp(`width="${MINUTES_CHART.width}" height="${MINUTES_CHART.height}"`));
  // No <style> or script: the worker's CSP applies when the file is opened
  assert.doesNotMatch(svg, /<style|<script|href=/);
});

test('public/charts/minutes-to-decimal.svg is the lib’s chart', () => {
  assert.equal(fs.readFileSync(path.join(PUBLIC, MINUTES_CHART.svg), 'utf8'), minutesChartSvg(), RERUN);
});

test('the PNG was rendered from that SVG, at 2x', () => {
  const png = fs.readFileSync(path.join(PUBLIC, MINUTES_CHART.png));
  assert.equal(png.readUInt32BE(16), MINUTES_CHART.width * 2);
  assert.equal(png.readUInt32BE(20), MINUTES_CHART.height * 2);
  const hash = crypto.createHash('sha256').update(minutesChartSvg()).digest('hex');
  assert.ok(png.includes(Buffer.from(`svg-sha256\0${hash}`, 'latin1')), RERUN);
});
