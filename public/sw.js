// ClockMath service worker (Oct 2026). It is what lets Chrome and Edge offer
// to install the site as an app, and lets pages you've opened load offline.
//
// - Pages: network first, so an online visit always gets the latest deploy;
//   the last copy is used only when the network fails.
// - /_next/static/*: cache first. Their file names carry a content hash, so
//   a cached file never goes stale; a new deploy simply asks for new names.
// - Everything else (the API, embeds, analytics, other sites): untouched.
//
// To switch it off, replace this file with one that calls
// self.registration.unregister() and deletes the caches, then deploy.
const VERSION = 'v1';
const PAGES = `clockmath-pages-${VERSION}`;
const STATIC = `clockmath-static-${VERSION}`;
const STATIC_LIMIT = 200;
// Oct 2026 review: pages had no cap. Keyed by path and only kept when the
// page loads, so it's about the size of the site, but a cap costs nothing.
const PAGES_LIMIT = 120;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(PAGES).then((cache) => cache.add('/')).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('clockmath-') && key !== PAGES && key !== STATIC) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

// A page not opened on this device yet, with no connection: say so, and
// point to the calculator, which is always kept (not that page's address
// with another page inside it)
function offlinePage() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline | ClockMath</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#fff;color:#000;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
main{max-width:30rem}h1{font-size:28px;margin:0 0 10px}p{font-size:17px;line-height:1.5;color:#3a3f46;margin:0 0 20px}
a{display:inline-block;background:#1849a9;color:#fff;padding:12px 20px;border-radius:6px;font-weight:600;text-decoration:none}
@media (prefers-color-scheme:dark){body{background:#0f1216;color:#f5f6f8}p{color:#c4c9d0}}</style></head>
<body><main><h1>You're offline</h1><p>This page hasn't been opened on this device yet, so there's no copy of it to show. Pages you've used before still open without a connection.</p>
<a href="/">Open the time duration calculator</a></main></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Oldest first: drop the earliest entries once the cache passes its limit.
// keys() is in insertion order, so a hit is put back (below) to count as
// recent: otherwise the framework chunks every page needs, stored on the
// first visit, were the first to go once a few deploys passed 200 files,
// and offline pages lost their scripts (Oct 2026 review).
async function trim(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/embed/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          // Kept by path, without the query: a timesheet share link's data
          // lives only in the address, never in the stored page
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches
              .open(PAGES)
              .then(async (cache) => {
                await cache.delete(url.pathname);
                await cache.put(url.pathname, copy);
                await trim(cache, PAGES_LIMIT);
              })
              .catch(() => {});
          }
          return response;
        } catch {
          const cache = await caches.open(PAGES);
          return (await cache.match(url.pathname)) || offlinePage();
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC);
        const hit = await cache.match(request);
        if (hit) {
          const again = hit.clone();
          cache.delete(request).then(() => cache.put(request, again)).catch(() => {});
          return hit;
        }
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone()).then(() => trim(cache, STATIC_LIMIT)).catch(() => {});
        }
        return response;
      })(),
    );
  }
});
