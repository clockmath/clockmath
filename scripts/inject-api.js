// Post-build script to inject the API handlers into the next-on-pages worker.
//
// Why this exists: @cloudflare/next-on-pages emits a `_worker.js` (Pages
// "Advanced Mode"), which causes Cloudflare to IGNORE the `functions/`
// directory. So the /api/places and /api/geo handlers can't live only in
// functions/ — they must be injected into the generated worker here. Keep this
// file in sync with functions/api/places.js and functions/api/geo.js.
const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '../.vercel/output/static/_worker.js/index.js');

const apiHandlersCode = `
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
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com; font-src 'self' data:; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests",
};

function withSecurityHeaders(res) {
  try {
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  } catch (e) {
    return res;
  }
}

// ---- Injected API handlers (mirror of functions/api/*.js) ----
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

    return new Response(
      JSON.stringify({ results }),
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

// ---- Daily quiz leaderboard (mirror of functions/api/quiz.js) ----
// Keep in sync with that file: it holds the documented design notes and the
// unit-tested reference implementation.
const QUIZ_BLOCKED_INITIALS = new Set([
  'ASS', 'SEX', 'FUK', 'FUC', 'FCK', 'FKU', 'CUM', 'TIT', 'DIK', 'DIC',
  'DCK', 'COK', 'KOK', 'FAG', 'FGT', 'NIG', 'NGR', 'KKK', 'NAZ', 'VAG',
  'HOE', 'WTF', 'XXX', 'KYS', 'DIE', 'PIS', 'CNT', 'TWA', 'JIZ', 'PNS',
]);
const QUIZ_MAX_STORED_SCORES = 5000;
const QUIZ_MAX_TOP = 25;
const QUIZ_COOKIE = 'cmq_day';
const quizIpHits = new Map();
const quizChampionCache = new Map();

function quizRateLimited(ip) {
  const now = Date.now();
  const bucket = quizIpHits.get(ip);
  if (!bucket || now > bucket.reset) {
    quizIpHits.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 60;
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
  return new Response(JSON.stringify(body), { status, headers: Object.assign(headers, extraHeaders || {}) });
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

    // ?week=1 → champions of the last 7 completed days (mirror of
    // functions/api/quiz.js; finished boards are immutable → cacheable).
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
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) return quizJson(request, 400, { error: 'bad day' });
    const board = await quizLoadBoard(env, day);

    // Optional live percentile (mirror of functions/api/quiz.js): caller's
    // own s/t compared against everyone who has played so far, excluding one
    // matching entry as self.
    let livePercentile = null;
    const qs = url.searchParams.get('s');
    const qt = url.searchParams.get('t');
    if (qs !== null && qt !== null) {
      const score = Number(qs);
      const timeMs = Number(qt);
      const valid = Number.isInteger(score) && score >= 0 && score <= 5 &&
        Number.isInteger(timeMs) && timeMs > 0 && timeMs <= 3600000;
      if (valid && board.scores.length > 0) {
        let beaten = 0;
        let self = 0;
        for (const pair of board.scores) {
          if (score > pair[0] || (score === pair[0] && timeMs < pair[1])) beaten += 1;
          else if (score === pair[0] && timeMs === pair[1]) self += 1;
        }
        const others = board.scores.length - (self > 0 ? 1 : 0);
        livePercentile = others > 0 ? Math.round((beaten / others) * 100) : 100;
      }
    }

    return quizJson(request, 200, Object.assign(
      { day, count: board.count, top: board.top.slice(0, 10) },
      livePercentile !== null ? { percentile: livePercentile } : {},
    ));
  }

  if (request.method !== 'POST') return quizJson(request, 405, { error: 'method not allowed' });

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (quizRateLimited(ip)) return quizJson(request, 429, { error: 'slow down' });

  let body;
  try {
    // A legitimate submission is <200 bytes; cap well above that so junk
    // payloads are rejected before JSON parsing. (Mirror of functions/api/quiz.js.)
    const raw = await request.text();
    if (raw.length > 1024) return quizJson(request, 400, { error: 'body too large' });
    body = JSON.parse(raw);
  } catch (e) {
    return quizJson(request, 400, { error: 'bad json' });
  }

  const today = quizUtcToday();
  const day = body && body.day;
  const score = body && body.score;
  const timeMs = body && body.timeMs;
  let initials = body && body.initials;

  if (day !== today) return quizJson(request, 400, { error: "not today's puzzle" });
  if (!Number.isInteger(score) || score < 0 || score > 5) return quizJson(request, 400, { error: 'bad score' });
  if (!Number.isInteger(timeMs) || timeMs < 2000 * 5 || timeMs > 60 * 60 * 1000) return quizJson(request, 400, { error: 'implausible time' });
  if (initials != null) {
    if (typeof initials !== 'string' || !/^[A-Z]{3}$/.test(initials) || QUIZ_BLOCKED_INITIALS.has(initials)) {
      return quizJson(request, 400, { error: 'bad initials' });
    }
  } else {
    initials = null;
  }

  const cookies = request.headers.get('Cookie') || '';
  const cookieMatch = cookies.match(new RegExp(QUIZ_COOKIE + '=([\\\\d-]+)'));
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

  await env.QUIZ_KV.put('board:' + day, JSON.stringify(board), { expirationTtl: 60 * 60 * 24 * 14 });

  return quizJson(
    request,
    200,
    { accepted: true, count: board.count, percentile, rank, top: board.top.slice(0, 10) },
    { 'Set-Cookie': QUIZ_COOKIE + '=' + today + '; Path=/api/quiz; Max-Age=172800; HttpOnly; Secure; SameSite=Lax' },
  );
}

// ---- Feedback form (mirror of functions/api/feedback.js) ----
// Keep in sync with that file: it holds the documented design notes.
const fbIpHits = new Map();
function fbRateLimited(ip) {
  const now = Date.now();
  const bucket = fbIpHits.get(ip);
  if (!bucket || now > bucket.reset) {
    fbIpHits.set(ip, { count: 1, reset: now + 3600000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 5;
}

async function fbSendEmailCopy(env, entry) {
  if (!env.EMAIL_SEND_TOKEN || !env.CF_ACCOUNT_ID) return;
  const label = entry.topic === 'feature' ? 'Feature request' : 'Feedback';
  const payload = {
    to: 'hello@clockmath.com',
    from: { address: 'feedback@clockmath.com', name: 'ClockMath Feedback' },
    subject: 'ClockMath ' + label.toLowerCase() + ': ' + entry.message.slice(0, 60).replace(/\\s+/g, ' '),
    text: [label + ' from clockmath.com', '', entry.message, '', '—',
      'Reply-to: ' + (entry.email || 'not provided'),
      'Country: ' + entry.country + '  ·  ' + entry.ts].join('\\n'),
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
    if (typeof email !== 'string' || email.length > 200 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
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
  await env.QUIZ_KV.put(key, JSON.stringify(entry), { expirationTtl: 90 * 24 * 3600 });

  try { await fbSendEmailCopy(env, entry); } catch (e) { /* KV copy is the durable record */ }

  return quizJson(request, 200, { ok: true });
}
`;

// Read the existing worker
let workerContent = fs.readFileSync(workerPath, 'utf8');

// Find the fetch handler pattern dynamically (variable name changes between builds)
const fetchPattern = /var ([a-zA-Z_][a-zA-Z0-9_]*)=\{async fetch\(([a-zA-Z]),([a-zA-Z]),([a-zA-Z])\)\{/;
const match = workerContent.match(fetchPattern);

if (match) {
  const [originalExport, varName, reqParam, envParam, ctxParam] = match;
  const wrappedExport = `${apiHandlersCode}
var ${varName}={async fetch(${reqParam},${envParam},${ctxParam}){
  // Route injected API requests before falling through to Next.js assets
  const reqUrl = new URL(${reqParam}.url);
  // Canonical-host redirect: www serves this same Pages project, so 301 it
  // to the apex before anything else (crawl-budget fix, Aug 2026 GSC audit).
  if (reqUrl.hostname === 'www.clockmath.com') {
    return Response.redirect('https://clockmath.com' + reqUrl.pathname + reqUrl.search, 301);
  }
  if (reqUrl.pathname === '/api/places' || reqUrl.pathname === '/api/places/') {
    return handlePlacesApi(${reqParam}, ${envParam});
  }
  if (reqUrl.pathname === '/api/geo' || reqUrl.pathname === '/api/geo/') {
    return handleGeoApi(${reqParam});
  }
  if (reqUrl.pathname === '/api/quiz' || reqUrl.pathname === '/api/quiz/') {
    return handleQuizApi(${reqParam}, ${envParam});
  }
  if (reqUrl.pathname === '/api/feedback' || reqUrl.pathname === '/api/feedback/') {
    return handleFeedbackApi(${reqParam}, ${envParam});
  }
`;
  workerContent = workerContent.replace(originalExport, wrappedExport);

  // Wrap the default export so security headers are applied to every response
  // (API responses above and all Next.js pages/assets below).
  const exportPattern = new RegExp(`export\\{${varName} as default\\}`);
  if (!exportPattern.test(workerContent)) {
    console.error(`[inject-api] Could not find "export{${varName} as default}" — security headers NOT applied.`);
    process.exit(1);
  }
  workerContent = workerContent.replace(
    exportPattern,
    `var __securedDefault={async fetch(req,env,ctx){return withSecurityHeaders(await ${varName}.fetch(req,env,ctx));}};export{__securedDefault as default}`
  );

  fs.writeFileSync(workerPath, workerContent);
  console.log('[inject-api] Injected /api/places + /api/geo handlers and security headers into worker.');
} else {
  console.error('[inject-api] Could not find fetch handler pattern in worker — API routes NOT injected.');
  process.exit(1);
}
