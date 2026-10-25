/**
 * Timezone utilities for ClockMath.com
 * Handles timezone conversions, formatting, and timezone data
 */

// Check if Intl.supportedValuesOf is available (newer browsers)
function supportedTimeZones(): string[] {
  try {
    // Use modern API if available
    if (typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone').sort();
    }
    
    // Fallback to common timezones if modern API not available
    return [
      'UTC',
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Vancouver',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Amsterdam',
      'Europe/Stockholm',
      'Europe/Zurich',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Seoul',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Bangkok',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Perth',
      'Pacific/Auckland',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Europe/Moscow',
      'Asia/Istanbul'
    ].sort();
  } catch {
    return ['UTC'];
  }
}

/**
 * Get user's current timezone
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Get all supported timezones
 */
export function getAllTimeZones(): string[] {
  return supportedTimeZones();
}

/**
 * Canadian zones that stopped changing their clocks in 2026: none falls back
 * on Nov 1 2026 (IANA tzdata 2026b–2026e).
 *   - British Columbia stays on UTC−7 (news.gov.bc.ca/releases/2026AG0013-000209)
 *   - Alberta stays on UTC−6 (Bill 31, in force Jun 18 2026); tzdata also
 *     applies this to America/Yellowknife, which is a link to Edmonton.
 *   - Northwest Territories stays on UTC−6 (tzdata 2026d: America/Inuvik;
 *     the rest of the territory is America/Edmonton/Yellowknife).
 *   - Manitoba stays on UTC−5 (news.gov.mb.ca item 75397, Sep 17 2026;
 *     tzdata 2026e: America/Winnipeg).
 * Browsers whose bundled tz data predates a change keep applying the old
 * winter offset, so those cities would read an hour wrong. (Chrome 152.0.7977.130
 * still had BC's old rule in Oct 2026; .149 had both new rules.)
 *
 * For instants on/after the cancelled fall-back, such a zone is routed through
 * a fixed offset instead (POSIX sign: Etc/GMT+7 is UTC−7). Each rule probes the
 * browser itself, so it is self-healing: once the browser knows the new rule
 * the probe reads the new offset and the zone passes through unchanged.
 */
interface PermanentTimeSwitch {
  /** The fall-back instant that no longer happens. */
  fromMs: number;
  /** Fixed zone carrying the new year-round offset. */
  fixedZone: string;
  /** Winter offset (minutes) a browser with the OLD rule reports. */
  staleWinterOffset: number;
}
const PERMANENT_TIME_SWITCHES: Record<string, PermanentTimeSwitch> = {
  // Nov 1 2026, 02:00 PDT
  'America/Vancouver': { fromMs: Date.UTC(2026, 10, 1, 9, 0, 0), fixedZone: 'Etc/GMT+7', staleWinterOffset: -480 },
  // Nov 1 2026, 02:00 MDT
  'America/Edmonton': { fromMs: Date.UTC(2026, 10, 1, 8, 0, 0), fixedZone: 'Etc/GMT+6', staleWinterOffset: -420 },
  'America/Yellowknife': { fromMs: Date.UTC(2026, 10, 1, 8, 0, 0), fixedZone: 'Etc/GMT+6', staleWinterOffset: -420 },
  'America/Inuvik': { fromMs: Date.UTC(2026, 10, 1, 8, 0, 0), fixedZone: 'Etc/GMT+6', staleWinterOffset: -420 },
  // Nov 1 2026, 02:00 CDT
  'America/Winnipeg': { fromMs: Date.UTC(2026, 10, 1, 7, 0, 0), fixedZone: 'Etc/GMT+5', staleWinterOffset: -360 },
};
const WINTER_PROBE = new Date(Date.UTC(2027, 0, 15, 12, 0, 0)); // well inside the new rules
const staleRuleCache: Record<string, boolean> = {};

function browserHasStaleRule(timeZone: string, rule: PermanentTimeSwitch): boolean {
  if (!(timeZone in staleRuleCache)) {
    // rawTimezoneOffset, not getTimezoneOffset — the latter calls back into this.
    staleRuleCache[timeZone] = rawTimezoneOffset(timeZone, WINTER_PROBE) === rule.staleWinterOffset;
  }
  return staleRuleCache[timeZone];
}

/**
 * The zone to hand to Intl for `timeZone` at instant `at`. Identity for every
 * zone except one in PERMANENT_TIME_SWITCHES, on a browser that still has its
 * old rule, at an instant after its cancelled fall-back.
 */
export function resolveTimeZone(timeZone: string, at: Date): string {
  const rule = PERMANENT_TIME_SWITCHES[timeZone];
  if (rule && at.getTime() >= rule.fromMs && browserHasStaleRule(timeZone, rule)) {
    return rule.fixedZone;
  }
  return timeZone;
}

// Cached per zone: the converter labels all ~400 zones on mount.
const offsetLabelFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Get timezone offset label (e.g., "UTC-05:00" or "UTC+09:00")
 * Updated to use modern Intl API for better browser support
 */
export function getOffsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    // Use the modern Intl API for timezone offset formatting
    const zone = resolveTimeZone(timeZone, at);
    let formatter = offsetLabelFormatters.get(zone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset', hour: '2-digit' });
      offsetLabelFormatters.set(zone, formatter);
    }
    
    const parts = formatter.formatToParts(at);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart?.value) {
      // Convert GMT to UTC for consistency
      return offsetPart.value.replace('GMT', 'UTC');
    }
    
    // Fallback to manual calculation if shortOffset is not supported
    const offsetMinutes = getTimezoneOffset(timeZone, at);
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return 'UTC+00:00';
  }
}

/**
 * Get timezone offset in minutes from UTC
 */
export function getTimezoneOffset(timeZone: string, date: Date): number {
  return rawTimezoneOffset(resolveTimeZone(timeZone, date), date);
}

// One formatter per zone. Building two Intl.DateTimeFormat objects on every
// call made the clock-change countdown's 400-day scan and the converter's
// zone list measurably slow on phones (Oct 2026 audit). hourCycle 'h23'
// (not hour12: false) because some engines report midnight as hour "24",
// which Date.UTC would read as the next day.
const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
function offsetFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = offsetFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    offsetFormatters.set(timeZone, f);
  }
  return f;
}

/** Offset in minutes exactly as this browser's Intl reports it — no BC correction. */
function rawTimezoneOffset(timeZone: string, date: Date): number {
  try {
    const parts = offsetFormatter(timeZone).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
    // Wall-clock time in the zone, read as if it were UTC, minus the instant
    // itself (to the second, as the zone's wall clock has no milliseconds).
    const wallMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    const utcMs = Math.floor(date.getTime() / 1000) * 1000;
    return (wallMs - utcMs) / 60000;
  } catch {
    return 0;
  }
}

/**
 * Format a date/time in a specific timezone
 */
export function formatZoned(
  date: Date, 
  timeZone: string, 
  options?: { hour12?: boolean }
): { time: string; date: string; weekday: string } {
  try {
    const hour12 = options?.hour12 ?? true;
    timeZone = resolveTimeZone(timeZone, date);
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12
    });
    
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long'
    });
    
    return {
      time: timeFormatter.format(date),
      date: dateFormatter.format(date),
      weekday: weekdayFormatter.format(date)
    };
  } catch {
    return {
      time: date.toLocaleTimeString('en-US'),
      date: date.toLocaleDateString('en-US'),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  }
}

/**
 * Convert datetime from one timezone to another
 */
export function convertDateBetweenZones({
  fromTZ,
  toTZ,
  at
}: {
  fromTZ: string;
  toTZ: string;
  at: Date;
}): Date {
  try {
    // If same timezone, return the same date
    if (fromTZ === toTZ) {
      return new Date(at);
    }
    
    // The input date is already in UTC/local time
    // We just need to return it as-is since Date objects are timezone-agnostic
    // The formatting functions will handle the timezone display
    return new Date(at);
  } catch {
    return new Date(at);
  }
}

/**
 * Get a human-friendly timezone name
 */
export function getTimeZoneDisplayName(timeZone: string): string {
  try {
    // Convert IANA timezone to friendly name
    const city = timeZone.split('/').pop()?.replace(/_/g, ' ') || timeZone;
    
    // Special cases for common timezones
    const specialCases: Record<string, string> = {
      'UTC': 'UTC',
      'America/New_York': 'New York',
      'America/Los_Angeles': 'Los Angeles',
      'America/Chicago': 'Chicago',
      'America/Denver': 'Denver',
      'Europe/London': 'London',
      'Europe/Paris': 'Paris',
      'Asia/Tokyo': 'Tokyo',
      'Asia/Shanghai': 'Shanghai',
      'Australia/Sydney': 'Sydney'
    };
    
    return specialCases[timeZone] || city;
  } catch {
    return timeZone;
  }
}

/**
 * Create timezone options for select components
 */
export function getTimeZoneOptions(): Array<{ id: string; label: string }> {
  const zones = getAllTimeZones();
  const now = new Date();
  
  return zones.map(tz => ({
    id: tz,
    label: `${getTimeZoneDisplayName(tz)} (${getOffsetLabel(tz, now)})`
  }));
}

/**
 * A wall-clock date and time in a zone, as an instant, and whether that time
 * is an ordinary one, one the clocks skip (2:30 AM when they jump from 2:00
 * to 3:00) or one they pass twice (1:30 AM when they go back from 2:00).
 *
 * Oct 2026 audit: a skipped time came out an hour early west of UTC (2:30 AM
 * in New York on the spring-forward day was 1:30 AM EST) and an hour late
 * east of it, depending on which side of the change the first guess fell.
 * Both cases now use the offset from before the change, as calendars and
 * JavaScript's Temporal do: a skipped time moves forward by the gap (2:30
 * becomes 3:30 AM), and a doubled one is the first of the two.
 */
export function zonedWallTime(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): { date: Date; kind: 'normal' | 'skipped' | 'repeated' } {
  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  const [hour, minute] = timeStr.split(':').map((v) => parseInt(v, 10));
  // The wall time read as if it were UTC; the real instant is this minus the
  // zone's offset at that instant
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const HOURS_14 = 14 * 3600000;
  const before = getTimezoneOffset(timeZone, new Date(guess - HOURS_14));
  const after = getTimezoneOffset(timeZone, new Date(guess + HOURS_14));
  const fits = (offset: number) => getTimezoneOffset(timeZone, new Date(guess - offset * 60000)) === offset;
  const fitting = [...new Set([before, after])].filter(fits);
  if (fitting.length === 1) return { date: new Date(guess - fitting[0] * 60000), kind: 'normal' };
  return {
    date: new Date(guess - before * 60000),
    kind: fitting.length === 0 ? 'skipped' : 'repeated',
  };
}

/**
 * Parse a datetime string in a specific timezone (see zonedWallTime for
 * times the clocks skip or pass twice)
 */
export function parseDateTimeInZone(
  dateStr: string,
  timeStr: string,
  timeZone: string
): Date {
  try {
    if (!dateStr || !timeStr) {
      return new Date();
    }
    return zonedWallTime(dateStr, timeStr, timeZone).date;
  } catch {
    return new Date();
  }
}
