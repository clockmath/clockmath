#!/usr/bin/env node
// node scripts/errors.mjs [--summary] — reads the site's error log from KV
// (QUIZ_KV, `error:<day>:<hash>` keys, kept 30 days; see handleErrorApi in
// scripts/worker/api.js and lib/errorReport.ts).
//
// Nov 2026: the site's own error log instead of Sentry. Every deploy prints
// --summary (how many distinct errors, and on how many days); run it without
// flags to read them, newest day first. Never fails: a deploy shouldn't stop
// over it.
import { execFileSync } from 'node:child_process';

const summary = process.argv.includes('--summary');
const wrangler = (args) =>
  execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--binding', 'QUIZ_KV', '--remote'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

try {
  const keys = JSON.parse(wrangler(['list', '--prefix', 'error:']));
  if (keys.length === 0) {
    console.log('[errors] no browser errors logged in the last 30 days');
    process.exit(0);
  }
  const days = [...new Set(keys.map((k) => k.name.split(':')[1]))].sort();
  if (summary) {
    console.log(
      `[errors] ${keys.length} distinct error(s) logged on ${days.length} day(s), latest ${days[days.length - 1]}. Read them: npm run errors`,
    );
    process.exit(0);
  }
  const entries = [];
  for (const k of keys) {
    try {
      entries.push({ day: k.name.split(':')[1], ...JSON.parse(wrangler(['get', k.name])) });
    } catch {
      console.log(`--- ${k.name} (unreadable)`);
    }
  }
  // Newest day first, then the most frequent
  entries.sort((a, b) => b.day.localeCompare(a.day) || (b.count ?? 0) - (a.count ?? 0));
  const list = (m) =>
    Object.entries(m ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(', ');
  for (const e of entries) {
    console.log(`--- ${e.day} · ${e.count}× · ${e.kind ?? 'error'} · last ${String(e.last ?? '').slice(11, 16)} UTC`);
    console.log(e.message);
    if (e.source) console.log(`  at ${e.source}`);
    console.log(`  pages: ${list(e.pages)}`);
    console.log(`  browsers: ${list(e.browsers)}`);
    if (e.stack) console.log(e.stack.split('\n').slice(0, 6).map((l) => `  | ${l}`).join('\n'));
  }
} catch (err) {
  console.log(`[errors] couldn't read KV (${String(err.stderr || err.message).trim().split('\n').pop()})`);
}
