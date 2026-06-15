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
  if (reqUrl.pathname === '/api/places' || reqUrl.pathname === '/api/places/') {
    return handlePlacesApi(${reqParam}, ${envParam});
  }
  if (reqUrl.pathname === '/api/geo' || reqUrl.pathname === '/api/geo/') {
    return handleGeoApi(${reqParam});
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
