/**
 * Decimal hours maths for /tools/decimal-hours/: the two conversions and the
 * rows of the page's charts.
 *
 * Nov 2026: "time decimal chart" (and "decimal to minutes chart", "tenths of
 * an hour chart") drew 1K–5K Copilot citations a month to other sites while
 * the page only had the minutes-to-decimal chart. Moved here from
 * components/DecimalHoursTool.tsx so the charts, the print sheet and the
 * converter share one set of tested functions.
 */

/** Minutes → decimal hours, to 2 decimal places (the payroll convention). */
export function minutesToDecimal(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

/** Decimal hours → whole hours + minutes (minutes rounded to the nearest). */
export function decimalToHm(decimal: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(decimal * 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

/**
 * A fraction of an hour → minutes, to one decimal place. Hundredths don't
 * land on whole minutes (0.01 h is 36 seconds), so the chart shows 0.6, 19.8
 * and so on rather than rounding 0.33 h to "20" and hiding the 12 seconds.
 */
export function decimalToMinutes(decimal: number): number {
  return Math.round(decimal * 600) / 10;
}

/** 19.8 → "19.8", 6 → "6" (no trailing ".0" on whole minutes). */
export function formatMinutes(minutes: number): string {
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

export interface RoundingBand {
  /** First minute past the hour in this band (inclusive). */
  from: number;
  /** Last minute in this band (inclusive). */
  to: number;
  /** The minutes the band rounds to (0, 6, 12, … or 0, 15, 30, …). */
  roundsTo: number;
  /** roundsTo as decimal hours (0.1, 0.25, …). */
  decimal: number;
}

/**
 * Minute ranges 0–60 grouped by what they round to at a given step, rounding
 * to the nearest step with halves going up. US wage-hour rules (29 CFR
 * 785.48(b)) allow rounding to the nearest 5 minutes, tenth or quarter of an
 * hour as long as it averages out, so payroll charts use "nearest":
 *   step 6  (tenths):   0–2 → 0.0, 3–8 → 0.1, … 57–60 → 1.0
 *   step 15 (quarters): 0–7 → 0.00, 8–22 → 0.25, … 53–60 → 1.00 ("7-minute rule")
 * Billing in 6-minute units usually rounds up instead (1–6 → 0.1); the page
 * says so in words rather than with a second table.
 */
export function roundingBands(step: number): RoundingBand[] {
  const bands: RoundingBand[] = [];
  for (let m = 0; m <= 60; m++) {
    const roundsTo = Math.floor(m / step + 0.5) * step;
    const last = bands[bands.length - 1];
    if (last && last.roundsTo === roundsTo) last.to = m;
    else bands.push({ from: m, to: m, roundsTo, decimal: minutesToDecimal(roundsTo) });
  }
  return bands;
}
