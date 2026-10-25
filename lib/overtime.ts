/**
 * Overtime split math — pure and unit-testable.
 *
 * Federal FLSA baseline: hours beyond 40 in a workweek earn at least 1.5×
 * the regular rate. The threshold and multiplier are inputs because plenty
 * of workplaces differ (some states add daily overtime; some contracts pay
 * double time) — the tool computes, the page's content explains.
 */

export interface OvertimeInput {
  /** Total hours worked in the period (decimal, e.g. 46.5) */
  hoursWorked: number;
  /** Hours at regular rate before overtime starts (default 40) */
  threshold: number;
  /** Overtime pay multiplier (default 1.5) */
  multiplier: number;
  /** Hourly rate in currency units; null → time split only */
  rate: number | null;
}

export interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  /** Present only when a rate was supplied */
  regularPay: number | null;
  overtimePay: number | null;
  totalPay: number | null;
  /** Overtime hourly rate (rate × multiplier), when rate supplied */
  overtimeRate: number | null;
}

// Round half up to cents. Plain Math.round(n * 100) / 100 rounds 18.525
// ($12.35 × 1.5) DOWN to 18.52, because 18.525 * 100 is 1852.4999999999998
// in binary floating point; trimming to 12 significant digits first removes
// that representation error before rounding.
export const round2 = (n: number): number => Math.round(Number((n * 100).toPrecision(12))) / 100;

export function computeOvertime({ hoursWorked, threshold, multiplier, rate }: OvertimeInput): OvertimeResult {
  const worked = Math.max(0, hoursWorked);
  const limit = Math.max(0, threshold);
  const regularHours = round2(Math.min(worked, limit));
  const overtimeHours = round2(Math.max(0, worked - limit));

  if (rate == null || !(rate > 0)) {
    return { regularHours, overtimeHours, regularPay: null, overtimePay: null, totalPay: null, overtimeRate: null };
  }

  // Pay is computed from the ROUNDED overtime rate so the displayed
  // arithmetic checks out by hand: "6.5h × $26.66" must equal the OT pay
  // shown, penny for penny.
  const overtimeRate = round2(rate * multiplier);
  const regularPay = round2(regularHours * rate);
  const overtimePay = round2(overtimeHours * overtimeRate);
  return {
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay: round2(regularPay + overtimePay),
    overtimeRate,
  };
}

export interface WeeklyOvertimeResult extends OvertimeResult {
  /** Number of workweeks the hours were split across. */
  weeks: number;
}

/**
 * Overtime for a timesheet that may span several workweeks. The FLSA
 * threshold applies to each workweek on its own: 40 h + 40 h over two weeks
 * is no overtime, not 40 h of it. Runs computeOvertime per week and adds the
 * (already rounded) results, so each week's figures match /tools/overtime.
 */
export function computeWeeklyOvertime(
  weeklyHours: number[],
  { threshold, multiplier, rate }: Omit<OvertimeInput, 'hoursWorked'>,
): WeeklyOvertimeResult {
  const perWeek = weeklyHours.map((hoursWorked) => computeOvertime({ hoursWorked, threshold, multiplier, rate }));
  const sum = (pick: (r: OvertimeResult) => number | null): number => round2(perWeek.reduce((t, r) => t + (pick(r) ?? 0), 0));
  const paid = perWeek.length > 0 && perWeek[0].totalPay != null;
  return {
    weeks: perWeek.length,
    regularHours: sum((r) => r.regularHours),
    overtimeHours: sum((r) => r.overtimeHours),
    regularPay: paid ? sum((r) => r.regularPay) : null,
    overtimePay: paid ? sum((r) => r.overtimePay) : null,
    totalPay: paid ? sum((r) => r.totalPay) : null,
    overtimeRate: paid ? perWeek[0].overtimeRate : null,
  };
}

/** 46.5 → "46h 30m" for the friendly display next to decimals. */
export function decimalToHmLabel(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * A typed amount (a rate, an hour threshold) as a number, or null if it
 * isn't one. Plain text fields, not type="number": the browser's number
 * field dropped a comma, so "18,50" became 1850 — $92,037.50 gross for a
 * 46.5-hour week (Oct 2026 audit). A comma is a decimal mark before one or
 * two digits ("18,50") and a thousands mark before three ("1,850"); with
 * both marks, the comma groups thousands ("1,234.50"). "$" and spaces are
 * ignored. Negative values return NaN, so callers can say so.
 */
export function parseAmount(text: string): number | null {
  let t = text.trim().replace(/[$\s]/g, '');
  if (t === '') return null;
  const negative = t.startsWith('-');
  if (negative) t = t.slice(1);
  if (t.includes(',') && t.includes('.')) t = t.replace(/,/g, '');
  else if (/^\d+,\d{1,2}$/.test(t)) t = t.replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, '');
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return negative ? NaN : Number(t);
}

/**
 * Typed hours as decimal hours, or null if it isn't a length of time:
 * "46.5", "46,5", "46:30", "46h 30m", "46h", "46 h 30". The field only took
 * decimals: "46:30" became 4630 ("a week only has 168 hours"). Negative
 * values return NaN, as parseAmount does.
 */
export function parseHours(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (t === '') return null;
  if (t.startsWith('-')) return parseHours(t.slice(1)) === null ? null : NaN;
  let m = t.match(/^(\d{1,3}):(\d{1,2})$/);
  if (m) return Number(m[2]) < 60 ? Number(m[1]) + Number(m[2]) / 60 : null;
  m = t.match(/^(\d{1,3})\s*h(?:ours?|rs?)?\s*(?:(\d{1,2})\s*m(?:in(?:utes?)?)?)?$/) ?? t.match(/^(\d{1,3})\s*h\s*(\d{1,2})$/);
  if (m) return m[2] === undefined || Number(m[2]) < 60 ? Number(m[1]) + Number(m[2] ?? 0) / 60 : null;
  return parseAmount(t);
}
