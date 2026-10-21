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
  `${quizLib}\n${liveCounts}\n${code}\nreturn { handleQuizApi, handlePlacesApi, handleFeedbackApi, redirectTarget, rateLimited, withSecurityHeaders, __cmQuiz };`,
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

  console.log('api: all checks passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
