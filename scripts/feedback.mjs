#!/usr/bin/env node
// node scripts/feedback.mjs [--summary] — reads the feedback form's messages
// from KV (QUIZ_KV, `feedback:` keys; see handleFeedbackApi in
// scripts/worker/api.js).
//
// Oct 2026 review: messages are kept 90 days (the privacy page promises it)
// and the email copy has never sent, so they could expire unread. Every
// deploy now prints --summary (count, and when the oldest expires); run it
// without flags to read them. Never fails: a deploy shouldn't stop over it.
import { execFileSync } from 'node:child_process';

const summary = process.argv.includes('--summary');
const wrangler = (args) =>
  execFileSync('npx', ['wrangler', 'kv', 'key', ...args, '--binding', 'QUIZ_KV', '--remote'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

try {
  const keys = JSON.parse(wrangler(['list', '--prefix', 'feedback:']));
  if (keys.length === 0) {
    console.log('[feedback] no messages stored');
    process.exit(0);
  }
  if (summary) {
    const soonest = Math.min(...keys.map((k) => k.expiration ?? Infinity));
    const days = Number.isFinite(soonest) ? Math.floor((soonest * 1000 - Date.now()) / 86400000) : null;
    console.log(
      `[feedback] ${keys.length} message(s) stored` +
        (days !== null ? `; the oldest is deleted in ${days} day(s)` : '') +
        '. Read them: node scripts/feedback.mjs',
    );
    process.exit(0);
  }
  for (const k of keys) {
    let e;
    try {
      e = JSON.parse(wrangler(['get', k.name]));
    } catch {
      console.log(`--- ${k.name} (unreadable)`);
      continue;
    }
    console.log(`--- ${e.ts} · ${e.topic ?? 'no topic'} · ${e.country ?? '??'}${e.email ? ` · ${e.email}` : ''}`);
    console.log(e.message ?? '');
  }
} catch (err) {
  console.log(`[feedback] couldn't read KV (${String(err.stderr || err.message).trim().split('\n').pop()})`);
}
