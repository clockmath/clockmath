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

const round2 = (n: number): number => Math.round(n * 100) / 100;

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

/** 46.5 → "46h 30m" for the friendly display next to decimals. */
export function decimalToHmLabel(decimal: number): string {
  const totalMinutes = Math.round(decimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
