#!/usr/bin/env node
/**
 * IndexNow: tells Bing (and the other IndexNow engines) which pages changed,
 * so they're recrawled in minutes instead of whenever the crawler returns.
 * Bing sends ~5x Google's search clicks to this site, so this matters.
 *
 * Runs after `wrangler pages deploy` (see the "deploy" script). Per the
 * protocol (indexnow.org/documentation), only URLs that were ADDED, UPDATED
 * or DELETED are submitted — resubmitting unchanged pages risks a 429.
 *
 * Change detection: a fingerprint of each page's visible <main> text from
 * the deployed output, compared with .indexnow-state.json (git-ignored,
 * written only after a successful submission). Visible text, not raw HTML,
 * because chunk hashes and build ids change on every build.
 *
 *   node scripts/indexnow.js            submit changed pages
 *   node scripts/indexnow.js --dry-run  show what would be submitted
 *   node scripts/indexnow.js --all      submit every page (first run does this)
 *
 * Never fails the deploy: problems are reported, exit code stays 0.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = 'clockmath.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const STATE_FILE = path.join(ROOT, '.indexnow-state.json');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const ALL = args.has('--all');

function findKey() {
  const files = fs.readdirSync(path.join(ROOT, 'public')).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  if (files.length !== 1) throw new Error(`expected exactly one IndexNow key file in public/, found ${files.length}`);
  const key = files[0].replace(/\.txt$/, '');
  if (fs.readFileSync(path.join(ROOT, 'public', files[0]), 'utf8').trim() !== key) throw new Error('key file contents do not match its name');
  return key;
}

function pageUrls() {
  const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function fingerprint(url) {
  const p = new URL(url).pathname;
  const file = p === '/' ? path.join(OUT, 'index.html') : path.join(OUT, p, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  const text = main
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    // Countdown numbers and dates the worker rewrites per request
    // (scripts/worker/live-counts.js): build-day values, not page changes.
    .replace(/(<[^>]+\sdata-live(?:-date)?="[^"]*"[^>]*>)[^<]*/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  return crypto.createHash('sha256').update(title + '\n' + text).digest('hex').slice(0, 16);
}

async function main() {
  const key = findKey();
  const urls = pageUrls();
  const current = Object.fromEntries(urls.map((u) => [u, fingerprint(u)]));
  const previous = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : null;

  let changed;
  let reason;
  if (ALL || !previous) {
    changed = urls;
    reason = previous ? 'all pages (--all)' : 'all pages (first run — no saved state)';
  } else {
    const added = urls.filter((u) => !(u in previous));
    const updated = urls.filter((u) => u in previous && previous[u] !== current[u]);
    const deleted = Object.keys(previous).filter((u) => !(u in current));
    changed = [...added, ...updated, ...deleted];
    reason = `${added.length} added, ${updated.length} updated, ${deleted.length} removed`;
  }

  console.log(`[indexnow] ${changed.length} of ${urls.length} URLs to submit — ${reason}`);
  changed.forEach((u) => console.log(`[indexnow]   ${u}`));
  if (changed.length === 0) return;
  if (DRY_RUN) {
    console.log('[indexnow] dry run: nothing sent, state not saved');
    return;
  }

  // The engines fetch the key file to validate the submission. This runs
  // seconds after a deploy, so confirm the live file first (up to ~30 s)
  // rather than risk a 403 from an edge that hasn't caught up yet.
  const keyLocation = `https://${HOST}/${key}.txt`;
  let keyLive = false;
  for (let attempt = 0; attempt < 7 && !keyLive; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 5000));
    try {
      const k = await fetch(`${keyLocation}?cb=${Date.now()}`);
      keyLive = k.ok && (await k.text()).trim() === key;
    } catch { /* retry */ }
  }
  if (!keyLive) {
    console.log(`[indexnow] key file not live at ${keyLocation} — not submitting; state not saved, will retry next run`);
    return;
  }

  const body = { host: HOST, key, keyLocation, urlList: changed };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const meaning = {
    200: 'OK — submitted', 202: 'Accepted — key validation pending', 400: 'Bad request — invalid format',
    403: 'Forbidden — key not valid (is the key file deployed?)', 422: 'Unprocessable — URL/host or key mismatch',
    429: 'Too many requests — slow down',
  }[res.status] || 'unexpected';
  console.log(`[indexnow] ${res.status} ${meaning}`);
  if (res.status === 200 || res.status === 202) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(current, null, 1));
    console.log(`[indexnow] state saved (${urls.length} pages)`);
  } else {
    console.log('[indexnow] state NOT saved — these URLs will be retried on the next run');
  }
}

module.exports = { pageUrls, fingerprint, findKey };

if (require.main === module) {
  main().catch((e) => console.log(`[indexnow] skipped: ${e.message}`));
}
