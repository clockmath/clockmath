// ---- Live countdown answers + cache policy (injected into _worker.js) ----
// Plain worker code, read and concatenated into the generated worker by
// scripts/build-worker.js; scripts/worker/live-counts.test.js loads it in Node.

// Countdown pages are static HTML built once per deploy, but their answer
// sentence ("There are 42 days until Thanksgiving") is what crawlers index and
// what Copilot quotes (7K+ citations for Thanksgiving alone, Oct 2026). Built
// in, it is only right on deploy day. EventCountdown marks the sentence with
// data-days-until (see the spec format there); this recomputes it per request
// in the visitor's timezone (request.cf.timezone).

const DAY_MS = 86400000;

// Calendar date "YYYY-MM-DD" of instant `ms` in `timeZone` (UTC if unknown).
function ymdInZone(ms, timeZone) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ms);
  } catch (e) {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ms);
  }
  const get = (type) => parts.find((p) => p.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

const ymdToUtc = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));

// Days until the event described by `spec`, or null once it has arrived —
// matching EventCountdown's client-side maths: whole calendar days in the
// visitor's zone. Fixed instants too (Oct 2026 review: they rounded the time
// left up, so "2 days" here beside the page's "1 day" for tomorrow evening);
// one later today is 0, which the page words as "later today".
function liveDays(spec, nowMs, timeZone) {
  if (!spec) return null;
  const today = ymdInZone(nowMs, timeZone);
  if (spec.startsWith('t:')) {
    const target = Number(spec.slice(2));
    if (!(target > nowMs)) return null;
    return Math.round((ymdToUtc(ymdInZone(target, timeZone)) - ymdToUtc(today)) / DAY_MS);
  }
  if (spec.startsWith('d:')) {
    // Entries are "YYYY-MM-DD" or "start/end" (inclusive, e.g. Hanukkah).
    for (const entry of spec.slice(2).split(',')) {
      const [start, end = start] = entry.split('/');
      if (start > today) return Math.round((ymdToUtc(start) - ymdToUtc(today)) / DAY_MS);
      if (end >= today) return null; // during the event: the page reads "arrived"
    }
    return null;
  }
  if (spec.startsWith('w:')) {
    const [weekday, span] = spec.slice(2).split(':').map(Number);
    const todayWeekday = new Date(ymdToUtc(today)).getUTCDay();
    if ((todayWeekday - weekday + 7) % 7 < span) return null; // inside the event window
    return (weekday - todayWeekday + 7) % 7 || 7;
  }
  return null;
}

// Start date (YYYY-MM-DD) of the current-or-next entry in a "d:" spec — the
// date a holidays-list row should show today. Null for other spec kinds.
function liveNextDate(spec, nowMs, timeZone) {
  if (!spec || !spec.startsWith('d:')) return null;
  const today = ymdInZone(nowMs, timeZone);
  for (const entry of spec.slice(2).split(',')) {
    const [start, end = start] = entry.split('/');
    if (end >= today) return start;
  }
  return null;
}

const ymdLabel = (s) =>
  new Date(ymdToUtc(s)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

// Mirror of weeksPhrase in components/EventCountdown.tsx.
function weeksPhrase(days) {
  if (days < 7 || days > 365) return '';
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  const w = weeks === 1 ? '1 week' : weeks + ' weeks';
  return rest ? " That's " + w + ' and ' + (rest === 1 ? '1 day' : rest + ' days') + '.' : " That's " + w + '.';
}

function liveDateLabel(ms, timeZone) {
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  try {
    return new Date(ms).toLocaleDateString('en-US', Object.assign({ timeZone }, opts));
  } catch (e) {
    return new Date(ms).toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, opts));
  }
}

// ---- Today's date (/tools/todays-date/, Nov 2026) ----
// The page's answer ("Today is Thursday, November 12, 2026. It is day 316
// of the year…") is what Copilot quotes for "what day is it" and "today's
// date". Built in, it is right only on deploy day, so each piece carries
// data-live-today="<kind>" and is rewritten here in the visitor's zone.
// Mirror of lib/todaysDate.ts; tests/todaysDate.test.ts checks the two agree.
const JDN_EPOCH = 2440588;
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dayNum = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
const weekdayOf = (n) => (((n + 4) % 7) + 7) % 7; // day number → 0 Sun … 6 Sat
const pad2 = (n) => String(n).padStart(2, '0');

function liveToday(kind, nowMs, timeZone) {
  const ymd = ymdInZone(nowMs, timeZone);
  const y = +ymd.slice(0, 4);
  const m = +ymd.slice(5, 7);
  const d = +ymd.slice(8, 10);
  const n = dayNum(y, m, d);
  const doy = n - dayNum(y, 1, 1) + 1;
  const yearDays = isLeap(y) ? 366 : 365;
  switch (kind) {
    case 'long':
      return new Date(ymdToUtc(ymd)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'weekday':
      return new Date(ymdToUtc(ymd)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' });
    case 'iso':
      return ymd;
    case 'us':
      return pad2(m) + '/' + pad2(d) + '/' + y;
    case 'eu':
      return pad2(d) + '/' + pad2(m) + '/' + y;
    case 'year':
      return String(y);
    case 'doy':
      return String(doy);
    case 'days-in-year':
      return String(yearDays);
    case 'left':
      return String(yearDays - doy);
    case 'week': {
      // ISO 8601: the Thursday of this Monday-to-Sunday week decides
      const thursday = n - (weekdayOf(n) || 7) + 4;
      const wy = new Date(thursday * DAY_MS).getUTCFullYear();
      return String(Math.floor((thursday - dayNum(wy, 1, 1)) / 7) + 1);
    }
    case 'week-us':
      return String(Math.floor((doy - 1 + weekdayOf(dayNum(y, 1, 1))) / 7) + 1);
    case 'quarter':
      return 'Q' + (Math.floor((m - 1) / 3) + 1);
    case 'jdn':
      return String(n + JDN_EPOCH);
    case 'ordinal':
      return y + '-' + String(doy).padStart(3, '0');
    case 'yyddd':
      return pad2(y % 100) + String(doy).padStart(3, '0');
    case 'zone':
      // The zone the date was read in; UTC when Cloudflare's isn't valid (as ymdInZone does)
      try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return timeZone;
      } catch (e) {
        return 'UTC';
      }
    default:
      return null;
  }
}

function withLiveCounts(res, request) {
  const type = res.headers.get('Content-Type') || '';
  if (!type.includes('text/html') || typeof HTMLRewriter === 'undefined') return res;
  const timeZone = (request.cf && request.cf.timezone) || 'UTC';
  const now = Date.now();
  let days = null;
  let nextDate = null;
  let keep = false;
  return new HTMLRewriter()
    .on('[data-days-until]', {
      element(el) {
        const spec = el.getAttribute('data-days-until');
        days = liveDays(spec, now, timeZone);
        nextDate = liveNextDate(spec, now, timeZone);
        // data-keep (table rows): on the day itself show "Today" rather than
        // removing the element, which would break the table.
        keep = el.hasAttribute('data-keep');
        if (days === null && !keep) el.remove();
      },
    })
    .on('[data-live="next-date"]', {
      element(el) {
        if (nextDate) el.setInnerContent(ymdLabel(nextDate));
      },
    })
    .on('[data-live="verb"]', {
      element(el) {
        if (days !== null) el.setInnerContent(days === 1 ? 'is' : 'are');
      },
    })
    .on('[data-live="days"]', {
      element(el) {
        if (days !== null) el.setInnerContent(days === 1 ? '1 day' : days.toLocaleString('en-US') + ' days');
        else if (keep && nextDate) el.setInnerContent('Today');
      },
    })
    .on('[data-live="weeks"]', {
      element(el) {
        if (days !== null) el.setInnerContent(weeksPhrase(days));
      },
    })
    // Cloudflare's Email Address Obfuscation (zone setting, on by default)
    // rewrote every mailto link to /cdn-cgi/l/email-protection, which 404s
    // for crawlers — Bing Site Scan's only error (Oct 2026). Its documented
    // opt-out is <!--email_off-->…<!--/email_off--> around the address; all
    // of the site's addresses are inside mailto links, so wrap those. (Not
    // Cache-Control: no-transform — that would also stop Cloudflare
    // injecting the Web Analytics beacon.)
    .on('a[href^="mailto:"]', {
      element(el) {
        el.before('<!--email_off-->', { html: true });
        el.after('<!--/email_off-->', { html: true });
      },
    })
    .on('[data-live-today]', {
      element(el) {
        const text = liveToday(el.getAttribute('data-live-today'), now, timeZone);
        if (text !== null) el.setInnerContent(text);
      },
    })
    .on('[data-live-date]', {
      element(el) {
        const ms = Number(el.getAttribute('data-live-date'));
        if (ms) el.setInnerContent(liveDateLabel(ms, timeZone));
      },
    })
    .transform(res);
}

// Cache-Control for every non-API response. public/_headers used to set
// this, and although Advanced Mode ignores most of that file, its cache
// rules were served on EVERY path — HTML included got
// "public, max-age=31536000, immutable" (found Oct 2026), so browsers kept
// pages for a year without asking. Pages must revalidate (deploys and the
// live counts above change them); only content-hashed build files are
// immutable.
function cacheControlFor(pathname, res) {
  if (pathname.startsWith('/api/') || res.status >= 300) return null;
  if (pathname.startsWith('/_next/static/')) return 'public, max-age=31536000, immutable';
  const type = res.headers.get('Content-Type') || '';
  if (/text\/(html|x-component|plain|xml)|application\/xml/.test(type) || /\.(txt|xml)$/.test(pathname)) {
    return 'public, max-age=0, must-revalidate';
  }
  return 'public, max-age=86400'; // icons, OG images, fonts in public/
}
