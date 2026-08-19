// Cloudflare Pages Function — daily quiz leaderboard (KV-backed).
//
// GET  /api/quiz?day=YYYY-MM-DD  → { day, count, top: [{i, s, t}] }
// POST /api/quiz {day, score, timeMs, initials?} →
//        { accepted, count, percentile, rank?, top }
//
// Design notes (no-signup site, so enforcement is best-effort by design):
// - Only TODAY (UTC) accepts submissions; the date is the puzzle id.
// - Once-per-day: HttpOnly cookie + client-side localStorage. A determined
//   cheater can clear both; the plausibility gates below bound the damage.
// - Plausibility: score 0–5, ≥2s per question, ≤1h total.
// - Initials are optional (percentile works without them) and moderated by
//   the same 3-letter blocklist as lib/quiz.ts — KEEP THE LISTS IN SYNC.
// - KV read-modify-write is not transactional; two simultaneous submits can
//   drop one score. Acceptable at this traffic level.

const ALLOWED_ORIGINS = new Set([
  "https://clockmath.com",
  "https://www.clockmath.com",
]);

// Mirror of BLOCKED_INITIALS in lib/quiz.ts.
const BLOCKED_INITIALS = new Set([
  "ASS", "SEX", "FUK", "FUC", "FCK", "FKU", "CUM", "TIT", "DIK", "DIC",
  "DCK", "COK", "KOK", "FAG", "FGT", "NIG", "NGR", "KKK", "NAZ", "VAG",
  "HOE", "WTF", "XXX", "KYS", "DIE", "PIS", "CNT", "TWA", "JIZ", "PNS",
]);

const MAX_STORED_SCORES = 5000; // percentile sample cap
const MAX_TOP = 25; // stored; GET returns 10
const COOKIE_NAME = "cmq_day";

// Loose per-IP limiter (per-isolate memory — resets on eviction, which is
// fine: it only exists to blunt dumb spam loops, not determined abuse).
// Generous so a classroom behind one NAT isn't locked out.
const ipHits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const bucket = ipHits.get(ip);
  if (!bucket || now > bucket.reset) {
    ipHits.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 60;
}

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

function corsHeaders(request) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function json(request, status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), ...extraHeaders },
  });
}

async function loadBoard(env, day) {
  const raw = await env.QUIZ_KV.get(`board:${day}`);
  if (!raw) return { count: 0, scores: [], top: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      count: parsed.count || 0,
      scores: Array.isArray(parsed.scores) ? parsed.scores : [],
      top: Array.isArray(parsed.top) ? parsed.top : [],
    };
  } catch {
    return { count: 0, scores: [], top: [] };
  }
}

// Higher score wins; ties broken by faster time.
function beats(a, b) {
  if (a.s !== b.s) return a.s > b.s;
  return a.t < b.t;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.QUIZ_KV) return json(request, 503, { error: "leaderboard unavailable" });

  const url = new URL(request.url);
  const day = url.searchParams.get("day") || utcToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return json(request, 400, { error: "bad day" });
  }

  const board = await loadBoard(env, day);
  return json(request, 200, {
    day,
    count: board.count,
    top: board.top.slice(0, 10),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.QUIZ_KV) return json(request, 503, { error: "leaderboard unavailable" });

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (rateLimited(ip)) return json(request, 429, { error: "slow down" });

  let body;
  try {
    // A legitimate submission is <200 bytes; cap well above that so junk
    // payloads are rejected before JSON parsing.
    const raw = await request.text();
    if (raw.length > 1024) return json(request, 400, { error: "body too large" });
    body = JSON.parse(raw);
  } catch {
    return json(request, 400, { error: "bad json" });
  }

  const today = utcToday();
  const { day, score, timeMs } = body || {};
  let initials = body && body.initials;

  // The date is the puzzle id — only today's puzzle takes submissions.
  if (day !== today) return json(request, 400, { error: "not today's puzzle" });

  // Plausibility gates.
  if (!Number.isInteger(score) || score < 0 || score > 5) {
    return json(request, 400, { error: "bad score" });
  }
  if (!Number.isInteger(timeMs) || timeMs < 2000 * 5 || timeMs > 60 * 60 * 1000) {
    return json(request, 400, { error: "implausible time" });
  }

  if (initials != null) {
    if (typeof initials !== "string" || !/^[A-Z]{3}$/.test(initials) || BLOCKED_INITIALS.has(initials)) {
      return json(request, 400, { error: "bad initials" });
    }
  } else {
    initials = null;
  }

  // Once-per-day cookie (best-effort — see header note).
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([\\d-]+)`));
  if (match && match[1] === today) {
    return json(request, 409, { error: "already submitted today" });
  }

  const board = await loadBoard(env, day);
  const entry = { s: score, t: timeMs };

  // Percentile vs everyone already on the board (0 players → 100).
  const beaten = board.scores.filter((row) => beats(entry, { s: row[0], t: row[1] })).length;
  const percentile = board.scores.length === 0
    ? 100
    : Math.round((beaten / board.scores.length) * 100);

  board.count += 1;
  if (board.scores.length < MAX_STORED_SCORES) board.scores.push([score, timeMs]);

  let rank = null;
  if (initials) {
    board.top.push({ i: initials, s: score, t: timeMs });
    board.top.sort((a, b) => (beats(a, b) ? -1 : 1));
    board.top = board.top.slice(0, MAX_TOP);
    const idx = board.top.findIndex((e) => e.i === initials && e.s === score && e.t === timeMs);
    if (idx !== -1) rank = idx + 1;
  }

  // Boards are day-scoped; expire well after the day ends.
  await env.QUIZ_KV.put(`board:${day}`, JSON.stringify(board), {
    expirationTtl: 60 * 60 * 24 * 14,
  });

  return json(
    request,
    200,
    {
      accepted: true,
      count: board.count,
      percentile,
      rank,
      top: board.top.slice(0, 10),
    },
    {
      // Marks this browser as having submitted today.
      "Set-Cookie": `${COOKIE_NAME}=${today}; Path=/api/quiz; Max-Age=172800; HttpOnly; Secure; SameSite=Lax`,
    },
  );
}
