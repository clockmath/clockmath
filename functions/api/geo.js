// Cloudflare Pages Function returning the visitor's country code.
// Used by the consent banner to decide whether to prompt EEA/UK visitors.
// Cloudflare populates request.cf.country / the CF-IPCountry header at the edge.

// Restrict cross-origin reads to the production site. Same-origin requests
// (the consent banner calling its own /api/geo) are unaffected by CORS.
const ALLOWED_ORIGINS = new Set([
  "https://clockmath.com",
  "https://www.clockmath.com",
]);

export async function onRequestGet(context) {
  const { request } = context;

  const country =
    (request.cf && request.cf.country) ||
    request.headers.get("CF-IPCountry") ||
    "XX";

  const headers = {
    "Content-Type": "application/json",
    // Country can vary per visitor; never cache shared.
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return new Response(JSON.stringify({ country }), { headers });
}
