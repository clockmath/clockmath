// node scripts/worker/api.test.js — runs the worker's API handlers and
// redirect table (scripts/worker/api.js) in Node against an in-memory KV.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const quizLib = require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '../../lib/quiz.ts')],
  bundle: true,
  format: 'iife',
  globalName: '__cmQuiz',
  target: 'es2020',
  write: false,
  logLevel: 'silent',
}).outputFiles[0].text;
const code = fs.readFileSync(path.join(__dirname, 'api.js'), 'utf8');
// withSecurityHeaders uses cacheControlFor from live-counts.js, as in the worker.
const liveCounts = fs.readFileSync(path.join(__dirname, 'live-counts.js'), 'utf8');
const api = new Function(
  `${quizLib}\n${liveCounts}\n${code}\nreturn { handleQuizApi, handlePlacesApi, handleFeedbackApi, fbSendEmailCopy, redirectTarget, rateLimited, withSecurityHeaders, cspNonce, __cmQuiz };`,
)();

function memoryKV() {
  const m = new Map();
  return {
    m,
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v); },
  };
}
const today = new Date().toISOString().slice(0, 10);
const post = (url, body, headers = {}) =>
  new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

(async () => {
  // ---- Quiz: scored from picks, never from a posted score ----
  const env = { QUIZ_KV: memoryKV() };
  const right = api.__cmQuiz.generateDailyQuiz(today).questions.map((q) => q.correctIndex);
  const wrong = right.map((p) => (p + 1) % 4);

  let res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, score: 5, timeMs: 20000 }, { 'CF-Connecting-IP': '1.1.1.1' }), env);
  assert.strictEqual(res.status, 400, 'no picks rejected');
  assert.strictEqual(env.QUIZ_KV.m.size, 0, 'nothing written for a rejected post');

  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, score: 5, picks: wrong, timeMs: 20000, initials: 'BBB' }, { 'CF-Connecting-IP': '1.1.1.2' }), env);
  let data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.score, 0, 'posted score ignored; all-wrong picks score 0');

  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 21000, initials: 'CCC' }, { 'CF-Connecting-IP': '1.1.1.3' }), env);
  data = await res.json();
  assert.strictEqual(data.score, 5);
  assert.strictEqual(data.rank, 1);
  assert.match(res.headers.get('Set-Cookie'), /cmq_day=/);

  // Same browser again (cookie) → 409; too fast → 400; blocked initials → 400.
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 21000 }, { 'CF-Connecting-IP': '1.1.1.4', Cookie: `cmq_day=${today}` }), env);
  assert.strictEqual(res.status, 409);
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 5000 }, { 'CF-Connecting-IP': '1.1.1.5' }), env);
  assert.strictEqual(res.status, 400);
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 30000, initials: 'KKK' }, { 'CF-Connecting-IP': '1.1.1.6' }), env);
  assert.strictEqual(res.status, 400);
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: '2020-01-01', picks: right, timeMs: 30000 }, { 'CF-Connecting-IP': '1.1.1.7' }), env);
  assert.strictEqual(res.status, 400, "only today's puzzle");

  // No cookie but the same address: 3 submissions a day, then 409 (Oct 2026).
  for (let n = 0; n < 3; n++) {
    res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: wrong, timeMs: 30000 }, { 'CF-Connecting-IP': '9.9.9.9' }), env);
    assert.strictEqual(res.status, 200, `submission ${n + 1} from one IP accepted`);
  }
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 30000, initials: 'ZZZ' }, { 'CF-Connecting-IP': '9.9.9.9' }), env);
  assert.strictEqual(res.status, 409, 'fourth from one IP refused');
  assert.ok(!env.QUIZ_KV.m.get('board:' + today).includes('9.9.9.9'), 'raw IP never stored');

  // GET returns the board; KV write failure → 503, not an exception.
  res = await api.handleQuizApi(new Request(`https://clockmath.com/api/quiz?day=${today}`), env);
  data = await res.json();
  assert.deepStrictEqual(data.top.map((e) => e.i), ['CCC', 'BBB']);
  const failing = { QUIZ_KV: { get: async () => null, put: async () => { throw new Error('429'); } } };
  res = await api.handleQuizApi(post('https://clockmath.com/api/quiz', { day: today, picks: right, timeMs: 30000 }, { 'CF-Connecting-IP': '1.1.1.8' }), failing);
  assert.strictEqual(res.status, 503);

  // CORS preflight: 204 with no body (a body made this throw until Oct 2026).
  res = await api.handleQuizApi(new Request('https://clockmath.com/api/quiz', { method: 'OPTIONS', headers: { Origin: 'https://clockmath.com' } }), env);
  assert.strictEqual(res.status, 204);
  assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://clockmath.com');
  res = await api.handleFeedbackApi(new Request('https://clockmath.com/api/feedback', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), env);
  assert.strictEqual(res.status, 204);
  assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), null, 'other origins get no CORS grant');

  // ---- Feedback email copy: the REST payload, and failures are logged ----
  const entry = { message: 'The sleep tool is great', email: 'visitor@example.com', topic: 'feedback', country: 'CA', ts: '2026-10-26T00:00:00.000Z' };
  const realFetch = globalThis.fetch;
  const realError = console.error;
  const realWarn = console.warn;
  const logged = [];
  console.error = console.warn = (m) => logged.push(m);
  let sent = null;
  let reply = { status: 200, body: { success: true, errors: [], result: { delivered: ['hello@clockmath.com'], permanent_bounces: [], queued: [] } } };
  globalThis.fetch = async (url, init) => {
    sent = { url, init };
    return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    assert.strictEqual(await api.fbSendEmailCopy({}, entry), false, 'not configured');
    assert.strictEqual(sent, null, 'nothing sent without a token');
    assert.match(logged.pop(), /EMAIL_SEND_TOKEN/);

    const mailEnv = { EMAIL_SEND_TOKEN: 'tok', CF_ACCOUNT_ID: 'acct' };
    assert.strictEqual(await api.fbSendEmailCopy(mailEnv, entry), true);
    assert.strictEqual(sent.url, 'https://api.cloudflare.com/client/v4/accounts/acct/email/sending/send');
    assert.strictEqual(sent.init.headers.Authorization, 'Bearer tok');
    const payload = JSON.parse(sent.init.body);
    assert.strictEqual(payload.to, 'hello@clockmath.com');
    assert.deepStrictEqual(payload.from, { address: 'feedback@clockmath.com', name: 'ClockMath Feedback' }, 'REST uses address, not email');
    assert.strictEqual(payload.reply_to, 'visitor@example.com', 'REST uses reply_to');
    assert.ok(payload.text.includes('The sleep tool is great'));
    assert.strictEqual(logged.length, 0);

    reply = { status: 403, body: { success: false, errors: [{ code: 10000, message: 'Authentication error' }] } };
    assert.strictEqual(await api.fbSendEmailCopy(mailEnv, entry), false);
    const line = logged.pop();
    assert.match(line, /HTTP 403 \(10000 Authentication error\)/);
    assert.ok(!line.includes('sleep tool') && !line.includes('visitor@'), 'the log never carries the message or address');

    reply = { status: 200, body: { success: true, errors: [], result: { delivered: [], permanent_bounces: ['hello@clockmath.com'], queued: [] } } };
    assert.strictEqual(await api.fbSendEmailCopy(mailEnv, entry), false);
    assert.match(logged.pop(), /bounced/);
  } finally {
    globalThis.fetch = realFetch;
    console.error = realError;
    console.warn = realWarn;
  }

  // ---- Places: long queries rejected before any upstream call ----
  res = await api.handlePlacesApi(new Request(`https://clockmath.com/api/places?q=${'a'.repeat(120)}`), { GEOAPIFY_API_KEY: 'test' });
  assert.strictEqual(res.status, 400);

  // ---- Rate limiter: per key, resets, prunes ----
  const hits = new Map();
  for (let i = 0; i < 3; i++) assert.strictEqual(api.rateLimited(hits, 'ip', 3, 60000), false);
  assert.strictEqual(api.rateLimited(hits, 'ip', 3, 60000), true);
  assert.strictEqual(api.rateLimited(hits, 'other', 3, 60000), false);

  // ---- Redirects: known paths only, always to clockmath.com paths ----
  assert.strictEqual(api.redirectTarget('/articles/sleep-hours-calculator'), '/tools/sleep/');
  assert.strictEqual(api.redirectTarget('/blog/sleep-hours-calculator/'), '/tools/sleep/');
  assert.strictEqual(api.redirectTarget('/tool/timezone/'), '/tools/timezone/');
  assert.strictEqual(api.redirectTarget('/countdown/spider-man-brand-new-day/'), '/countdown/avengers-doomsday/');
  assert.strictEqual(api.redirectTarget('/tools/timezone/'), null);
  for (const p of ['//evil.com', '/blog//evil.com', '/tool/%2F%2Fevil.com']) {
    const t = api.redirectTarget(p);
    assert.ok(t === null || (t.startsWith('/') && !t.startsWith('//')), `${p} → ${t}`);
  }

  // ---- Security headers on every response ----
  const h = api.withSecurityHeaders(new Response('x', { headers: { 'Content-Type': 'text/html' } }), '/').headers;
  for (const k of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options', 'Cross-Origin-Opener-Policy']) {
    assert.ok(h.get(k), `${k} set`);
  }
  // Clarity's Bing sync pixel (c.bing.com/c.gif) may load
  assert.match(h.get('Content-Security-Policy'), /img-src [^;]*https:\/\/c\.bing\.com/, 'img-src allows c.bing.com');

  // Embeds may be framed by any site; nothing else may.
  const embed = api.withSecurityHeaders(new Response('x', { headers: { 'Content-Type': 'text/html' } }), '/embed/countdown/thanksgiving/').headers;
  assert.strictEqual(embed.get('X-Frame-Options'), null, 'embed: no X-Frame-Options');
  assert.match(embed.get('Content-Security-Policy'), /frame-ancestors \*/);
  assert.match(h.get('Content-Security-Policy'), /frame-ancestors 'none'/, 'other pages still refuse framing');
  assert.strictEqual(h.get('X-Frame-Options'), 'DENY');
  const lookalike = api.withSecurityHeaders(new Response('x'), '/embedded-thing/').headers;
  assert.strictEqual(lookalike.get('X-Frame-Options'), 'DENY', 'only /embed/ itself');

  // No 'unsafe-inline' for scripts: inline scripts need the response's nonce
  const csp = api.withSecurityHeaders(new Response('x', { headers: { 'Content-Type': 'text/html' } }), '/', 'abc123').headers.get('Content-Security-Policy');
  const directive = (name) => (csp.split('; ').find((d) => d.split(' ')[0] === name) || '');
  assert.match(directive('script-src'), /'nonce-abc123'/);
  assert.doesNotMatch(directive('script-src'), /unsafe-inline|unsafe-eval|strict-dynamic/);
  assert.match(directive('style-src-elem'), /'nonce-abc123'/);
  assert.doesNotMatch(directive('style-src-elem'), /unsafe-inline/);
  assert.strictEqual(directive('style-src-attr'), "style-src-attr 'unsafe-inline'", 'style="…" attributes still apply');
  for (const host of ['https://www.googletagmanager.com', 'https://static.cloudflareinsights.com', 'https://www.clarity.ms', 'https://scripts.clarity.ms']) {
    assert.ok(directive('script-src').includes(host), `script-src allows ${host}`);
  }
  // A fresh, unguessable nonce each time
  const n1 = api.cspNonce();
  assert.match(n1, /^[A-Za-z0-9+/]{22}==$/);
  assert.notStrictEqual(n1, api.cspNonce());
  // A 304 sends no CSP, so the browser keeps the one that came with its stored page
  const notModified = api.withSecurityHeaders(new Response(null, { status: 304 }), '/').headers;
  assert.strictEqual(notModified.get('Content-Security-Policy'), null);

  console.log('api: all checks passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
