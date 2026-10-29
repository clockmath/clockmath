// node scripts/build-worker.js — after `next build`, turns the static export
// in out/ into a Cloudflare Pages site with ClockMath's own worker.
//
// Until Oct 2026 the site went through @cloudflare/next-on-pages (now
// deprecated) and this file regex-patched the minified worker it generated.
// The site is a static export, so there is no Next runtime to keep: this
// writes a small _worker.js (Pages "Advanced Mode") that runs the redirects
// and APIs, serves everything else from the export through env.ASSETS, and
// passes every response through the header, live-count and nonce wrappers.
// Advanced Mode makes Cloudflare IGNORE functions/ and public/_redirects, so
// those all live in plain files in scripts/worker/ (each with a Node test):
//   api.js          security headers, CSP nonce, /api/* handlers, redirects
//   live-counts.js  live countdown numbers, cache policy
//   stale-assets.js reload guard for pages left over from an earlier deploy
// plus lib/quiz.ts compiled with esbuild (the quiz API re-scores with it).
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../out');
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('[build-worker] out/index.html is missing: run `next build` first (and stop the dev server, which writes to out/ too).');
  process.exit(1);
}

const read = (f) => fs.readFileSync(path.join(__dirname, 'worker', f), 'utf8');
// The daily quiz generator, compiled from the same lib/quiz.ts the page uses,
// so the server can re-score a submission from the chosen answers instead
// of trusting a posted score (Oct 2026 audit: anyone could post 5/5).
const quizLibCode = require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '../lib/quiz.ts')],
  bundle: true,
  format: 'iife',
  globalName: '__cmQuiz',
  target: 'es2020',
  write: false,
  logLevel: 'silent',
}).outputFiles[0].text;

const worker = `// Built by scripts/build-worker.js — edit scripts/worker/*.js, not this file.
${quizLibCode}
${read('api.js')}
${read('live-counts.js')}
${read('stale-assets.js')}

async function route(request, env) {
  const url = new URL(request.url);
  // Canonical-host redirect: www serves this same Pages project, so 301 it
  // to the apex before anything else (crawl-budget fix, Aug 2026 GSC audit).
  if (url.hostname === 'www.clockmath.com') {
    const target = redirectTarget(url.pathname) || url.pathname;
    return Response.redirect('https://clockmath.com' + target + url.search, 301);
  }
  const redirectTo = redirectTarget(url.pathname);
  if (redirectTo) return Response.redirect('https://clockmath.com' + redirectTo + url.search, 301);
  switch (url.pathname.replace(/\\/$/, '')) {
    case '/api/places': return handlePlacesApi(request, env);
    case '/api/geo': return handleGeoApi(request);
    case '/api/quiz': return handleQuizApi(request, env);
    case '/api/feedback': return handleFeedbackApi(request, env);
  }
  // The static export: pages, 404.html for anything missing, trailing-slash
  // redirects, as Pages serves it without a worker.
  return env.ASSETS.fetch(request);
}

// Every response (APIs and pages alike) gets the security headers and cache
// policy; HTML also gets today's countdown numbers and the reload-once guard
// for pages left over from an earlier deploy, then every script on it gets
// the response's CSP nonce (withNonce, after the guard so the guard gets it).
export default {
  async fetch(request, env) {
    const res = await route(request, env);
    const nonce = cspNonce();
    return withSecurityHeaders(withNonce(withStaleGuard(withLiveCounts(res, request)), nonce), new URL(request.url).pathname, nonce);
  },
};
`;

fs.writeFileSync(path.join(OUT, '_worker.js'), worker);
// Content-hashed build files skip the worker, as they did under next-on-pages,
// and are cached for good (a new deploy asks for new names).
fs.writeFileSync(
  path.join(OUT, '_routes.json'),
  JSON.stringify({ version: 1, include: ['/*'], exclude: ['/_next/static/*'] }) + '\n',
);
fs.writeFileSync(path.join(OUT, '_headers'), '/_next/static/*\n  cache-control: public,max-age=31536000,immutable\n');
console.log('[build-worker] Wrote out/_worker.js (redirects, APIs, live counts, stale-page guard, CSP nonce, security headers, cache policy), _routes.json and _headers.');
