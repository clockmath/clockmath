/**
 * The countdown tool's `?to=` value: a local wall-clock time, "YYYY-MM-DDTHH:MM",
 * counted on each viewer's own clock.
 *
 * Until Oct 2026 the tool and the embed read it with `new Date(to)`, which
 * takes a bare date ("2026-12-25") as midnight UTC — 8 PM on Dec 24 in
 * Halifax, 4 PM in California. A bare date is now local midnight; anything
 * that isn't one of these forms (an ISO time with a zone, say) still goes
 * through Date.
 */

const pad = (n: number) => `${n}`.padStart(2, '0');

const toDateValue = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local "YYYY-MM-DDTHH:MM" from a Date */
export const toWallClock = (date: Date): string => `${toDateValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** A Date from a `?to=` value, or null when it can't be read */
export function parseWallClock(text: string | null | undefined): Date | null {
  const s = text?.trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [y, mo, d, h = 0, mi = 0, sec = 0] = m.slice(1).map((v) => (v === undefined ? undefined : Number(v))) as number[];
    if (h > 23 || mi > 59 || sec > 59) return null;
    const date = new Date(y, mo - 1, d, h, mi, sec);
    // 2026-02-30 would roll into March: not a real date
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
  }
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
}
