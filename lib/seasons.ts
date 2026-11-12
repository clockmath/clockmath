/**
 * The moments the astronomical seasons start: the March equinox (first day
 * of spring in the Northern Hemisphere) and the June solstice (first day of
 * summer), to the minute in UTC. Nov 2026: "first day of spring" is asked as
 * a date, but the date depends on where you are (the 2027 equinox is
 * Mar 20 in the Americas and Europe, Mar 21 in East Asia and Australia), so
 * the pages give the moment in the visitor's own zone.
 *
 * Times: US Naval Observatory, as published by the National Weather Service
 * (2027) and Natural Resources Canada (2028–2030), which agree to the
 * minute; checked Nov 12, 2026. Add years before the last one passes
 * (scripts/stale-check.mjs warns 45 days ahead).
 */
export type SeasonKind = 'spring' | 'summer';

export const SEASON_STARTS: Record<SeasonKind, ReadonlyArray<number>> = {
  // March equinox
  spring: [
    Date.UTC(2027, 2, 20, 20, 25),
    Date.UTC(2028, 2, 20, 2, 17),
    Date.UTC(2029, 2, 20, 8, 2),
    Date.UTC(2030, 2, 20, 13, 51),
  ],
  // June solstice
  summer: [
    Date.UTC(2027, 5, 21, 14, 11),
    Date.UTC(2028, 5, 20, 20, 1),
    Date.UTC(2029, 5, 21, 1, 48),
    Date.UTC(2030, 5, 21, 7, 31),
  ],
};

/** The next season start after `fromMs` (the last listed one once all have passed). */
export function nextSeasonStart(kind: SeasonKind, fromMs: number): number {
  const list = SEASON_STARTS[kind];
  return list.find((ms) => ms > fromMs) ?? list[list.length - 1];
}

/** "Saturday, March 20, 4:25 PM" in `timeZone`. */
export function momentIn(ms: number, timeZone: string, withYear = false): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: withYear ? 'numeric' : undefined });
  const time = d.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}
