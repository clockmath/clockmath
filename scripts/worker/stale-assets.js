// ---- Stale pages after a deploy (injected into _worker.js) ----
// Plain worker code, concatenated into the generated worker by
// scripts/inject-api.js; scripts/worker/stale-assets.test.js loads it in Node.

// Every deploy replaces /_next/static: the hashed script files of the
// previous build 404 from then on. A page loaded before the deploy (an open
// tab, a restored phone tab, a back-button copy) still asks for the old
// files, so its calculators never start until the visitor refreshes — the
// "doesn't work until I refresh" report (Oct 2026, several deploys a day).
//
// The worker never sees those 404s: next-on-pages' _routes.json sends
// /_next/static/* straight to the asset store (and routing it through the
// worker would cost a request per file). So every HTML page instead gets this
// guard as the first thing in <head>, ahead of Next's own scripts: if a site
// script fails to load, it reloads the page once, which fetches the current
// HTML (always revalidated) and its current scripts. sessionStorage limits it
// to one automatic reload per 30 seconds, so it can never loop; where storage
// is blocked it does nothing.
const STALE_GUARD_JS =
  "(function(){var k='cm-stale-reload';function r(){try{var t=+sessionStorage.getItem(k)||0;" +
  "if(Date.now()-t<30000)return;sessionStorage.setItem(k,String(Date.now()));}catch(e){return}location.reload()}" +
  "addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='SCRIPT'&&/\\/_next\\/static\\//.test(t.src||''))r()},true);" +
  "addEventListener('unhandledrejection',function(e){var x=e.reason;if(x&&(x.name==='ChunkLoadError'||/Loading chunk|dynamically imported module/i.test(x.message||'')))r()})})();";

function withStaleGuard(res) {
  const type = res.headers.get('Content-Type') || '';
  if (res.status !== 200 || !type.includes('text/html') || typeof HTMLRewriter === 'undefined') return res;
  return new HTMLRewriter()
    .on('head', {
      element(el) {
        el.prepend('<script>' + STALE_GUARD_JS + '</script>', { html: true });
      },
    })
    .transform(res);
}
