/**
 * Stock market hours data and status engine for ClockMath.com
 *
 * A static catalog of major exchanges plus pure functions that compute
 * open/closed status and the next open/close instant. All session times are
 * defined in the exchange's own timezone and converted to UTC instants with
 * the DST-safe helpers in lib/time.ts, so US/EU DST divergence weeks and
 * half-day holidays come out right automatically.
 *
 * Maintenance note: exchange hours occasionally change (e.g. Tokyo extended
 * its close from 15:00 to 15:30 in Nov 2024) and holiday calendars are
 * published annually — sanity-check this file once a year. Holiday data is
 * currently curated for NYSE/NASDAQ and LSE through 2027; other exchanges
 * show regular hours only (flagged via `holidays` being undefined).
 */

import { parseDateTimeInZone } from '@/lib/time';

export interface MarketSession {
  /** Session open, HH:MM in the exchange's local time */
  open: string;
  /** Session close, HH:MM in the exchange's local time */
  close: string;
}

export interface MarketHoliday {
  /** YYYY-MM-DD in the exchange's local calendar */
  date: string;
  name: string;
  /** Shortened trading day — the market closes at `halfDayClose` instead */
  halfDay?: boolean;
}

export interface Market {
  id: string;
  name: string;
  shortName: string;
  city: string;
  flag: string;
  /** IANA timezone of the exchange */
  timezone: string;
  /**
   * Regular trading sessions in exchange-local time. Multiple segments model
   * the lunch break on Asian exchanges (e.g. Tokyo 09:00–11:30 / 12:30–15:30).
   */
  sessions: MarketSession[];
  /** Retail-relevant extended trading (US exchanges only in v1) */
  extendedHours?: { preOpen: string; afterClose: string };
  /** Local close time on half-day holidays (e.g. '13:00' for NYSE) */
  halfDayClose?: string;
  /**
   * Full and half-day closures, exchange-local dates. Undefined means holiday
   * data is not curated for this exchange — status assumes regular weekdays
   * and the UI shows a "regular hours only" disclaimer.
   */
  holidays?: MarketHoliday[];
}

// NYSE and NASDAQ share the same calendar (published by NYSE annually).
const US_MARKET_HOLIDAYS: MarketHoliday[] = [
  // 2026
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
  { date: '2026-02-16', name: "Washington's Birthday" },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving Day' },
  { date: '2026-11-27', name: 'Day after Thanksgiving', halfDay: true },
  { date: '2026-12-24', name: 'Christmas Eve', halfDay: true },
  { date: '2026-12-25', name: 'Christmas Day' },
  // 2027
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-01-18', name: 'Martin Luther King Jr. Day' },
  { date: '2027-02-15', name: "Washington's Birthday" },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-05-31', name: 'Memorial Day' },
  { date: '2027-06-18', name: 'Juneteenth (observed)' },
  { date: '2027-07-05', name: 'Independence Day (observed)' },
  { date: '2027-09-06', name: 'Labor Day' },
  { date: '2027-11-25', name: 'Thanksgiving Day' },
  { date: '2027-11-26', name: 'Day after Thanksgiving', halfDay: true },
  { date: '2027-12-24', name: 'Christmas Day (observed)' },
];

const LSE_HOLIDAYS: MarketHoliday[] = [
  // 2026
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-06', name: 'Easter Monday' },
  { date: '2026-05-04', name: 'Early May Bank Holiday' },
  { date: '2026-05-25', name: 'Spring Bank Holiday' },
  { date: '2026-08-31', name: 'Summer Bank Holiday' },
  { date: '2026-12-24', name: 'Christmas Eve', halfDay: true },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-28', name: 'Boxing Day (observed)' },
  { date: '2026-12-31', name: "New Year's Eve", halfDay: true },
  // 2027
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-03-29', name: 'Easter Monday' },
  { date: '2027-05-03', name: 'Early May Bank Holiday' },
  { date: '2027-05-31', name: 'Spring Bank Holiday' },
  { date: '2027-08-30', name: 'Summer Bank Holiday' },
  { date: '2027-12-24', name: 'Christmas Eve', halfDay: true },
  { date: '2027-12-27', name: 'Christmas Day (observed)' },
  { date: '2027-12-28', name: 'Boxing Day (observed)' },
  { date: '2027-12-31', name: "New Year's Eve", halfDay: true },
];

export const MARKETS: Market[] = [
  {
    id: 'nyse',
    name: 'New York Stock Exchange',
    shortName: 'NYSE',
    city: 'New York',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    sessions: [{ open: '09:30', close: '16:00' }],
    extendedHours: { preOpen: '04:00', afterClose: '20:00' },
    halfDayClose: '13:00',
    holidays: US_MARKET_HOLIDAYS,
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    shortName: 'NASDAQ',
    city: 'New York',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    sessions: [{ open: '09:30', close: '16:00' }],
    extendedHours: { preOpen: '04:00', afterClose: '20:00' },
    halfDayClose: '13:00',
    holidays: US_MARKET_HOLIDAYS,
  },
  {
    id: 'tsx',
    name: 'Toronto Stock Exchange',
    shortName: 'TSX',
    city: 'Toronto',
    flag: '🇨🇦',
    timezone: 'America/Toronto',
    sessions: [{ open: '09:30', close: '16:00' }],
  },
  {
    id: 'lse',
    name: 'London Stock Exchange',
    shortName: 'LSE',
    city: 'London',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    sessions: [{ open: '08:00', close: '16:30' }],
    halfDayClose: '12:30',
    holidays: LSE_HOLIDAYS,
  },
  {
    id: 'euronext',
    name: 'Euronext Paris',
    shortName: 'Euronext',
    city: 'Paris',
    flag: '🇫🇷',
    timezone: 'Europe/Paris',
    sessions: [{ open: '09:00', close: '17:30' }],
  },
  {
    id: 'xetra',
    name: 'Deutsche Börse Xetra',
    shortName: 'Xetra',
    city: 'Frankfurt',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    sessions: [{ open: '09:00', close: '17:30' }],
  },
  {
    id: 'jpx',
    name: 'Tokyo Stock Exchange',
    shortName: 'TSE',
    city: 'Tokyo',
    flag: '🇯🇵',
    timezone: 'Asia/Tokyo',
    sessions: [
      { open: '09:00', close: '11:30' },
      { open: '12:30', close: '15:30' },
    ],
  },
  {
    id: 'hkex',
    name: 'Hong Kong Stock Exchange',
    shortName: 'HKEX',
    city: 'Hong Kong',
    flag: '🇭🇰',
    timezone: 'Asia/Hong_Kong',
    sessions: [
      { open: '09:30', close: '12:00' },
      { open: '13:00', close: '16:00' },
    ],
  },
  {
    id: 'sse',
    name: 'Shanghai Stock Exchange',
    shortName: 'SSE',
    city: 'Shanghai',
    flag: '🇨🇳',
    timezone: 'Asia/Shanghai',
    sessions: [
      { open: '09:30', close: '11:30' },
      { open: '13:00', close: '15:00' },
    ],
  },
  {
    id: 'asx',
    name: 'Australian Securities Exchange',
    shortName: 'ASX',
    city: 'Sydney',
    flag: '🇦🇺',
    timezone: 'Australia/Sydney',
    sessions: [{ open: '10:00', close: '16:00' }],
  },
];

export type MarketState =
  | 'open'
  | 'pre-market'
  | 'lunch'
  | 'after-hours'
  | 'closed';

export interface SessionInstants {
  openUtc: Date;
  closeUtc: Date;
}

export interface MarketStatus {
  state: MarketState;
  /** The instant the state meaningfully changes (open → close, closed → open, …) */
  nextTransition: Date;
  nextTransitionLabel: 'opens' | 'closes' | 'resumes';
  /** Why the market is closed today, when it's a holiday closure */
  holidayName?: string;
  /** Today is a shortened trading day */
  isHalfDay?: boolean;
  /**
   * The trading day's sessions as UTC instants — today's if the market trades
   * today, otherwise the next trading day's (what the "opens" countdown points
   * at). Format these in the visitor's timezone for display.
   */
  sessions: SessionInstants[];
  /** Exchange-local date (YYYY-MM-DD) the `sessions` above belong to */
  sessionsDate: string;
}

/** YYYY-MM-DD of `date` as observed in `timeZone` (en-CA locale gives ISO order) */
export function getLocalDateInZone(timeZone: string, date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function isWeekendInZone(timeZone: string, date: Date): boolean {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    }).format(date);
    return weekday === 'Sat' || weekday === 'Sun';
  } catch {
    return false;
  }
}

function findHoliday(market: Market, localDate: string): MarketHoliday | undefined {
  return market.holidays?.find((h) => h.date === localDate);
}

/**
 * The market's trading sessions for a given exchange-local date as UTC
 * instants. Empty when the market doesn't trade that day (weekend or full
 * holiday). Half days truncate at `halfDayClose` and drop any session that
 * would start after the early close.
 */
export function getSessionsForLocalDate(
  market: Market,
  localDate: string,
  probe: Date,
): SessionInstants[] {
  if (isWeekendInZone(market.timezone, probe)) return [];

  const holiday = findHoliday(market, localDate);
  if (holiday && !holiday.halfDay) return [];

  const earlyClose = holiday?.halfDay ? market.halfDayClose : undefined;

  const sessions: SessionInstants[] = [];
  for (const s of market.sessions) {
    let close = s.close;
    if (earlyClose) {
      if (s.open >= earlyClose) continue; // session entirely after the early close
      if (close > earlyClose) close = earlyClose;
    }
    sessions.push({
      openUtc: parseDateTimeInZone(localDate, s.open, market.timezone),
      closeUtc: parseDateTimeInZone(localDate, close, market.timezone),
    });
  }
  return sessions;
}

/**
 * Scan forward (up to `maxDays`) for the next trading day's sessions.
 * Returns null only if the catalog data is somehow empty.
 */
function findNextTradingSessions(
  market: Market,
  fromDay: Date,
  maxDays = 15,
): { sessions: SessionInstants[]; localDate: string } | null {
  for (let i = 1; i <= maxDays; i++) {
    const probe = new Date(fromDay.getTime() + i * 24 * 60 * 60 * 1000);
    const localDate = getLocalDateInZone(market.timezone, probe);
    const sessions = getSessionsForLocalDate(market, localDate, probe);
    if (sessions.length > 0) return { sessions, localDate };
  }
  return null;
}

/**
 * Compute the market's live status at `now`. Pure — no clock reads — so it is
 * driven entirely by the caller's tick.
 */
export function getMarketStatus(market: Market, now: Date): MarketStatus {
  const localDate = getLocalDateInZone(market.timezone, now);
  const holiday = findHoliday(market, localDate);
  const todaySessions = getSessionsForLocalDate(market, localDate, now);
  const isHalfDay = Boolean(holiday?.halfDay && todaySessions.length > 0);

  const closedStatus = (holidayName?: string): MarketStatus => {
    const next = findNextTradingSessions(market, now);
    // Data should make this unreachable; fall back to a day out so the UI
    // renders something sane rather than crashing.
    const nextSessions = next?.sessions ?? [];
    const nextOpen =
      nextSessions[0]?.openUtc ?? new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      state: 'closed',
      nextTransition: nextOpen,
      nextTransitionLabel: 'opens',
      holidayName,
      sessions: nextSessions,
      sessionsDate: next?.localDate ?? localDate,
    };
  };

  if (todaySessions.length === 0) {
    // Weekend or full holiday. Only surface the holiday name on a holiday.
    return closedStatus(holiday && !holiday.halfDay ? holiday.name : undefined);
  }

  const base = { holidayName: undefined, isHalfDay, sessions: todaySessions, sessionsDate: localDate };
  const first = todaySessions[0];

  // Inside a session → open (closes at that session's close)
  for (const s of todaySessions) {
    if (now >= s.openUtc && now < s.closeUtc) {
      return { ...base, state: 'open', nextTransition: s.closeUtc, nextTransitionLabel: 'closes' };
    }
  }

  // Between two sessions on the same day → lunch break
  for (let i = 0; i < todaySessions.length - 1; i++) {
    if (now >= todaySessions[i].closeUtc && now < todaySessions[i + 1].openUtc) {
      return {
        ...base,
        state: 'lunch',
        nextTransition: todaySessions[i + 1].openUtc,
        nextTransitionLabel: 'resumes',
      };
    }
  }

  // Before today's first open (pre-market runs normally on half days too)
  if (now < first.openUtc) {
    if (market.extendedHours) {
      const preOpen = parseDateTimeInZone(localDate, market.extendedHours.preOpen, market.timezone);
      if (now >= preOpen) {
        return { ...base, state: 'pre-market', nextTransition: first.openUtc, nextTransitionLabel: 'opens' };
      }
    }
    return { ...base, state: 'closed', nextTransition: first.openUtc, nextTransitionLabel: 'opens' };
  }

  // After today's last close: extended after-hours still counts down to the
  // next regular open (that's the number people want), and the displayed
  // sessions switch to the day being counted down to — today's are over.
  const next = findNextTradingSessions(market, now);
  const nextOpen = next?.sessions[0]?.openUtc ?? new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const afterCloseBase = {
    ...base,
    sessions: next?.sessions ?? todaySessions,
    sessionsDate: next?.localDate ?? localDate,
  };
  if (market.extendedHours && !isHalfDay) {
    const afterClose = parseDateTimeInZone(localDate, market.extendedHours.afterClose, market.timezone);
    if (now < afterClose) {
      return { ...afterCloseBase, state: 'after-hours', nextTransition: nextOpen, nextTransitionLabel: 'opens' };
    }
  }
  return { ...afterCloseBase, state: 'closed', nextTransition: nextOpen, nextTransitionLabel: 'opens' };
}

/** Human label for a market state (single source for the UI badges) */
export function getStateLabel(state: MarketState): string {
  switch (state) {
    case 'open':
      return 'Open';
    case 'pre-market':
      return 'Pre-market';
    case 'lunch':
      return 'Lunch break';
    case 'after-hours':
      return 'After-hours';
    case 'closed':
      return 'Closed';
  }
}

/** "2h 14m" / "14m 30s" countdown text to a future instant */
export function formatCountdown(to: Date, now: Date): string {
  let totalSeconds = Math.max(0, Math.floor((to.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds -= days * 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds -= hours * 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
