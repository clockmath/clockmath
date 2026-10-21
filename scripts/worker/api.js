// ---- Security headers, API handlers and redirects (injected into _worker.js) ----
// Plain worker code, concatenated into the generated worker by
// scripts/inject-api.js; scripts/worker/api.test.js loads it in Node.
//
// next-on-pages emits a _worker.js (Cloudflare Pages "Advanced Mode"), which
// makes Cloudflare IGNORE both functions/ and public/_redirects, so every API
// endpoint and redirect lives here. Until Oct 2026 this was a template string
// inside inject-api.js (no syntax check, lint or tests) with drifting copies
// in functions/api/; those copies are gone.
//
// Expects `__cmQuiz` (lib/quiz.ts, compiled by inject-api.js) in scope.
// ---- Injected security headers ----
// _headers is unreliable in next-on-pages Advanced Mode (the _worker.js
// overrides response headers), so security headers are applied here on every
// response instead. This is the authoritative source for these headers.
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // No page here needs a handle on a window it opens or that opened it
  // (sharing uses navigator.share; outbound links are noopener).
  'Cross-Origin-Opener-Policy': 'same-origin',
  // Microsoft Clarity (added to the CSP Oct 2026 — it was blocked on every page from its Aug 2026 launch):
  // the tag at www.clarity.ms loads scripts.clarity.ms/<ver>/clarity.js, uploads to <letter>.clarity.ms/collect
  // (XHR/sendBeacon) and fires c.clarity.ms/c.gif. The upload host's letter varies, hence *.clarity.ms for
  // connect/img; scripts stay pinned to the two exact hosts. Any new third-party script needs adding here.
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com https://www.clarity.ms https://scripts.clarity.ms; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.clarity.ms; font-src 'self' data:; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://*.clarity.ms; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests",
};

function withSecurityHeaders(res, pathname) {
  try {
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    const cacheControl = cacheControlFor(pathname, res);
    if (cacheControl) headers.set('Cache-Control', cacheControl);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  } catch (e) {
    return res;
  }
}

// ---- API handlers ----
const ALLOWED_ORIGINS = new Set(['https://clockmath.com', 'https://www.clockmath.com']);

function buildCorsHeaders(request) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

// Best-effort per-IP limiter. Maps live per worker isolate, so this only
// slows a burst hitting one location; real limits need a Cloudflare rate
// limiting rule. Expired buckets are pruned so the Map can't grow forever.
const placesIpHits = new Map();
function rateLimited(map, ip, max, windowMs) {
  const now = Date.now();
  if (map.size > 5000) {
    for (const [k, b] of map) if (now > b.reset) map.delete(k);
  }
  const bucket = map.get(ip);
  if (!bucket || now > bucket.reset) {
    map.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

async function handlePlacesApi(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const corsHeaders = buildCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!query || query.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'Query parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
  // Place names are short; a cap stops junk queries spending Geoapify credits.
  if (query.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Query too long', results: [] }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Answers are cached at the edge for a day by lower-cased query, so the
  // same search from many visitors costs one Geoapify request per location
  // (Cache-Control alone only helped each browser). Oct 2026 audit.
  const cacheKey = new Request('https://clockmath.com/__places-cache?q=' + encodeURIComponent(query.trim().toLowerCase()));
  const edgeCache = typeof caches !== 'undefined' ? caches.default : null;
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(cacheKey);
      if (hit) {
        return new Response(hit.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders } });
      }
    } catch (e) { /* cache unavailable — fall through to Geoapify */ }
  }
  if (rateLimited(placesIpHits, request.headers.get('CF-Connecting-IP') || 'unknown', 120, 3600000)) {
    return new Response(
      JSON.stringify({ error: 'Too many searches — try again later', results: [] }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const apiKey = env.GEOAPIFY_API_KEY || env.GEOAPIFY_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const geoapifyUrl = new URL('https://api.geoapify.com/v1/geocode/search');
    geoapifyUrl.searchParams.set('text', query.trim());
    geoapifyUrl.searchParams.set('apiKey', apiKey);
    geoapifyUrl.searchParams.set('limit', '8');
    geoapifyUrl.searchParams.set('format', 'json');
    geoapifyUrl.searchParams.set('type', 'city');

    const response = await fetch(geoapifyUrl.toString());

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error('Geoapify API error: ' + response.status + ' - ' + responseText.substring(0, 200));
    }

    const data = await response.json();

    const formatPlaceName = (item) => {
      const parts = [];
      if (item.name) parts.push(item.name);
      else if (item.city) parts.push(item.city);
      if (item.state && item.state !== item.name) parts.push(item.state);
      else if (item.county && item.county !== item.name) parts.push(item.county);
      if (item.country && item.country !== item.state && item.country !== item.name) parts.push(item.country);
      return parts.filter(Boolean).join(', ');
    };

    const results = (data.results || []).map((item) => ({
      name: formatPlaceName(item),
      lat: item.lat,
      lon: item.lon,
    }));

    const json = JSON.stringify({ results });
    if (edgeCache) {
      try {
        await edgeCache.put(cacheKey, new Response(json, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }));
      } catch (e) { /* not cached — fine */ }
    }
    return new Response(
      json,
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to search locations', results: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

function handleGeoApi(request) {
  const country = (request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || 'XX';
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return new Response(JSON.stringify({ country }), { headers });
}

// ---- Daily quiz leaderboard ----
// GET  /api/quiz?day=YYYY-MM-DD[&s=&t=] → { day, count, top: [{i, s, t}], percentile?, position? }
// GET  /api/quiz?week=1                 → { days: [{ day, champion, count }] } (last 7 finished days)
// POST /api/quiz {day, picks, timeMs, initials?} → { accepted, score, count, percentile, rank?, top }
//
// Design notes (no-signup site, so enforcement is best-effort by design):
// - Only TODAY (UTC) accepts submissions; the date is the puzzle id.
// - The score is computed here from `picks` against the quiz regenerated from
//   the date (__cmQuiz = lib/quiz.ts, compiled in by inject-api.js).
// - Once-per-day: HttpOnly cookie + client-side localStorage. A determined
//   cheater can clear both; the plausibility gates below bound the damage.
// - Plausibility: ≥2 s per question, ≤1 h total.
// - Initials are optional (percentile works without them) and moderated by
//   lib/quiz.ts's blocklist.
// - KV read-modify-write is not transactional; two simultaneous submits can
//   drop one score. Acceptable at this traffic level.
const QUIZ_BLOCKED_INITIALS = __cmQuiz.BLOCKED_INITIALS;
const QUIZ_MAX_STORED_SCORES = 5000;
const QUIZ_MAX_TOP = 25;
const QUIZ_COOKIE = 'cmq_day';
const quizIpHits = new Map();
const quizChampionCache = new Map();

function quizRateLimited(ip) {
  return rateLimited(quizIpHits, ip, 60, 60 * 60 * 1000);
}

function quizUtcToday() {
  return new Date().toISOString().slice(0, 10);
}

function quizJson(request, status, body, extraHeaders) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  // A 204 must have no body: new Response("null", { status: 204 }) throws,
  // which made every CORS preflight to /api/quiz and /api/feedback a 500.
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: Object.assign(headers, extraHeaders || {}) });
}

async function quizLoadBoard(env, day) {
  const raw = await env.QUIZ_KV.get('board:' + day);
  if (!raw) return { count: 0, scores: [], top: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      count: parsed.count || 0,
      scores: Array.isArray(parsed.scores) ? parsed.scores : [],
      top: Array.isArray(parsed.top) ? parsed.top : [],
    };
  } catch (e) {
    return { count: 0, scores: [], top: [] };
  }
}

function quizBeats(a, b) {
  if (a.s !== b.s) return a.s > b.s;
  return a.t < b.t;
}

async function handleQuizApi(request, env) {
  if (request.method === 'OPTIONS') {
    return quizJson(request, 204, null, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  }
  if (!env.QUIZ_KV) return quizJson(request, 503, { error: 'leaderboard unavailable' });

  if (request.method === 'GET') {
    const url = new URL(request.url);

    // ?week=1 → champions of the last 7 completed days (finished boards are
    // immutable → cacheable).
    if (url.searchParams.get('week') === '1') {
      const now = new Date();
      const days = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)).toISOString().slice(0, 10);
        let cached = quizChampionCache.get(d);
        if (cached === undefined) {
          const b = await quizLoadBoard(env, d);
          cached = { champion: b.top[0] || null, count: b.count };
          quizChampionCache.set(d, cached);
        }
        days.push({ day: d, champion: cached.champion, count: cached.count });
      }
      return quizJson(request, 200, { days });
    }

    const day = url.searchParams.get('day') || quizUtcToday();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return quizJson(request, 400, { error: 'bad day' });
    const board = await quizLoadBoard(env, day);

    // Optional live percentile: caller's
    // own s/t compared against everyone who has played so far, excluding one
    // matching entry as self.
    let livePercentile = null;
    let livePosition = null;
    const qs = url.searchParams.get('s');
    const qt = url.searchParams.get('t');
    if (qs !== null && qt !== null) {
      const score = Number(qs);
      const timeMs = Number(qt);
      const valid = Number.isInteger(score) && score >= 0 && score <= 5 &&
        Number.isInteger(timeMs) && timeMs > 0 && timeMs <= 3600000;
      if (valid && board.scores.length > 0) {
        let beaten = 0;
        let better = 0;
        let self = 0;
        for (const pair of board.scores) {
          if (score > pair[0] || (score === pair[0] && timeMs < pair[1])) beaten += 1;
          else if (score === pair[0] && timeMs === pair[1]) self += 1;
          else better += 1;
        }
        const others = board.scores.length - (self > 0 ? 1 : 0);
        livePercentile = others > 0 ? Math.round((beaten / others) * 100) : 100;
        // Competition ranking: ties share the position.
        livePosition = better + 1;
      }
    }

    return quizJson(request, 200, Object.assign(
      { day, count: board.count, top: board.top.slice(0, 10) },
      livePercentile !== null ? { percentile: livePercentile } : {},
      livePosition !== null ? { position: livePosition } : {},
    ));
  }

  if (request.method !== 'POST') return quizJson(request, 405, { error: 'method not allowed' });

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (quizRateLimited(ip)) return quizJson(request, 429, { error: 'slow down' });

  let body;
  try {
    // A legitimate submission is <200 bytes; cap well above that so junk
    // payloads are rejected before JSON parsing.
    const raw = await request.text();
    if (raw.length > 1024) return quizJson(request, 400, { error: 'body too large' });
    body = JSON.parse(raw);
  } catch (e) {
    return quizJson(request, 400, { error: 'bad json' });
  }

  const today = quizUtcToday();
  const day = body && body.day;
  const picks = body && body.picks;
  const timeMs = body && body.timeMs;
  let initials = body && body.initials;

  if (day !== today) return quizJson(request, 400, { error: "not today's puzzle" });
  // Score from the chosen answers against today's quiz (generated from the
  // date, exactly as the page does) — a posted "score" is ignored.
  if (!Array.isArray(picks) || picks.length !== 5 || !picks.every((p) => Number.isInteger(p) && p >= 0 && p < 10)) {
    return quizJson(request, 400, { error: 'answers required' });
  }
  let score;
  try {
    const quiz = __cmQuiz.generateDailyQuiz(day);
    score = picks.reduce((n, p, i) => n + (p === quiz.questions[i].correctIndex ? 1 : 0), 0);
  } catch (e) {
    return quizJson(request, 503, { error: 'quiz unavailable' });
  }
  if (!Number.isInteger(timeMs) || timeMs < 2000 * 5 || timeMs > 60 * 60 * 1000) return quizJson(request, 400, { error: 'implausible time' });
  if (initials != null) {
    if (typeof initials !== 'string' || !/^[A-Z]{3}$/.test(initials) || QUIZ_BLOCKED_INITIALS.has(initials)) {
      return quizJson(request, 400, { error: 'bad initials' });
    }
  } else {
    initials = null;
  }

  const cookies = request.headers.get('Cookie') || '';
  const cookieMatch = cookies.match(new RegExp(QUIZ_COOKIE + '=([\\d-]+)'));
  if (cookieMatch && cookieMatch[1] === today) return quizJson(request, 409, { error: 'already submitted today' });

  const board = await quizLoadBoard(env, day);
  const entry = { s: score, t: timeMs };
  const beaten = board.scores.filter((row) => quizBeats(entry, { s: row[0], t: row[1] })).length;
  const percentile = board.scores.length === 0 ? 100 : Math.round((beaten / board.scores.length) * 100);

  board.count += 1;
  if (board.scores.length < QUIZ_MAX_STORED_SCORES) board.scores.push([score, timeMs]);

  let rank = null;
  if (initials) {
    board.top.push({ i: initials, s: score, t: timeMs });
    board.top.sort((a, b) => (quizBeats(a, b) ? -1 : 1));
    board.top = board.top.slice(0, QUIZ_MAX_TOP);
    const idx = board.top.findIndex((e) => e.i === initials && e.s === score && e.t === timeMs);
    if (idx !== -1) rank = idx + 1;
  }

  // KV allows about one write per second per key; under a burst put() can
  // throw (429). Answer cleanly instead of an uncaught 500.
  try {
    await env.QUIZ_KV.put('board:' + day, JSON.stringify(board), { expirationTtl: 60 * 60 * 24 * 14 });
  } catch (e) {
    return quizJson(request, 503, { error: 'leaderboard busy — try again in a moment' });
  }

  return quizJson(
    request,
    200,
    { accepted: true, score, count: board.count, percentile, rank, top: board.top.slice(0, 10) },
    { 'Set-Cookie': QUIZ_COOKIE + '=' + today + '; Path=/api/quiz; Max-Age=172800; HttpOnly; Secure; SameSite=Lax' },
  );
}

// ---- Feedback form ----
// Every valid submission is stored durably in KV (QUIZ_KV, `feedback:` prefix,
// 90-day TTL) so nothing is ever lost. When the two email env vars are
// configured on the Pages project, a copy is also emailed to the site owner
// via Cloudflare Email Sending's REST API (the `send_email` binding is
// Workers-only — Pages Functions don't support it, so REST it is):
//   EMAIL_SEND_TOKEN — API token with Email Sending permission
//   CF_ACCOUNT_ID    — Cloudflare account id
// Email failure never fails the request; the KV copy is the source of truth.
const fbIpHits = new Map();
function fbRateLimited(ip) {
  return rateLimited(fbIpHits, ip, 5, 3600000);
}

async function fbSendEmailCopy(env, entry) {
  if (!env.EMAIL_SEND_TOKEN || !env.CF_ACCOUNT_ID) return;
  const label = entry.topic === 'feature' ? 'Feature request' : 'Feedback';
  const payload = {
    to: 'hello@clockmath.com',
    from: { address: 'feedback@clockmath.com', name: 'ClockMath Feedback' },
    subject: 'ClockMath ' + label.toLowerCase() + ': ' + entry.message.slice(0, 60).replace(/\s+/g, ' '),
    text: [label + ' from clockmath.com', '', entry.message, '', '—',
      'Reply-to: ' + (entry.email || 'not provided'),
      'Country: ' + entry.country + '  ·  ' + entry.ts].join('\n'),
  };
  if (entry.email) payload.reply_to = entry.email;
  await fetch('https://api.cloudflare.com/client/v4/accounts/' + env.CF_ACCOUNT_ID + '/email/sending/send', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.EMAIL_SEND_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function handleFeedbackApi(request, env) {
  if (request.method === 'OPTIONS') {
    return quizJson(request, 204, null, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  }
  if (request.method !== 'POST') return quizJson(request, 405, { error: 'method not allowed' });
  if (!env.QUIZ_KV) return quizJson(request, 503, { error: 'unavailable' });

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (fbRateLimited(ip)) return quizJson(request, 429, { error: 'slow down' });

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return quizJson(request, 400, { error: 'too large' });
    body = JSON.parse(raw);
  } catch (e) {
    return quizJson(request, 400, { error: 'bad json' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return quizJson(request, 400, { error: 'bad body' });

  const message = body.message, email = body.email, topic = body.topic, website = body.website, elapsedMs = body.elapsedMs;

  // Honeypot filled or implausibly fast → pretend success, store nothing.
  if (website || typeof elapsedMs !== 'number' || elapsedMs < 3000) {
    return quizJson(request, 200, { ok: true });
  }

  if (typeof message !== 'string') return quizJson(request, 400, { error: 'bad message' });
  const trimmed = message.trim();
  if (trimmed.length < 10 || trimmed.length > 4000) return quizJson(request, 400, { error: 'message length' });

  let replyEmail = null;
  if (email != null && email !== '') {
    if (typeof email !== 'string' || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return quizJson(request, 400, { error: 'bad email' });
    }
    replyEmail = email.trim();
  }

  const entry = {
    message: trimmed,
    email: replyEmail,
    topic: topic === 'feature' ? 'feature' : 'feedback',
    country: (request.cf && request.cf.country) || request.headers.get('CF-IPCountry') || 'XX',
    ts: new Date().toISOString(),
  };

  const key = 'feedback:' + entry.ts + '-' + Math.random().toString(36).slice(2, 8);
  try {
    await env.QUIZ_KV.put(key, JSON.stringify(entry), { expirationTtl: 90 * 24 * 3600 });
  } catch (e) {
    return quizJson(request, 503, { error: 'busy — try again in a moment' });
  }

  try { await fbSendEmailCopy(env, entry); } catch (e) { /* KV copy is the durable record */ }

  return quizJson(request, 200, { ok: true });
}

// ---- Path redirects ----------------------------------------------------
// Cloudflare Pages Advanced Mode ignores public/_redirects exactly as it
// ignores functions/, so every rule that used to live there 404'd in
// production (found Oct 2026). This table is the only place a redirect
// takes effect. Matching ignores a trailing slash; targets carry one.
const EXACT_REDIRECTS = {
  // Merged into the tool (Oct 2026): 82% of the article's GSC queries also
  // showed the tool, and the tool page's content was a superset.
  '/articles/sleep-hours-calculator': '/tools/sleep/',
  // Legacy URLs carried over from the old _redirects file.
  '/timezone-converter': '/tools/timezone/',
  '/time-calculator': '/',
  '/calculator': '/',
};
const PREFIX_REDIRECTS = [
  ['/article/', '/articles/'],
  ['/tool/', '/tools/'],
  ['/blog/', '/articles/'],
];
function resolveRedirect(pathname) {
  const p = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (Object.prototype.hasOwnProperty.call(EXACT_REDIRECTS, p)) return EXACT_REDIRECTS[p];
  const withSlash = p + '/';
  for (const [from, to] of PREFIX_REDIRECTS) {
    if (withSlash.startsWith(from)) return to + withSlash.slice(from.length);
  }
  return null;
}
// Follow chains (e.g. /blog/sleep-hours-calculator -> article -> tool) so
// a visitor or crawler gets a single hop.
function redirectTarget(pathname) {
  let target = resolveRedirect(pathname);
  for (let hops = 0; target && hops < 3; hops++) {
    const next = resolveRedirect(target);
    if (!next || next === target) break;
    target = next;
  }
  return target;
}
