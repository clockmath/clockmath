// node scripts/worker/stale-assets.test.js — runs the stale-page guard
// against fake script failures: it reloads once, never loops, and ignores
// failures that aren't the site's own scripts.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'stale-assets.js'), 'utf8');
const { STALE_GUARD_JS } = new Function(`${code}; return { STALE_GUARD_JS };`)();

function page() {
  let now = 1_000_000;
  const store = {};
  const listeners = {};
  const p = {
    reloads: 0,
    advance: (ms) => { now += ms; },
    fire: (type, ev) => (listeners[type] || []).forEach((fn) => fn(ev)),
    ctx: {
      Date: { now: () => now },
      String,
      sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
      location: { reload: () => { p.reloads++; } },
      addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    },
  };
  vm.runInNewContext(STALE_GUARD_JS, p.ctx);
  return p;
}

const scriptError = (src) => ({ target: { tagName: 'SCRIPT', src } });
const OLD = 'https://clockmath.com/_next/static/chunks/app/page-76c67f6533744f5a.js';

// A missing site script reloads once; a second failure within 30 s doesn't.
let p = page();
p.fire('error', scriptError(OLD));
assert.strictEqual(p.reloads, 1);
p.advance(5_000);
p.fire('error', scriptError(OLD));
assert.strictEqual(p.reloads, 1);
p.advance(30_000);
p.fire('error', scriptError(OLD));
assert.strictEqual(p.reloads, 2);

// Third-party scripts and images never trigger it.
p = page();
p.fire('error', scriptError('https://www.googletagmanager.com/gtag/js?id=G-5L3QN6938D'));
p.fire('error', { target: { tagName: 'IMG', src: 'https://c.clarity.ms/c.gif' } });
p.fire('error', { target: undefined, message: 'Uncaught TypeError' });
assert.strictEqual(p.reloads, 0);

// A lazily loaded chunk failing later (webpack's ChunkLoadError) reloads too.
p = page();
p.fire('unhandledrejection', { reason: { name: 'ChunkLoadError', message: 'Loading chunk 812 failed.' } });
assert.strictEqual(p.reloads, 1);
p = page();
p.fire('unhandledrejection', { reason: new Error('network down') });
assert.strictEqual(p.reloads, 0);

// Blocked storage (some private modes throw): never reload.
p = page();
p.ctx.sessionStorage.getItem = () => { throw new Error('denied'); };
p.fire('error', scriptError(OLD));
assert.strictEqual(p.reloads, 0);

console.log('stale-assets: all checks passed');
