#!/usr/bin/env node
// node scripts/brand/generate.mjs — renders every brand image from code:
//   app/icon.png, app/apple-icon.png, public/icon-192.png,
//   public/icon-512.png       the station-clock mark
//   public/og-v4.png          the default share card (homepage, site pages)
//   public/og-quiz-v3.png     the daily quiz share card
//   public/og/tool/*.png      one share card per tool, in its line colour,
//                             and the guides card for every article
//   public/og/countdown/*.png one share card per countdown, in its board colour
// Older card files (og-v3.png, og-quiz-v2.png) stay in public/ so links
// already shared with them keep their image; nothing references them now.
//
// Each image is an SVG/HTML template screenshotted at its exact size by
// headless Chrome (macOS path below), so nothing is resized or hand-edited.
// Countdown cards read lib/countdowns.ts, so they match the boards on the
// site. They carry no day count (an image can't stay current) and their
// subtitles are rules or fixed dates that stay true after the day passes.
// Re-run after adding a countdown or changing a board colour; commit the PNGs.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'clockmath-brand-'));
const FONT = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&display=block';

const INK = '#000000';
const SIGNAL = '#d51f26';

// ---- The mark: same geometry as StationChrome's header mark (28-unit box),
// drawn on a 64 box with heavier strokes so it survives 16px.
function markSvg({ size, plate = false }) {
  const dial = `
    <circle cx="32" cy="32" r="28.6" fill="#ffffff" stroke="${INK}" stroke-width="5.6"/>
    <line x1="32" y1="32" x2="32" y2="15.4" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <line x1="32" y1="32" x2="44.2" y2="32" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <line x1="32" y1="40" x2="32" y2="11.6" stroke="${SIGNAL}" stroke-width="2.8"/>
    <circle cx="32" cy="12.8" r="4.6" fill="${SIGNAL}"/>`;
  // App icons sit on an opaque white plate (iOS and Android crop the corners
  // themselves); the dial takes ~72% of it.
  const body = plate ? `<rect width="64" height="64" fill="#ffffff"/><g transform="translate(9 9) scale(0.71875)">${dial}</g>` : dial;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${body}</svg>`;
}

function shoot(name, html, width, height, { transparent = false } = {}) {
  const file = path.join(TMP, `${name.replace(/[^a-z0-9-]/gi, '_')}.html`);
  fs.writeFileSync(file, html);
  const out = path.join(ROOT, name);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const args = [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--virtual-time-budget=6000',
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
  ];
  if (transparent) args.push('--default-background-color=00000000');
  execFileSync(CHROME, [...args, pathToFileURL(file).href], { stdio: 'ignore' });
  console.log(`[brand] ${name} ${width}x${height}`);
}

const page = (body, css = '') => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONT}">
<style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Archivo,system-ui,sans-serif;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}${css}</style>
</head><body>${body}</body></html>`;

// ---- Icons
function icons() {
  const icon = (name, size, plate) =>
    shoot(name, page(markSvg({ size, plate }), 'body{background:transparent}svg{display:block}'), size, size, { transparent: !plate });
  icon('app/icon.png', 64, false);
  icon('app/apple-icon.png', 180, true);
  icon('public/icon-192.png', 192, true);
  icon('public/icon-512.png', 512, true);
}

// ---- Shared pieces of the share cards
const wordmark = (ink) =>
  `<div class="wm" style="color:${ink}">${markSvg({ size: 52 }).replace('<svg', '<svg class="m"')}<span>ClockMath</span></div>`;
const ticks = (ink, current = 37) =>
  `<svg class="ticks" viewBox="0 0 1000 40" preserveAspectRatio="none">${Array.from({ length: 60 }, (_, i) => {
    const x = 4 + (i / 59) * 992;
    const on = i <= current;
    return `<line x1="${x}" x2="${x}" y1="${i === current ? 0 : i % 5 === 0 ? 6 : 16}" y2="38" stroke="${ink}" stroke-opacity="${on ? 1 : 0.32}" stroke-width="${i % 5 === 0 || i === current ? 5 : 3}"/>`;
  }).join('')}</svg>`;
const CARD_CSS = `
  body{width:1200px;height:630px;overflow:hidden}
  .card{width:1200px;height:630px;padding:64px 72px 56px;display:flex;flex-direction:column}
  .wm{display:flex;align-items:center;gap:16px;font-weight:800;font-size:34px;letter-spacing:-0.01em}
  .wm .m{width:52px;height:52px}
  .ticks{display:block;width:100%;height:40px}
  .foot{display:flex;justify-content:space-between;align-items:baseline;font-size:26px;margin-top:22px}
  .foot b{font-weight:700}`;

// Shrinks the headline until it fits one line of the card.
const FIT = `<script>
  document.fonts.ready.then(() => {
    for (const el of document.querySelectorAll('[data-fit]')) {
      const max = Number(el.dataset.fit);
      let size = Number(getComputedStyle(el).fontSize.replace('px', ''));
      while (el.scrollWidth > max && size > 40) { size -= 2; el.style.fontSize = size + 'px'; }
    }
  });
</script>`;

// ---- Tool cards: each tool's own question and a typical answer, on its line
// colour (lib/lines.ts, components/station/lines.css), like its page's sign.
// The answers are fixed examples that are always true; no live figures.
const LINES = {
  time: '#1849a9',
  work: '#1d6b46',
  zones: '#0a6b74',
  sleep: '#3b2f86',
  countdowns: '#b5541c',
  guides: '#8a2c5a',
};
const TOOLS = [
  // [file, line, question, answer (HTML), what it means, footer path]
  ['og-v4', 'time', 'Time between two times', '8<span class="u">h</span>30<span class="u">m</span>', '9:00 AM to 5:30 PM, with decimal hours for timesheets', 'clockmath.com'],
  ['og/tool/timesheet', 'work', 'Work hours calculator', '37.50<span class="u">hours</span>', 'Five shifts, breaks taken off, ready for payroll', 'clockmath.com/tools/timesheet'],
  ['og/tool/overtime', 'work', 'Overtime calculator', '40 + 6.5<span class="u">h</span>', 'Regular and overtime hours, and what time and a half pays', 'clockmath.com/tools/overtime'],
  ['og/tool/decimal-hours', 'work', 'Minutes to decimal hours', '7:45 = 7.75', 'Hours and minutes to decimal, and back, for timesheets', 'clockmath.com/tools/decimal-hours'],
  ['og/tool/timezone', 'zones', 'Time zone converter', '12:00 PM<span class="u">in New York</span>', 'when it is 9:00 AM in Los Angeles, daylight saving handled', 'clockmath.com/tools/timezone'],
  ['og/tool/market-hours', 'zones', 'Is the market open?', '9:30–4:00<span class="u">NYSE</span>', 'Ten major exchanges, open or closed, in your timezone', 'clockmath.com/tools/market-hours'],
  ['og/tool/sleep', 'sleep', 'Sleep calculator', '7<span class="u">h</span>30<span class="u">m</span>', '11:00 PM to 6:30 AM: five full 90-minute sleep cycles', 'clockmath.com/tools/sleep'],
  ['og/tool/countdown', 'countdowns', 'Countdown timer', 'Any date', 'Count down to your own date, then share the link', 'clockmath.com/tools/countdown'],
  ['og/tool/guides', 'guides', 'ClockMath guides', 'Guides', 'Work hours, payroll time math and time zones, worked out', 'clockmath.com/articles'],
];

function toolCards() {
  for (const [file, line, question, answer, meaning, foot] of TOOLS) {
    const html = page(
      `<div class="card" style="background:${LINES[line]};color:#fff">
        ${wordmark('#fff')}
        <p class="q">${question}</p>
        <p class="big" data-fit="1056">${answer}</p>
        <p class="sub">${meaning}</p>
        <div class="foot"><span>Free, no signup</span><b>${foot}</b></div>
      </div>${FIT}`,
      CARD_CSS +
        `.q{margin:auto 0 0;font-size:40px;font-weight:700;opacity:0.9}
         .big{margin:6px 0 0;font-weight:900;font-stretch:68%;font-size:210px;line-height:0.88;letter-spacing:-0.02em;white-space:nowrap}
         .big .u{font-size:0.4em;font-weight:700;letter-spacing:0;margin:0 0.18em 0 0.06em}
         .big .u:last-child{margin-right:0}
         .sub{margin:22px 0 34px;font-size:36px;font-weight:600;line-height:1.25}
         .foot{border-top:2px solid rgb(255 255 255 / 0.35);padding-top:20px;margin-top:0}`,
    );
    shoot(`public/${file}.png`, html, 1200, 630);
  }
}

// The tools hub: every line, as on the All tools page
function hubCard() {
  const rows = [
    ['time', 'Time Duration Calculator'],
    ['work', 'Work Hours Calculator'],
    ['zones', 'Time Zone Converter'],
    ['sleep', 'Sleep Calculator'],
    ['countdowns', 'Countdown Timer'],
    ['guides', 'Guides'],
  ]
    .map(([line, name]) => `<li style="border-left-color:${LINES[line]}">${name}</li>`)
    .join('');
  const html = page(
    `<div class="card" style="background:#fff;color:${INK}">
      ${wordmark(INK)}
      <div class="row">
        <p class="h">Free time &amp; date tools</p>
        <ul>${rows}</ul>
      </div>
      <div class="foot"><span>No signup, no ads</span><b>clockmath.com/tools</b></div>
    </div>`,
    CARD_CSS +
      `.row{flex:1;display:flex;align-items:center;justify-content:space-between;gap:48px}
       .h{margin:0;font-weight:900;font-stretch:70%;font-size:118px;line-height:0.92;letter-spacing:-0.02em;max-width:6.2em}
       ul{list-style:none;margin:0;padding:0;flex-shrink:0}
       li{border-left:12px solid;padding:7px 0 7px 18px;margin:8px 0;font-size:30px;font-weight:700}
       .foot{border-top:2px solid #dadde2;padding-top:20px}`,
  );
  shoot('public/og/tool/tools.png', html, 1200, 630);
}

// ---- Quiz card: a score on the quiz line's sun yellow, right in green and
// wrong in red, as on the question tiles
function quizCard() {
  const marks = [1, 1, 0, 1, 1]
    .map((ok) => `<i style="background:${ok ? '#1d6b46' : '#b42318'}"></i>`)
    .join('');
  const html = page(
    `<div class="card" style="background:#f3c64a;color:${INK}">
      ${wordmark(INK)}
      <div class="row">
        <div>
          <p class="h">Daily Time Quiz</p>
          <p class="sub">The same five clock-math questions for everyone, every day.</p>
        </div>
        <div class="board"><p class="score">4/5 <small>in 0:42</small></p><div class="marks">${marks}</div></div>
      </div>
      <div class="foot"><span>New puzzle at midnight UTC</span><b>clockmath.com/tools/quiz</b></div>
    </div>`,
    CARD_CSS +
      `.row{flex:1;display:flex;align-items:center;justify-content:space-between;gap:56px}
       .h{margin:0;font-weight:900;font-stretch:72%;font-size:132px;line-height:0.9;letter-spacing:-0.02em;word-spacing:0.12em}
       .sub{margin:22px 0 0;font-size:32px;line-height:1.3;color:rgb(0 0 0 / 0.78);max-width:15em}
       .board{flex-shrink:0;background:#fff;color:${INK};border-radius:18px;padding:34px 40px}
       .score{margin:0;font-weight:900;font-stretch:70%;font-size:120px;line-height:0.9}
       .score small{font-size:32px;font-stretch:100%;font-weight:700}
       .marks{display:flex;gap:12px;margin-top:22px}
       .marks i{width:46px;height:46px;border-radius:6px;display:block}`,
  );
  shoot('public/og-quiz-v3.png', html, 1200, 630);
}

// ---- Countdown cards
// Subtitles that stay true: the rule for recurring days, the fixed date for
// one-off events. Every countdown page needs one (checked below).
const SUBTITLES = {
  thanksgiving: 'The fourth Thursday of November',
  'black-friday': 'The day after Thanksgiving',
  christmas: 'December 25',
  halloween: 'October 31',
  'new-year': 'January 1',
  'valentines-day': 'February 14',
  'july-4th': 'July 4',
  'canada-day': 'July 1',
  weekend: 'Saturday and Sunday, every week',
  easter: 'The first Sunday after the first full moon of spring',
  'lunar-new-year': 'The new moon between January 21 and February 20',
  hanukkah: 'Eight nights from 25 Kislev',
  'super-bowl': 'Game day: Sunday, February 14, 2027',
  'gta-6': 'Release day: November 19, 2026',
  'avengers-doomsday': 'In theaters December 18, 2026',
  'olympics-2028': 'Opening ceremony: July 14, 2028',
  'solar-eclipse-2027': 'August 2, 2027',
  'solar-eclipse-2028': 'July 22, 2028',
  'annular-eclipse-2028': 'January 26, 2028',
  'daylight-saving-time': 'When the clocks change where you are',
};
// The two countdown pages that aren't in the registry (no fixed event).
const EXTRA = {
  retirement: { name: 'Retirement', board: { color: '#1f5c6b' }, subtitle: 'Count down to your own date' },
  holidays: { name: 'Holidays', board: { color: '#000000' }, subtitle: 'Every holiday, with the days left until each' },
};

async function countdownCards() {
  const bundle = path.join(TMP, 'countdowns.mjs');
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'lib/countdowns.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: bundle,
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    logLevel: 'silent',
  });
  const { COUNTDOWNS } = await import(pathToFileURL(bundle).href);

  const entries = [
    ...Object.entries(COUNTDOWNS).map(([slug, e]) => [slug, { name: e.name, board: e.spec.board, subtitle: SUBTITLES[slug] }]),
    ...Object.entries(EXTRA),
  ];
  const pages = fs.readdirSync(path.join(ROOT, 'app/countdown'));
  const missing = pages.filter((p) => !entries.some(([slug]) => slug === p));
  if (missing.length) throw new Error(`no share card for /countdown/${missing.join(', /countdown/')}`);

  for (const [slug, { name, board, subtitle }] of entries) {
    if (!subtitle) throw new Error(`no subtitle for ${slug}`);
    const ink = board.ink ?? '#ffffff';
    // "the clock change" reads oddly as a headline
    const title = slug === 'daylight-saving-time' ? 'Clock change' : name.charAt(0).toUpperCase() + name.slice(1);
    const html = page(
      `<div class="card" style="background:${board.color};color:${ink}">
        ${wordmark(ink)}
        <p class="until">Countdown to</p>
        <p class="name" data-fit="1056">${title}</p>
        <p class="sub">${subtitle}</p>
        ${ticks(ink)}
        <div class="foot"><span>Live to the second</span><b>clockmath.com</b></div>
      </div>${FIT}`,
      CARD_CSS +
        `.until{margin:auto 0 0;font-size:34px;font-weight:700;opacity:0.85}
         .name{margin:4px 0 0;font-weight:900;font-stretch:66%;font-size:190px;line-height:0.92;letter-spacing:-0.025em;word-spacing:0.14em;white-space:nowrap}
         .sub{margin:14px 0 30px;font-size:38px;font-weight:600}`,
    );
    shoot(`public/og/countdown/${slug}.png`, html, 1200, 630);
  }
}

icons();
toolCards();
hubCard();
quizCard();
await countdownCards();
fs.rmSync(TMP, { recursive: true, force: true });
