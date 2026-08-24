// Feedback / feature-request endpoint.
//
// Every valid submission is stored durably in KV (QUIZ_KV, `feedback:` prefix,
// 90-day TTL) so nothing is ever lost. When the two email env vars are
// configured on the Pages project, a copy is also emailed to the site owner
// via Cloudflare Email Sending's REST API (the `send_email` binding is
// Workers-only — Pages Functions don't support it, so REST it is):
//   EMAIL_SEND_TOKEN — API token with Email Sending permission
//   CF_ACCOUNT_ID    — Cloudflare account id
// Email failure never fails the request; the KV copy is the source of truth.
//
// NOTE: next-on-pages ignores this directory in production builds — the live
// copy of this handler is injected by scripts/inject-api.js. Keep both in sync.

const ALLOWED_ORIGINS = new Set([
  "https://clockmath.com",
  "https://www.clockmath.com",
]);

const MAX_BODY = 8192;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;
const MIN_FORM_MS = 3000; // forms filled in under 3s are bots
const RATE_LIMIT = 5; // per IP per hour (per isolate — loose by design)
const KV_TTL_SECONDS = 90 * 24 * 3600;

const rateBuckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const b = rateBuckets.get(ip);
  if (!b || now > b.reset) {
    rateBuckets.set(ip, { count: 1, reset: now + 3600_000 });
    return false;
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

function json(request, status, payload) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Origin" };
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(payload), { status, headers });
}

async function sendEmailCopy(env, entry) {
  if (!env.EMAIL_SEND_TOKEN || !env.CF_ACCOUNT_ID) return;
  const label = entry.topic === "feature" ? "Feature request" : "Feedback";
  const lines = [
    `${label} from clockmath.com`,
    "",
    entry.message,
    "",
    "—",
    `Reply-to: ${entry.email || "not provided"}`,
    `Country: ${entry.country}  ·  ${entry.ts}`,
  ];
  const payload = {
    to: "hello@clockmath.com",
    from: { address: "feedback@clockmath.com", name: "ClockMath Feedback" },
    subject: `ClockMath ${label.toLowerCase()}: ${entry.message.slice(0, 60).replace(/\s+/g, " ")}`,
    text: lines.join("\n"),
  };
  if (entry.email) payload.reply_to = entry.email;
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_SEND_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.QUIZ_KV) return json(request, 503, { error: "unavailable" });

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (rateLimited(ip)) return json(request, 429, { error: "slow down" });

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json(request, 400, { error: "too large" });
    body = JSON.parse(raw);
  } catch {
    return json(request, 400, { error: "bad json" });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(request, 400, { error: "bad body" });
  }

  const { message, email, topic, website, elapsedMs } = body;

  // Honeypot filled or form submitted implausibly fast → pretend success so
  // bots don't learn anything, store nothing.
  if (website || typeof elapsedMs !== "number" || elapsedMs < MIN_FORM_MS) {
    return json(request, 200, { ok: true });
  }

  if (typeof message !== "string") return json(request, 400, { error: "bad message" });
  const trimmed = message.trim();
  if (trimmed.length < MIN_MESSAGE || trimmed.length > MAX_MESSAGE) {
    return json(request, 400, { error: "message length" });
  }
  let replyEmail = null;
  if (email != null && email !== "") {
    if (typeof email !== "string" || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(request, 400, { error: "bad email" });
    }
    replyEmail = email.trim();
  }
  const kind = topic === "feature" ? "feature" : "feedback";

  const entry = {
    message: trimmed,
    email: replyEmail,
    topic: kind,
    country: (request.cf && request.cf.country) || request.headers.get("CF-IPCountry") || "XX",
    ts: new Date().toISOString(),
  };

  const key = `feedback:${entry.ts}-${Math.random().toString(36).slice(2, 8)}`;
  await env.QUIZ_KV.put(key, JSON.stringify(entry), { expirationTtl: KV_TTL_SECONDS });

  try {
    await sendEmailCopy(env, entry);
  } catch {
    // KV copy is the durable record; email is best-effort.
  }

  return json(request, 200, { ok: true });
}

export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return json(context.request, 405, { error: "method not allowed" });
}
