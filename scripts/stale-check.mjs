#!/usr/bin/env node
// node scripts/stale-check.mjs [--strict] — lists content whose dates have
// run out or soon will. Runs at the start of every deploy (warnings only;
// --strict exits 1). Oct 2026 audit: date tables and event pages go stale
// silently — the Super Bowl page's only date, GTA 6's release day, the
// NYSE/LSE holiday calendars, the daylight-saving table.
//
// Per file it finds every concrete date — 'YYYY-MM-DD' strings,
// new Date(Y, M, D) and "Mon D, YYYY" text — and warns when the latest one
// is past (the page now counts to nothing) or within SOON_DAYS. Rule-based
// pages (Thanksgiving, Christmas…) have no table and roll over on their own.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOON_DAYS = 45;
const VERIFIED_MAX_DAYS = 365;
const strict = process.argv.includes('--strict');

const today = new Date();
const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
const DAY = 86400000;
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function datesIn(src) {
  const out = [];
  for (const m of src.matchAll(/['"`](20\d\d)-(\d\d)-(\d\d)['"`/]/g)) out.push(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  for (const m of src.matchAll(/new Date\((20\d\d),\s*(\d{1,2}),\s*(\d{1,2})\)/g)) out.push(Date.UTC(+m[1], +m[2], +m[3]));
  for (const m of src.matchAll(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (20\d\d)\b/g)) {
    out.push(Date.UTC(+m[3], MONTHS[m[1].toLowerCase()], +m[2]));
  }
  return out;
}

const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);
const files = [
  ...fs.readdirSync(path.join(ROOT, 'app/countdown')).map((d) => `app/countdown/${d}/page.tsx`),
  'lib/holidays.ts',
  'lib/markets.ts',
].filter((f) => fs.existsSync(path.join(ROOT, f)));

const problems = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // lastUpdated is a verification stamp, not an event date.
  const lastUpdated = src.match(/lastUpdated="(\d{4}-\d{2}-\d{2})"/)?.[1];
  const dates = datesIn(src.replace(/lastUpdated="[^"]*"/g, ''));
  if (dates.length) {
    const latest = Math.max(...dates);
    const daysLeft = Math.round((latest - todayUtc) / DAY);
    if (daysLeft < 0) problems.push(`${f}: every date has passed (latest ${fmt(latest)}) — roll it forward or retire the page`);
    else if (daysLeft <= SOON_DAYS) problems.push(`${f}: latest date ${fmt(latest)} is ${daysLeft} days away — add the next date, or plan the page for after it`);
  }
  if (lastUpdated) {
    const [y, m, d] = lastUpdated.split('-').map(Number);
    const age = Math.round((todayUtc - Date.UTC(y, m - 1, d)) / DAY);
    if (age > VERIFIED_MAX_DAYS) problems.push(`${f}: facts last verified ${lastUpdated} (${age} days ago)`);
  }
}

if (problems.length === 0) {
  console.log('[stale-check] no date tables running out');
} else {
  console.log(`[stale-check] ${problems.length} item(s) need attention:`);
  for (const p of problems) console.log(`[stale-check]   ${p}`);
}
if (strict && problems.length) process.exit(1);
