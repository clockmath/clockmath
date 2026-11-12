#!/usr/bin/env node
// node scripts/embeds.mjs [days] — which sites show ClockMath's countdown
// embeds and image badges, from the worker's KV keys (QUIZ_KV, `embeds:`
// prefix; see countEmbedUse in scripts/worker/badges.js). One key per host
// page's hostname, embed and UTC day, kept 90 days. "(none)" is requests
// with no Referer (Notion, email apps, privacy settings, bots).
// Nov 2026: GA doesn't run on /embed/, so this is the only measure of use.
import { execFileSync } from 'node:child_process';

const days = Number(process.argv[2]) || 90;
const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

try {
  const out = execFileSync('npx', ['wrangler', 'kv', 'key', 'list', '--prefix', 'embeds:', '--binding', 'QUIZ_KV', '--remote'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // embeds:<day>:<embed|badge>:<slug>:<host>
  const rows = JSON.parse(out)
    .map((k) => k.name.split(':'))
    .filter((p) => p.length >= 5 && p[1] >= since)
    .map(([, day, kind, slug, ...host]) => ({ day, what: `${kind} ${slug}`, host: host.join(':') }));
  if (rows.length === 0) {
    console.log(`[embeds] no embed or badge loads from other sites in the last ${days} days`);
    process.exit(0);
  }
  const byHost = new Map();
  for (const r of rows) {
    const h = byHost.get(r.host) ?? { days: new Set(), what: new Set(), last: '' };
    h.days.add(r.day);
    h.what.add(r.what);
    if (r.day > h.last) h.last = r.day;
    byHost.set(r.host, h);
  }
  console.log(`[embeds] ${byHost.size} site(s) in the last ${days} days (days seen · last seen · what):`);
  for (const [host, h] of [...byHost].sort((a, b) => b[1].days.size - a[1].days.size)) {
    console.log(`  ${host}  ${h.days.size} · ${h.last} · ${[...h.what].sort().join(', ')}`);
  }
} catch (err) {
  console.log(`[embeds] couldn't read KV (${String(err.stderr || err.message).trim().split('\n').pop()})`);
}
