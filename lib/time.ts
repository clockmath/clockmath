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
 * British Columbia moved to permanent UTC−7: its last clock change was
 * Mar 8 2026 and the Nov 1 2026 fall-back never happens (IANA tzdata 2026c;
 * news.gov.bc.ca/releases/2026AG0013-000209). Browsers whose bundled tz data
 * predates the change — Chrome 152 still did in Oct 2026 — keep applying
 * PST (UTC−8) to America/Vancouver every winter, so Vancouver/Victoria would
 * read an hour wrong.
 *
 * For instants on/after the cancelled fall-back, route Vancouver through a
 * fixed UTC−7 zone instead (POSIX sign: Etc/GMT+7 is UTC−7). The check probes
 * the browser itself, so it is self-healing: once the browser knows the new
 * rule the probe reads −7 and this returns the zone unchanged.
 */
const BC_PERMANENT_FROM_MS = Date.UTC(2026, 10, 1, 9, 0, 0); // Nov 1 2026, 02:00 PDT — the fall-back that no longer happens
const BC_PROBE = new Date(Date.UTC(2027, 0, 15, 12, 0, 0)); // a winter instant well inside the new rule
let bcRuleStale: boolean | null = null;

function browserHasStaleBCRule(): boolean {
  if (bcRuleStale === null) {
    // rawTimezoneOffset, not getTimezoneOffset — the latter calls back into this.
    bcRuleStale = rawTimezoneOffset('America/Vancouver', BC_PROBE) === -480;
  }
  return bcRuleStale;
}

/**
 * The zone to hand to Intl for `timeZone` at instant `at`. Identity for every
 * zone except America/Vancouver on a browser that still has the old BC rule.
 */
export function resolveTimeZone(timeZone: string, at: Date): string {
  if (
    timeZone === 'America/Vancouver' &&
    at.getTime() >= BC_PERMANENT_FROM_MS &&
    browserHasStaleBCRule()
  ) {
    return 'Etc/GMT+7';
  }
  return timeZone;
}

/**
 * Get timezone offset label (e.g., "UTC-05:00" or "UTC+09:00")
 * Updated to use modern Intl API for better browser support
 */
export function getOffsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    // Use the modern Intl API for timezone offset formatting
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: resolveTimeZone(timeZone, at),
      timeZoneName: 'shortOffset',
      hour: '2-digit',
    });
    
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

/** Offset in minutes exactly as this browser's Intl reports it — no BC correction. */
function rawTimezoneOffset(timeZone: string, date: Date): number {
  try {
    // Create formatters for UTC and target timezone
    const utcFormatter = new Intl.DateTimeFormat('en', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const targetFormatter = new Intl.DateTimeFormat('en', {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const utcParts = utcFormatter.formatToParts(date);
    const targetParts = targetFormatter.formatToParts(date);

    // Use UTC construction to avoid host locale/DST influencing the delta
    const utcMs = Date.UTC(
      parseInt(utcParts.find(p => p.type === 'year')?.value || '0'),
      parseInt(utcParts.find(p => p.type === 'month')?.value || '0') - 1,
      parseInt(utcParts.find(p => p.type === 'day')?.value || '0'),
      parseInt(utcParts.find(p => p.type === 'hour')?.value || '0'),
      parseInt(utcParts.find(p => p.type === 'minute')?.value || '0'),
      parseInt(utcParts.find(p => p.type === 'second')?.value || '0')
    );

    const targetMs = Date.UTC(
      parseInt(targetParts.find(p => p.type === 'year')?.value || '0'),
      parseInt(targetParts.find(p => p.type === 'month')?.value || '0') - 1,
      parseInt(targetParts.find(p => p.type === 'day')?.value || '0'),
      parseInt(targetParts.find(p => p.type === 'hour')?.value || '0'),
      parseInt(targetParts.find(p => p.type === 'minute')?.value || '0'),
      parseInt(targetParts.find(p => p.type === 'second')?.value || '0')
    );

    return (targetMs - utcMs) / (1000 * 60);
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
 * Parse a datetime string in a specific timezone
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

    // Parse basics
    const [year, month, day] = dateStr.split('-').map(v => parseInt(v, 10));
    const [hour, minute] = timeStr.split(':').map(v => parseInt(v, 10));

    // First, create a UTC "guess" for that wall time
    // This represents yyyy-mm-dd hh:mm in UTC
    const utcGuess = new Date(Date.UTC(year, (month - 1), day, hour, minute, 0));

    // Compute the timezone offset for the target zone at the guess instant
    const offset1 = getTimezoneOffset(timeZone, utcGuess); // minutes (e.g., -240 for EDT)

    // Apply the offset to get the candidate UTC instant that would display as the desired wall time
    let candidate = new Date(utcGuess.getTime() - offset1 * 60000);

    // DST-safe refinement: recompute with the candidate instant and adjust if needed
    const offset2 = getTimezoneOffset(timeZone, candidate);
    if (offset2 !== offset1) {
      candidate = new Date(utcGuess.getTime() - offset2 * 60000);
    }

    return candidate;
    
  } catch {
    return new Date();
  }
}
