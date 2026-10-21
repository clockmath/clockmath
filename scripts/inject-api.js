// Post-build script that injects ClockMath's own code into the next-on-pages
// worker.
//
// Why this exists: @cloudflare/next-on-pages emits a `_worker.js` (Pages
// "Advanced Mode"), which causes Cloudflare to IGNORE the `functions/`
// directory and `public/_redirects`. So the API endpoints, redirects,
// security headers and cache policy are injected into the generated worker
// here, from plain files in scripts/worker/ (each with a Node test):
//   api.js          security headers, /api/* handlers, redirects
//   live-counts.js  live countdown numbers, cache policy
//   stale-assets.js reload guard for pages left over from an earlier deploy
// plus lib/quiz.ts compiled with esbuild (the quiz API re-scores with it).
const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '../.vercel/output/static/_worker.js/index.js');
const liveCountsCode = fs.readFileSync(path.join(__dirname, 'worker/live-counts.js'), 'utf8');
const staleAssetsCode = fs.readFileSync(path.join(__dirname, 'worker/stale-assets.js'), 'utf8');
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

const apiHandlersCode = fs.readFileSync(path.join(__dirname, 'worker/api.js'), 'utf8');

// Read the existing worker
let workerContent = fs.readFileSync(workerPath, 'utf8');

// Find the fetch handler pattern dynamically (variable name changes between builds)
const fetchPattern = /var ([a-zA-Z_][a-zA-Z0-9_]*)=\{async fetch\(([a-zA-Z]),([a-zA-Z]),([a-zA-Z])\)\{/;
const match = workerContent.match(fetchPattern);

if (match) {
  const [originalExport, varName, reqParam, envParam, ctxParam] = match;
  const wrappedExport = `${quizLibCode}
${apiHandlersCode}
${liveCountsCode}
${staleAssetsCode}
var ${varName}={async fetch(${reqParam},${envParam},${ctxParam}){
  // Route injected API requests before falling through to Next.js assets
  const reqUrl = new URL(${reqParam}.url);
  // Canonical-host redirect: www serves this same Pages project, so 301 it
  // to the apex before anything else (crawl-budget fix, Aug 2026 GSC audit).
  if (reqUrl.hostname === 'www.clockmath.com') {
    const target = redirectTarget(reqUrl.pathname) || reqUrl.pathname;
    return Response.redirect('https://clockmath.com' + target + reqUrl.search, 301);
  }
  const redirectTo = redirectTarget(reqUrl.pathname);
  if (redirectTo) {
    return Response.redirect('https://clockmath.com' + redirectTo + reqUrl.search, 301);
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
  // A function replacement: a string one would expand "$&", "$1"… sequences
  // inside the injected code.
  workerContent = workerContent.replace(originalExport, () => wrappedExport);

  // Wrap the default export so every response (API responses above and all
  // Next.js pages/assets below) gets the security headers and cache policy,
  // and HTML gets today's countdown numbers (scripts/worker/live-counts.js).
  // HTML also gets the reload-once guard for pages left over from an earlier
  // deploy (scripts/worker/stale-assets.js).
  const exportPattern = new RegExp(`export\\{${varName} as default\\}`);
  if (!exportPattern.test(workerContent)) {
    console.error(`[inject-api] Could not find "export{${varName} as default}" — security headers NOT applied.`);
    process.exit(1);
  }
  workerContent = workerContent.replace(
    exportPattern,
    `var __securedDefault={async fetch(req,env,ctx){const res=await ${varName}.fetch(req,env,ctx);return withSecurityHeaders(withStaleGuard(withLiveCounts(res,req)),new URL(req.url).pathname);}};export{__securedDefault as default}`
  );

  fs.writeFileSync(workerPath, workerContent);
  console.log('[inject-api] Injected API handlers, redirects, live countdown counts, stale-page guard, security headers and cache policy into worker.');
} else {
  console.error('[inject-api] Could not find fetch handler pattern in worker — API routes NOT injected.');
  process.exit(1);
}
