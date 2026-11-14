#!/usr/bin/env node
// node scripts/brand/chart.mjs — writes the embeddable minutes-to-decimal
// chart (Nov 2026, lib/decimalChart.ts) to public/charts/:
//   minutes-to-decimal.svg  drawn from lib/decimalChart.ts (minutesToDecimal)
//   minutes-to-decimal.png  that SVG at 2x, screenshotted by headless Chrome
//                           (macOS path, as generate.mjs), for the embed code
// The PNG carries the SVG's SHA-256 in a tEXt chunk, so
// tests/decimalChart.test.ts can tell when the PNG is older than the SVG.
// Re-run after changing the chart or decimalTime.ts, and commit both files.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'clockmath-chart-'));

const bundle = path.join(TMP, 'decimalChart.mjs');
esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'lib/decimalChart.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundle,
  tsconfig: path.join(ROOT, 'tsconfig.json'),
  logLevel: 'silent',
});
const { MINUTES_CHART, minutesChartSvg } = await import(pathToFileURL(bundle).href);

const svg = minutesChartSvg();
const svgOut = path.join(ROOT, 'public', MINUTES_CHART.svg);
fs.mkdirSync(path.dirname(svgOut), { recursive: true });
fs.writeFileSync(svgOut, svg);
console.log(`[chart] public${MINUTES_CHART.svg}`);

// The SVG on a white page at its own size, screenshotted at 2x
const { width, height } = MINUTES_CHART;
const html = path.join(TMP, 'chart.html');
fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}svg{display:block}</style></head><body>${svg}</body></html>`);
const pngOut = path.join(ROOT, 'public', MINUTES_CHART.png);
execFileSync(
  CHROME,
  ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=2', `--window-size=${width},${height}`, `--screenshot=${pngOut}`, pathToFileURL(html).href],
  { stdio: 'ignore' },
);

// tEXt chunk "svg-sha256" right after IHDR (PNG: 8-byte signature, then
// IHDR's 4 length + 4 type + 13 data + 4 CRC)
const png = fs.readFileSync(pngOut);
const hash = crypto.createHash('sha256').update(svg).digest('hex');
const data = Buffer.from(`svg-sha256\0${hash}`, 'latin1');
const type = Buffer.from('tEXt', 'latin1');
const chunk = Buffer.alloc(12 + data.length);
chunk.writeUInt32BE(data.length, 0);
type.copy(chunk, 4);
data.copy(chunk, 8);
chunk.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])), 8 + data.length);
const ihdrEnd = 8 + 25;
fs.writeFileSync(pngOut, Buffer.concat([png.subarray(0, ihdrEnd), chunk, png.subarray(ihdrEnd)]));
console.log(`[chart] public${MINUTES_CHART.png} ${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
fs.rmSync(TMP, { recursive: true, force: true });
