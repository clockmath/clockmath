/**
 * Daily time quiz — deterministic, date-seeded question generation.
 *
 * The same UTC day always yields the same five questions for everyone,
 * which is what makes a shared daily puzzle (and a fair leaderboard)
 * possible on a fully static site: no backend generates or stores the
 * puzzle, the date IS the puzzle id.
 *
 * All generators are pure functions of a PRNG so they can be unit-tested
 * and reused for practice mode (random seed instead of the date seed).
 */

export interface QuizQuestion {
  /** Question text, e.g. "How much time passes from 9:20 AM to 3:45 PM?" */
  prompt: string;
  /** When set, the component renders an analog clock face showing h:m. */
  clock?: { h: number; m: number };
  /** Exactly four answer options, pre-shuffled deterministically. */
  options: string[];
  correctIndex: number;
  /** One-line teaching note shown after answering. */
  explanation: string;
  /** Tool that practices this skill — the wrong-answer funnel. */
  toolHref: string;
  toolLabel: string;
}

export interface DailyQuiz {
  day: string; // YYYY-MM-DD (UTC)
  number: number; // puzzle # since launch
  questions: QuizQuestion[];
}

/** Puzzle #1 is the launch day; earlier dates clamp to 1. */
const PUZZLE_EPOCH_UTC = Date.UTC(2026, 7, 12); // 2026-08-12 → Aug 13 is #1

export const QUIZ_QUESTION_COUNT = 5;

/** Canonical quiz day: UTC date, so the whole world shares one board. */
export function getQuizDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getPuzzleNumber(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  const n = Math.round((Date.UTC(y, m - 1, d) - PUZZLE_EPOCH_UTC) / 86400000);
  return Math.max(1, n);
}

/** mulberry32 — tiny deterministic PRNG, plenty for puzzle generation. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDay(day: string): number {
  // YYYYMMDD as an int keeps consecutive days well-separated after mixing.
  return Number(day.replace(/-/g, ''));
}

// ---------------------------------------------------------------------------
// Formatting helpers (exported for the component + tests)
// ---------------------------------------------------------------------------

/** 455 → "7h 35m"; 480 → "8h"; 45 → "45m" */
export function fmtDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Minutes-of-day (0–1439, wraps) → "3:45 PM" */
export function fmtClock(minutesOfDay: number): string {
  const mod = ((minutesOfDay % 1440) + 1440) % 1440;
  const h24 = Math.floor(mod / 60);
  const m = mod % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** 67_000 → "1:07" */
export function fmtMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Question generators
// ---------------------------------------------------------------------------

type Rand = () => number;

function randInt(rand: Rand, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pick<T>(rand: Rand, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Round-5 minute-of-day between two hours (inclusive start, exclusive end). */
function randTime(rand: Rand, startHour: number, endHour: number): number {
  const steps = ((endHour - startHour) * 60) / 5;
  return startHour * 60 + randInt(rand, 0, steps - 1) * 5;
}

/**
 * Build four options: the right answer plus three plausible near-misses.
 * Deltas are tried in seeded-shuffled order; formatting collisions and
 * negatives are skipped. `format` maps the raw value to display text.
 */
function buildOptions(
  rand: Rand,
  correct: number,
  deltas: number[],
  format: (v: number) => string,
): { options: string[]; correctIndex: number } {
  const values = [correct];
  const shuffledDeltas = [...deltas].sort(() => rand() - 0.5);
  for (const d of shuffledDeltas) {
    if (values.length === 4) break;
    const candidate = correct + d;
    if (candidate <= 0) continue;
    if (values.some((v) => format(v) === format(candidate))) continue;
    values.push(candidate);
  }
  // Extremely defensive: pad with growing offsets if deltas collided.
  let pad = 5;
  while (values.length < 4) {
    if (!values.some((v) => format(v) === format(correct + pad))) values.push(correct + pad);
    pad += 5;
  }
  // Seeded shuffle of the final option order.
  const order = values
    .map((v, i) => ({ v, i, k: rand() }))
    .sort((a, b) => a.k - b.k);
  return {
    options: order.map((o) => format(o.v)),
    correctIndex: order.findIndex((o) => o.i === 0),
  };
}

const DURATION_DELTAS = [5, -5, 10, -10, 15, -15, 60, -60];

/** Q1 — elapsed time within one day. */
function genDurationSameDay(rand: Rand): QuizQuestion {
  const start = randTime(rand, 6, 12);
  const durationMin = randInt(rand, 13, 96) * 5; // 1h05 – 8h00
  const end = start + durationMin;
  const { options, correctIndex } = buildOptions(rand, durationMin, DURATION_DELTAS, fmtDuration);
  return {
    prompt: `How much time passes from ${fmtClock(start)} to ${fmtClock(end)}?`,
    options,
    correctIndex,
    explanation: `Count up to the next full hour from ${fmtClock(start)}, then whole hours, then the leftover minutes — ${fmtDuration(durationMin)} in total.`,
    toolHref: '/',
    toolLabel: 'Time Duration Calculator',
  };
}

/** Q2 — elapsed time across midnight. */
function genCrossMidnight(rand: Rand): QuizQuestion {
  const start = randTime(rand, 20, 24); // 8:00 PM – 11:55 PM
  const end = randTime(rand, 5, 8); // 5:00 AM – 7:55 AM
  const durationMin = 1440 - start + end;
  const { options, correctIndex } = buildOptions(rand, durationMin, DURATION_DELTAS, fmtDuration);
  return {
    prompt: `A night shift runs from ${fmtClock(start)} to ${fmtClock(end)} the next morning. How long is it?`,
    options,
    correctIndex,
    explanation: `Split it at midnight: ${fmtDuration(1440 - start)} before, ${fmtDuration(end)} after — ${fmtDuration(durationMin)} altogether.`,
    toolHref: '/',
    toolLabel: 'Time Duration Calculator',
  };
}

/** Q3 — add a duration to a clock time. */
function genAddDuration(rand: Rand): QuizQuestion {
  const start = randTime(rand, 7, 20);
  const addMin = randInt(rand, 15, 66) * 5; // 1h15 – 5h30
  const end = start + addMin;
  const { options, correctIndex } = buildOptions(
    rand,
    end,
    [5, -5, 10, -10, 60, -60, 15, -15],
    fmtClock,
  );
  return {
    prompt: `It's ${fmtClock(start)}. What time is it in ${fmtDuration(addMin)}?`,
    options,
    correctIndex,
    explanation: `Add the hours first (${fmtClock(start)} → ${fmtClock(start + Math.floor(addMin / 60) * 60)}), then the ${addMin % 60 === 0 ? 'minutes — none left' : `remaining ${addMin % 60} minutes`}: ${fmtClock(end)}.`,
    toolHref: '/',
    toolLabel: 'Time Duration Calculator',
  };
}

/** Q4 — hours & minutes to decimal hours (payroll math). */
function genDecimalHours(rand: Rand): QuizQuestion {
  // 4.25h – 11.75h in 15-min steps; whole hours are nudged off — "6h → 6"
  // is too trivial to ask and reads badly in the explanation.
  let quarters = randInt(rand, 17, 47);
  if (quarters % 4 === 0) quarters += 1;
  const minutes = quarters * 15;
  const fmtDecimal = (v: number) => {
    const dec = v / 60;
    return Number.isInteger(dec) ? String(dec) : String(Math.round(dec * 100) / 100);
  };
  const { options, correctIndex } = buildOptions(rand, minutes, [15, -15, 30, -30, 5, -5, 3, -3], fmtDecimal);
  return {
    prompt: `A timesheet shows ${fmtDuration(minutes)}. What is that in decimal hours?`,
    options,
    correctIndex,
    explanation: `Divide the minutes by 60: ${minutes % 60} minutes is ${fmtDecimal(minutes % 60)} of an hour, so ${fmtDuration(minutes)} = ${fmtDecimal(minutes)} hours.`,
    toolHref: '/tools/decimal-hours',
    toolLabel: 'Decimal Hours Converter',
  };
}

/** Q5 — shift length minus an unpaid break. */
function genShiftWithBreak(rand: Rand): QuizQuestion {
  const start = randTime(rand, 7, 10);
  const shiftMin = randInt(rand, 72, 120) * 5; // 6h – 10h
  const breakMin = pick(rand, [30, 45, 60]);
  const end = start + shiftMin;
  const paid = shiftMin - breakMin;
  const { options, correctIndex } = buildOptions(rand, paid, DURATION_DELTAS, fmtDuration);
  return {
    prompt: `A shift runs ${fmtClock(start)} to ${fmtClock(end)} with a ${breakMin}-minute unpaid break. How many hours are worked?`,
    options,
    correctIndex,
    explanation: `${fmtClock(start)} to ${fmtClock(end)} is ${fmtDuration(shiftMin)}; subtract the ${breakMin}-minute break for ${fmtDuration(paid)} worked.`,
    toolHref: '/tools/timesheet',
    toolLabel: 'Work Hours Calculator',
  };
}

/** "2:45"-style label on a 12-hour dial (no AM/PM — a clock face has none). */
function fmtDial(v: number): string {
  const mod = ((v % 720) + 720) % 720;
  const h = Math.floor(mod / 60) === 0 ? 12 : Math.floor(mod / 60);
  return `${h}:${String(mod % 60).padStart(2, '0')}`;
}

/** Minutes-of-day → "17:30" (24-hour). */
function fmt24(v: number): string {
  const mod = ((v % 1440) + 1440) % 1440;
  return `${String(Math.floor(mod / 60)).padStart(2, '0')}:${String(mod % 60).padStart(2, '0')}`;
}

/** V2 — read an analog clock face (rendered from `clock` by the component). */
function genClockFace(rand: Rand): QuizQuestion {
  const h = randInt(rand, 1, 12);
  const m = randInt(rand, 0, 11) * 5;
  const value = h * 60 + m; // 60..779, always positive for buildOptions
  const { options, correctIndex } = buildOptions(rand, value, [5, -5, 60, -60, 30, -30, 15, -15], fmtDial);
  return {
    prompt: 'What time does this clock show?',
    clock: { h, m },
    options,
    correctIndex,
    explanation: `The short hand marks the hour (${h}), the long hand points at ${m} minutes — ${fmtDial(value)}.`,
    toolHref: '/',
    toolLabel: 'Time Duration Calculator',
  };
}

/** V2 — 12-hour ↔ 24-hour conversion (afternoon/evening, where it's non-trivial). */
function gen24Hour(rand: Rand): QuizQuestion {
  const h24 = randInt(rand, 13, 23);
  const m = randInt(rand, 0, 11) * 5;
  const value = h24 * 60 + m;
  const deltas = [60, -60, 720, -720, 30, -30, 5, -5]; // ±12h = the classic AM/PM slip
  if (rand() < 0.5) {
    const { options, correctIndex } = buildOptions(rand, value, deltas, fmtClock);
    return {
      prompt: `A schedule says ${fmt24(value)}. What time is that on a 12-hour clock?`,
      options,
      correctIndex,
      explanation: `${h24} is past noon, so subtract 12: ${h24} − 12 = ${h24 - 12}, minutes unchanged — ${fmtClock(value)}.`,
      toolHref: '/',
      toolLabel: 'Time Duration Calculator',
    };
  }
  const { options, correctIndex } = buildOptions(rand, value, deltas, fmt24);
  return {
    prompt: `It's ${fmtClock(value)}. What is that in 24-hour time?`,
    options,
    correctIndex,
    explanation: `PM times add 12 to the hour: ${h24 - 12} + 12 = ${h24}, minutes unchanged — ${fmt24(value)}.`,
    toolHref: '/',
    toolLabel: 'Time Duration Calculator',
  };
}

const GENERATORS = [
  genDurationSameDay,
  genCrossMidnight,
  genAddDuration,
  genDecimalHours,
  genShiftWithBreak,
];

/**
 * Days on or after this date may swap two slots for the v2 question types
 * (clock face, 24-hour). Date-gated so a mid-day deploy can NEVER change a
 * live day's puzzle: the gate compares against the puzzle's own day, and
 * every pre-gate day consumes the PRNG in exactly the historical order.
 */
export const QUESTION_MIX_V2_FROM = '2026-09-15';

/** The shared daily puzzle for a given UTC day. */
export function generateDailyQuiz(day: string): DailyQuiz {
  const rand = mulberry32(seedFromDay(day));
  // Burn a few values so near-identical integer seeds diverge fully.
  rand();
  rand();
  rand();
  let gens = GENERATORS;
  if (day >= QUESTION_MIX_V2_FROM) {
    // Two variety slots, each swapped on a deterministic coin flip. The
    // flips draw from the same seeded stream, so the whole world still
    // agrees on the day's mix.
    const g = [...GENERATORS];
    if (rand() < 0.5) g[0] = genClockFace;
    if (rand() < 0.5) g[2] = gen24Hour;
    gens = g;
  }
  return {
    day,
    number: getPuzzleNumber(day),
    questions: gens.map((g) => g(rand)),
  };
}

/** Practice draws from every type immediately — no fairness gate needed. */
const PRACTICE_GENERATORS = [...GENERATORS, genClockFace, gen24Hour];

/** One random practice question (any type), non-deterministic seed OK. */
export function generatePracticeQuestion(seed: number): QuizQuestion {
  const rand = mulberry32(seed);
  rand();
  return pick(rand, PRACTICE_GENERATORS)(rand);
}

/**
 * Share string, Wordle-style. `results` is per-question correctness.
 * Kept plain-text so it pastes cleanly anywhere.
 */
export function buildShareText(quiz: DailyQuiz, results: boolean[], timeMs: number): string {
  const squares = results.map((r) => (r ? '🟩' : '🟥')).join('');
  const score = results.filter(Boolean).length;
  return `ClockMath Daily #${quiz.number} — ${score}/${QUIZ_QUESTION_COUNT} in ${fmtMMSS(timeMs)} 🕐\n${squares}\nclockmath.com/tools/quiz`;
}

/**
 * 3-letter arcade initials moderation — same bounded approach the classic
 * cabinets used. Duplicated in functions/api/quiz.js (server-side check);
 * keep the two lists in sync.
 */
export const BLOCKED_INITIALS = new Set([
  'ASS', 'SEX', 'FUK', 'FUC', 'FCK', 'FKU', 'CUM', 'TIT', 'DIK', 'DIC',
  'DCK', 'COK', 'KOK', 'FAG', 'FGT', 'NIG', 'NGR', 'KKK', 'NAZ', 'VAG',
  'HOE', 'WTF', 'XXX', 'KYS', 'DIE', 'PIS', 'CNT', 'TWA', 'JIZ', 'PNS',
]);

export function isValidInitials(initials: string): boolean {
  return /^[A-Z]{3}$/.test(initials) && !BLOCKED_INITIALS.has(initials);
}
