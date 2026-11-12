import { dayNumber, fromDayNumber, toIsoDate, weekday, type CalendarDate } from '@/lib/dateDiff';
import { usFederalDaysOff } from '@/lib/dateAdd';

export interface WorkingDayCount {
  /** Monday to Friday, less US federal days off (observed dates). */
  workingDays: number;
  /** Saturdays in the span: the weekends still to come. */
  weekends: number;
  /** Federal days off that fell on a weekday in the span, in order. */
  holidays: string[];
}

/**
 * Working days and weekends from `from` to `through`, both counted. Nov 2026:
 * "working days until Christmas" and its Thanksgiving / New Year twins are
 * asked of Copilot, and the big holiday pages, which lose the "days until"
 * head terms to established sites, only gave calendar days. Zero when
 * `through` is before `from`.
 */
export function countWorkingDays(from: CalendarDate, through: CalendarDate): WorkingDayCount {
  const out: WorkingDayCount = { workingDays: 0, weekends: 0, holidays: [] };
  for (let n = dayNumber(from); n <= dayNumber(through); n++) {
    const c = fromDayNumber(n);
    const wd = weekday(c);
    if (wd === 6) out.weekends++;
    if (wd === 0 || wd === 6) continue;
    const off = usFederalDaysOff(c.year).get(toIsoDate(c));
    if (off) out.holidays.push(off);
    else out.workingDays++;
  }
  return out;
}

const cd = (year: number, month: number, day: number): CalendarDate => ({ year, month, day });
const after = (a: CalendarDate, b: CalendarDate) => dayNumber(a) > dayNumber(b);

/** Christmas Eve before the next Christmas (on Christmas Day itself, next year's). */
export function christmasEveAhead(today: CalendarDate): CalendarDate {
  return today.month === 12 && today.day >= 25 ? cd(today.year + 1, 12, 24) : cd(today.year, 12, 24);
}

/** The last day of this year (New Year's Eve). */
export function yearEnd(today: CalendarDate): CalendarDate {
  return cd(today.year, 12, 31);
}

/** Halloween this year, or next year's once it has passed. */
export function halloweenAhead(today: CalendarDate): CalendarDate {
  const h = cd(today.year, 10, 31);
  return after(today, h) ? cd(today.year + 1, 10, 31) : h;
}

/** The Wednesday before Thanksgiving (4th Thursday of November), this year's or next. */
export function thanksgivingEveAhead(today: CalendarDate): CalendarDate {
  const wednesdayBefore = (year: number) => {
    const firstWeekday = new Date(Date.UTC(year, 10, 1)).getUTCDay();
    return cd(year, 11, 1 + ((4 - firstWeekday + 7) % 7) + 21 - 1);
  };
  const thisYear = wednesdayBefore(today.year);
  // Thanksgiving is the day after; once it has come, count to next year's
  return dayNumber(today) > dayNumber(thisYear) ? wednesdayBefore(today.year + 1) : thisYear;
}
