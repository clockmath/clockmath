/**
 * The blank timesheet at /tools/timesheet-template/ (Nov 2026): one row per
 * day for a week or two, with the columns paper time cards use (time in,
 * lunch out, lunch in, time out, total hours). The page prints it and offers
 * it as a CSV whose Hours cells are formulas, so it works as a spreadsheet
 * template in Excel or Google Sheets.
 */

export type Period = 'weekly' | 'biweekly';
/** The first day of the week: 0 = Sunday, 1 = Monday. */
export type FirstDay = 0 | 1;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TEMPLATE_COLUMNS = ['Time in', 'Lunch out', 'Lunch in', 'Time out', 'Total hours'];

export const periodWeeks = (period: Period) => (period === 'weekly' ? 1 : 2);

/** Local midnight on the first day of the week that contains `d`. */
export function weekStart(d: Date, first: FirstDay): Date {
  const back = (d.getDay() - first + 7) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
}

export interface TemplateDay {
  name: string;
  /** Null on a blank template (no dates filled in). */
  date: Date | null;
  /** 1 or 2 */
  week: number;
}

/**
 * The rows of the sheet. With a start date the days run from it (whatever
 * weekday it is); without one they run from the first day of the week.
 */
export function templateDays(period: Period, first: FirstDay, start: Date | null): TemplateDay[] {
  const count = periodWeeks(period) * 7;
  const firstDay = start ? start.getDay() : first;
  return Array.from({ length: count }, (_, i) => ({
    name: DAY_NAMES[(firstDay + i) % 7],
    date: start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + i) : null,
    week: Math.floor(i / 7) + 1,
  }));
}

/** "Nov 23" (fixed to en-US so the page and the print agree everywhere). */
export const shortDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "Nov 23 – Dec 6, 2026", or "Dec 28, 2026 – Jan 10, 2027" across a year. */
export function periodLabel(days: TemplateDay[]): string {
  const a = days[0]?.date;
  const b = days[days.length - 1]?.date;
  if (!a || !b) return '';
  return a.getFullYear() === b.getFullYear()
    ? `${shortDay(a)} – ${shortDay(b)}, ${b.getFullYear()}`
    : `${shortDay(a)}, ${a.getFullYear()} – ${shortDay(b)}, ${b.getFullYear()}`;
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * The template as CSV for Excel or Google Sheets. Columns A–G: Day, Date,
 * Time in, Lunch out, Lunch in, Time out, Hours. Each Hours cell is a formula
 * that stays empty until a time out is typed, then gives decimal hours less
 * the lunch; MOD(…,1) makes a shift past midnight (10 PM to 6 AM) count as 8,
 * not −16. A total for each week, then the period.
 */
export function templateCsv(days: TemplateDay[]): string {
  const rows: string[][] = [['Day', 'Date', 'Time in', 'Lunch out', 'Lunch in', 'Time out', 'Hours']];
  days.forEach((d, i) => {
    const r = i + 2;
    rows.push([
      d.name,
      d.date ? isoDay(d.date) : '',
      '',
      '',
      '',
      '',
      `=IF(F${r}="","",ROUND((MOD(F${r}-C${r},1)-MOD(E${r}-D${r},1))*24,2))`,
    ]);
  });
  const last = days.length + 1;
  if (days.length > 7) {
    rows.push(['Week 1 total', '', '', '', '', '', '=SUM(G2:G8)']);
    rows.push(['Week 2 total', '', '', '', '', '', `=SUM(G9:G${last})`]);
  }
  rows.push(['Total hours', '', '', '', '', '', `=SUM(G2:G${last})`]);
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
