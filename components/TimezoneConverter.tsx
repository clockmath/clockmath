/**
 * TimezoneConverter component for ClockMath.com
 * Main timezone conversion interface with live updates
 */


'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Flap } from '@/components/station/Flap';
import { useClockFormat } from '@/hooks/use-clock-format';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { LocationTimezonePicker } from '@/components/location/LocationTimezonePicker';
import { InlineTimePicker, formatTime } from '@/components/ui/InlineTimePicker';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import {
  getUserTimeZone,
  getTimeZoneOptions,
  formatZoned,
  convertDateBetweenZones,
  zonedWallTime,
  getTimezoneOffset,
  getOffsetLabel,
  resolveTimeZone,
  getTimeZoneDisplayName,
} from '@/lib/time';
import { ArrowLeftRight, MapPin } from 'lucide-react';
import { event as gaEvent, toolUsed } from '@/lib/gtag';
import { toast } from '@/hooks/use-toast';
import { flashClass, useCalculateFeedback, useSettledChange } from '@/hooks/use-answer-feedback';

interface TimezoneConverterProps {
  className?: string;
}

// Convert between a YYYY-MM-DD string and a local Date for the date picker.
const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};
/** Today's date in a zone, "YYYY-MM-DD" */
const zoneToday = (tz: string): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: resolveTimeZone(tz, new Date()), year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const parseLocalDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
};

export function TimezoneConverter({ className = '' }: TimezoneConverterProps) {
  const toolUsedRef = useRef(false);
  const [fromTZ, setFromTZ] = useState<string>('');
  const [toTZ, setToTZ] = useState<string>('UTC');
  const [inputDate, setInputDate] = useState<string>('');
  const [inputTime, setInputTime] = useState<string>('');
  const [is24h, setIs24h] = useClockFormat();
  const hour12 = !is24h;
  const setHour12 = (v: boolean) => setIs24h(!v);
  // The picked place names, shown in the boxes and the answer. What's typed
  // is tracked apart: until Oct 2026 the answer used the typed text, so
  // "Tokyo" typed but not picked read "Tokyo is 3 hours ahead" on UTC's time.
  const [fromLocationDisplay, setFromLocationDisplay] = useState<string>('');
  const [toLocationDisplay, setToLocationDisplay] = useState<string>('UTC');
  const [fromTyped, setFromTyped] = useState<string | null>(null);
  const [toTyped, setToTyped] = useState<string | null>(null);
  const [pickNote, setPickNote] = useState<'from' | 'to' | null>(null);
  const [fromPreset, setFromPreset] = useState<{ lat: number; lon: number } | null>(null);
  // Only From has a preset (Use my location)
  const toPreset = null;
  // What was calculated: the instants and the inputs they came from. The
  // times are formatted when shown, so the answer follows the 12h/24h switch
  // (it kept the format it was calculated in), and comparing the inputs tells
  // when they've changed since (the answer used to stay up, unmarked).
  const [result, setResult] = useState<{
    sourceDate: Date;
    targetDate: Date;
    fromTZ: string;
    toTZ: string;
    fromName: string;
    toName: string;
    inputDate: string;
    inputTime: string;
    /** The typed time is one the clocks skip or pass twice (zonedWallTime) */
    clock: 'normal' | 'skipped' | 'repeated';
  } | null>(null);
  // While the date and time are still "now" (untouched since the page opened
  // or Now was pressed), they follow the From place. They had stayed on the
  // device's clock: pick Tokyo from Halifax and the field said 1:11 PM today
  // "in Tokyo", where it was already 1:11 AM tomorrow.
  const [followNow, setFollowNow] = useState(true);
  // Calculate and Swap show they worked: the answer's tiles flip again, the
  // button says "Updated", and the answer is scrolled into view
  const answerRef = useRef<HTMLDivElement>(null);
  const { round, updated, confirm } = useCalculateFeedback(answerRef);
  
  // Custom time picker state
  
  // Track if component has hydrated to prevent SSR mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  const timeZoneOptions = useMemo(() => {
    // Only compute timezone options after hydration to prevent SSR mismatch
    if (!isHydrated) return [];
    return getTimeZoneOptions();
  }, [isHydrated]);

  const displayForTZ = useCallback((tz: string) => {
    const opt = timeZoneOptions.find(o => o.id === tz);
    return opt ? opt.label.split(' (')[0] : (tz?.split('/').pop()?.replace(/_/g, ' ') || tz);
  }, [timeZoneOptions]);

  // Hydration effect - runs only on client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize with user's timezone (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    const userTZ = getUserTimeZone();
    setFromTZ(userTZ);
    // Show the detected place in the box: it read "Type a city…" while the
    // place was already set (only a small hint below said so)
    setFromLocationDisplay(getTimeZoneDisplayName(userTZ));
    
    // Set initial date/time to now (host-local, not UTC — toISOString() would
    // be a day off near midnight west of UTC).
    const now = new Date();
    setInputDate(formatLocalDate(now));
    setInputTime(now.toTimeString().slice(0, 5));
    // The 12h/24h setting is the site's shared one (useClockFormat)
  }, [isHydrated]);

  // The date and time it is now in a zone (the device's own without one)
  const setNowIn = useCallback((tz: string) => {
    const now = new Date();
    if (tz) {
      const formatted = new Intl.DateTimeFormat('sv-SE', {
        timeZone: resolveTimeZone(tz, now),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(now);
      const [dateStr, timeStr] = formatted.split(' ');
      setInputDate(dateStr);
      setInputTime(timeStr);
    } else {
      // Host-local, not UTC (toISOString() would be a day off near midnight)
      setInputDate(formatLocalDate(now));
      setInputTime(now.toTimeString().slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (followNow && fromTZ) setNowIn(fromTZ);
    // Only when the place changes: pressing Now or editing sets followNow itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTZ]);

  // Centralized calculation helper so we can reuse for swap
  const computeConversion = useCallback((from: string, to: string, opts?: { dateStr?: string; timeStr?: string; fromName?: string; toName?: string; silent?: boolean }) => {
    if (!from || !to) {
      toast({
        title: 'Select locations',
        description: 'Choose both From and To to convert.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let sourceDate: Date;
      let clock: 'normal' | 'skipped' | 'repeated' = 'normal';

      const dateStr = opts?.dateStr ?? inputDate;
      const timeStr = opts?.timeStr ?? inputTime;

      if (dateStr && timeStr) {
        const wall = zonedWallTime(dateStr, timeStr, from);
        sourceDate = wall.date;
        clock = wall.kind;
      } else {
        sourceDate = new Date();
      }

      const targetDate = convertDateBetweenZones({
        fromTZ: from,
        toTZ: to,
        at: sourceDate
      });

      setResult({
        sourceDate,
        targetDate,
        fromTZ: from,
        toTZ: to,
        fromName: opts?.fromName ?? (fromLocationDisplay || displayForTZ(from)),
        toName: opts?.toName ?? (toLocationDisplay || displayForTZ(to)),
        inputDate: dateStr,
        inputTime: timeStr,
        clock,
      });

      // The answer shown on arrival isn't a conversion anyone asked for
      if (opts?.silent) return;
      const device = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop';
      gaEvent({
        action: 'tz_convert',
        params: {
          from,
          to,
          has_custom_datetime: Boolean(dateStr && timeStr),
          is_12_hour: hour12,
          device
        }
      });
      if (!toolUsedRef.current) {
        toolUsedRef.current = true;
        toolUsed('timezone', { device });
      }
    } catch {
      setResult(null);
    }
  }, [hour12, inputDate, inputTime, fromLocationDisplay, toLocationDisplay, displayForTZ]);

  // The page opens on an answer, as the homepage does: the detected place
  // against UTC, now (it showed an empty gap under Calculate until pressed).
  // Once, when the place and time are in; Calculate does every later change.
  const shownOnArrival = useRef(false);
  useEffect(() => {
    if (shownOnArrival.current || !fromTZ || !toTZ || !inputDate || !inputTime || timeZoneOptions.length === 0) return;
    shownOnArrival.current = true;
    if (!result) computeConversion(fromTZ, toTZ, { silent: true });
  }, [fromTZ, toTZ, inputDate, inputTime, timeZoneOptions.length, result, computeConversion]);

  // Calculate conversion manually when user clicks Calculate
  // Text typed in a box but not picked from the list isn't a place yet:
  // ask for a pick rather than answer for the box's old place
  const handleCalculate = useCallback(() => {
    if (fromTyped !== null && fromTyped.trim() !== fromLocationDisplay) return setPickNote('from');
    if (toTyped !== null && toTyped.trim() !== toLocationDisplay) return setPickNote('to');
    setPickNote(null);
    computeConversion(fromTZ, toTZ);
    confirm();
  }, [computeConversion, fromTZ, toTZ, fromTyped, toTyped, fromLocationDisplay, toLocationDisplay, confirm]);

  // Enter in a field submits; a time typed and entered in the same keystroke
  // reaches state in that event, so the calculation runs in an effect
  const [submits, setSubmits] = useState(0);
  useEffect(() => {
    if (submits) handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submits]);

  const stale =
    !!result &&
    (result.fromTZ !== fromTZ || result.toTZ !== toTZ || result.inputDate !== inputDate || result.inputTime !== inputTime);

  // Oct 2026 review: a new place or time left the old answer up with "Press
  // Calculate for the new answer". The answer now follows the inputs once
  // they settle; a place typed but not yet picked from the list still waits.
  // Calculate stays, for Enter and its scroll-to-the-answer feedback.
  const pendingPick =
    (fromTyped !== null && fromTyped.trim() !== fromLocationDisplay) ||
    (toTyped !== null && toTyped.trim() !== toLocationDisplay);
  useEffect(() => {
    if (!stale || pendingPick || !fromTZ || !toTZ) return;
    const id = setTimeout(() => computeConversion(fromTZ, toTZ), 350);
    return () => clearTimeout(id);
  }, [stale, pendingPick, fromTZ, toTZ, computeConversion]);
  const answerFlash = useSettledChange(result ? `${result.fromTZ}|${result.toTZ}|${result.inputDate}|${result.inputTime}` : '');


  const handleSwapTimezones = () => {
    if (!fromTZ || !toTZ) {
      toast({
        title: 'Select locations',
        description: 'Choose both From and To before swapping.',
        variant: 'destructive',
      });
      return;
    }
    // Swap timezone values
    const newFrom = toTZ;
    const newTo = fromTZ;
    setFromTZ(newFrom);
    setToTZ(newTo);
    
    // The picked names swap with their zones
    const newFromName = toLocationDisplay || displayForTZ(newFrom);
    const newToName = fromLocationDisplay || displayForTZ(newTo);
    setFromLocationDisplay(newFromName);
    setToLocationDisplay(newToName);
    setFromTyped(null);
    setToTyped(null);
    setPickNote(null);
    
    // Do NOT swap presets; presets represent pinned sources (like geolocation)
    // Swapping them causes auto-resolve effects to override selections.
    
    // If we have a current result, its target time becomes the new input
    // time; if the inputs have changed since, the new inputs win
    if (result && !stale) {
      try {
        const fmt = new Intl.DateTimeFormat('sv-SE', {
          timeZone: resolveTimeZone(newFrom, result.targetDate),
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23', // hour12: false can read midnight as "24:05"
        });
        const formatted = fmt.format(result.targetDate);
        const [dateStr, timeStr] = formatted.split(' ');
        setInputDate(dateStr);
        setInputTime(timeStr);
        // Recompute using the swapped zones and the carried-over time
        computeConversion(newFrom, newTo, { dateStr, timeStr, fromName: newFromName, toName: newToName });
      } catch {
        computeConversion(newFrom, newTo, { fromName: newFromName, toName: newToName });
      }
    } else {
      // No prior result, recompute with existing inputs
      computeConversion(newFrom, newTo, { fromName: newFromName, toName: newToName });
    }

    confirm();
    gaEvent({
      action: 'tz_swap_clicked',
      params: { device: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop' }
    });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation unsupported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setFromPreset({ lat: latitude, lon: longitude });
          // Note: LocationTimezonePicker will compute IANA and call setFromTZ via onTimezoneResolved

          gaEvent({
            action: 'tz_geolocation_used',
            params: { device: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop' }
          });
        } catch {
          toast({
            title: 'Location error',
            description: 'Error processing your location.',
            variant: 'destructive',
          });
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast({
              title: 'Location access denied',
              description: 'Enable location permissions and try again. Tip: refresh and click Allow when prompted.',
              variant: 'destructive',
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toast({
              title: 'Location unavailable',
              description: 'Location could not be determined. If on HTTP, try HTTPS.',
              variant: 'destructive',
            });
            break;
          case error.TIMEOUT:
            toast({
              title: 'Location timeout',
              description: 'Location request timed out. Please try again.',
              variant: 'destructive',
            });
            break;
          default:
            toast({
              title: 'Location error',
              description: 'An unknown error occurred while retrieving your location.',
              variant: 'destructive',
            });
            break;
        }
      },
      {
        // A time zone needs a rough position, not GPS: faster, less battery
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
      }
    );
  };

  const handleNowClick = () => {
    setNowIn(fromTZ);
    setFollowNow(true);
    
    gaEvent({
      action: 'tz_now_clicked',
      params: { device: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop' }
    });
  };



  const getFromZoneDisplayName = () => {
    // Prefer the user's chosen place label if available
    if (fromLocationDisplay) return fromLocationDisplay;
    const option = timeZoneOptions.find(opt => opt.id === fromTZ);
    return option ? option.label.split(' (')[0] : fromTZ;
  };



  const getTimeDifference = () => {
    if (!result) return null;
    
    const fromOffset = getTimezoneOffset(result.fromTZ, result.targetDate);
    const toOffset = getTimezoneOffset(result.toTZ, result.targetDate);
    const diffMinutes = toOffset - fromOffset;
    const diffHours = diffMinutes / 60;
    
    // A full sentence: "3 hours ahead" alone never said who was ahead.
    const from = result.fromName;
    const to = result.toName;
    if (diffHours === 0) {
      return `${to} and ${from} are on the same time`;
    }
    const hours = Math.floor(Math.abs(diffHours));
    const minutes = Math.abs(diffMinutes) % 60;
    const amount = minutes === 0
      ? `${hours} hour${hours !== 1 ? 's' : ''}`
      : `${hours}h ${minutes}m`;
    return `${to} is ${amount} ${diffHours > 0 ? 'ahead of' : 'behind'} ${from}`;
  };

  return (
    <div className={`st-panel relative z-20 bg-card dark:bg-card rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-border/50 dark:border-border/50 hover:shadow-md transition-all duration-300 ${className}`}>
      {/* The places and the time, as a form: Enter calculates, as on the homepage */}
      <form
        className="grid gap-4 sm:gap-6 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
      >
        {/* From, swap, To: the swap sits between the two boxes (it was inside
            the To box on phones, over the text, at 32px) */}
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:items-start">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <label htmlFor="from-location" className="block text-xs sm:text-sm font-semibold text-foreground dark:text-foreground">
                From location
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="st-hit flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <MapPin className="w-3 h-3" aria-hidden="true" />
                Use my location
              </button>
            </div>
            <LocationTimezonePicker
              label=""
              searchLabel="From: city or place"
              onTimezoneResolved={(tz, placeName) => {
                setFromTZ(tz);
                if (placeName) setFromLocationDisplay(placeName);
                setFromTyped(null);
                if (pickNote === 'from') setPickNote(null);
              }}
              onDisplayChange={(displayText) => setFromTyped(displayText)}
              defaultHint={isHydrated ? `Auto-detected: ${getUserTimeZone()}` : "Auto-detecting timezone..."}
              value={fromLocationDisplay}
              preset={fromPreset}
              timeZone={fromTZ}
              id="from-location"
              name="fromLocation"
            />
            {pickNote === 'from' && (
              <p role="status" className="text-sm text-red-700 dark:text-red-300 m-0">
                Pick a place from the list, or press Enter to take the first one.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSwapTimezones}
            aria-label="Swap From and To"
            title="Swap From and To"
            // spacing-audit: allow (centres it on the 64px inputs: 32px label row + (64 - 44) / 2; mt-9 sat 6px high)
            className="justify-self-center sm:mt-10.5 w-11 h-11 grid place-items-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 rotate-90 sm:rotate-0" aria-hidden="true" />
          </button>

          <div className="space-y-3 min-w-0">
            <label htmlFor="to-location" className="block text-xs sm:text-sm font-semibold text-foreground dark:text-foreground">
              To location
            </label>
            <LocationTimezonePicker
              label=""
              searchLabel="To: city or place"
              onTimezoneResolved={(tz, placeName) => {
                setToTZ(tz);
                if (placeName) setToLocationDisplay(placeName);
                setToTyped(null);
                if (pickNote === 'to') setPickNote(null);
              }}
              onDisplayChange={(displayText) => setToTyped(displayText)}
              defaultHint="Search for a city..."
              value={toLocationDisplay}
              preset={toPreset}
              timeZone={toTZ}
              id="to-location"
              name="toLocation"
            />
            {pickNote === 'to' && (
              <p role="status" className="text-sm text-red-700 dark:text-red-300 m-0">
                Pick a place from the list, or press Enter to take the first one.
              </p>
            )}
          </div>
        </div>

        {/* Manual Timezone Fallback */}
        <details className="group">
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced: choose the time zone yourself
          </summary>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 sm:gap-6 p-4 bg-muted/30 dark:bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">From time zone</label>
              <SearchableSelect
                value={fromTZ}
                onChange={(tz) => {
                  setFromTZ(tz);
                  setFromLocationDisplay(displayForTZ(tz));
                  setFromTyped(null);
                }}
                options={timeZoneOptions}
                placeholder="Select a time zone…"
                ariaLabel="Select source timezone"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">To time zone</label>
              <SearchableSelect
                value={toTZ}
                onChange={(tz) => {
                  setToTZ(tz);
                  setToLocationDisplay(displayForTZ(tz));
                  setToTyped(null);
                }}
                options={timeZoneOptions}
                placeholder="Select a time zone…"
                ariaLabel="Select target timezone"
              />
            </div>
          </div>
        </details>

        {/* Date/Time Input - moved closer to location inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground dark:text-foreground">
              Date and time{getFromZoneDisplayName() ? ` (in ${getFromZoneDisplayName()})` : ''}
            </h2>
            {/* The shared 12h/24h switch beside Now (it had a toolbar row of
                its own at the top of the card) */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-muted/50 dark:bg-muted/50 rounded-lg p-1 flex items-center gap-1" role="group" aria-label="Clock format">
                {([true, false] as const).map((twelve) => (
                  <button
                    key={String(twelve)}
                    type="button"
                    onClick={() => setHour12(twelve)}
                    aria-pressed={hour12 === twelve}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                      hour12 === twelve
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {twelve ? '12h' : '24h'}
                  </button>
                ))}
              </div>
              <button type="button" className="st-now" onClick={handleNowClick} aria-label="Set the date and time to now">
                Now
              </button>
            </div>
          </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="tz-date" className="block text-xs text-muted-foreground">
              Date
            </label>
            <InlineDatePicker
              id="tz-date"
              ariaLabel="Date"
              value={inputDate ? parseLocalDate(inputDate) : new Date()}
              onChange={(date) => {
                setInputDate(formatLocalDate(date));
                setFollowNow(false);
              }}
              placeholder="Select date"
              startOnCalendar
              // "Today" and "Tomorrow" are the device's days: when it's
              // already another day in the From place, the date itself
              relative={!fromTZ || fromTZ === getUserTimeZone() || zoneToday(fromTZ) === formatLocalDate(new Date())}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tz-time" className="block text-xs text-muted-foreground">
              Time
            </label>
            <InlineTimePicker
              id="tz-time"
              ariaLabel="Time"
              value={inputTime && inputTime.trim() ? `${inputTime.trim()}:00` : "09:00:00"}
              onChange={(timeStr) => {
                // timeStr comes in as "HH:mm:ss" format, extract just "HH:mm"
                const [hour, minute] = timeStr.split(':');
                const formattedTime = `${hour}:${minute}`;
                setInputTime(formattedTime);
                setFollowNow(false);
              }}
              is24h={!hour12}
              placeholder={hour12 ? "9:00 AM" : "09:00"}
            />
          </div>
        </div>

          {/* Calculate Button */}
          <div className="mt-6 text-center">
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              {updated ? 'Updated' : 'Calculate'}
            </button>
            <span className="sr-only" role="status">{updated ? 'Answer updated' : ''}</span>
            {stale && pendingPick && (
              <p className="mt-3 mb-0 text-sm text-foreground">Pick a place from the list for the new answer.</p>
            )}
          </div>
        </div>
      </form>

      {/* Conversion Result: the time over there is the answer, so it goes on
          the line's board; the difference in words, and your own time, beside
          it. Formatted here, so it follows the 12h/24h switch; faded while a
          change settles or a typed place waits to be picked. */}
      {result && (() => {
        const to = formatZoned(result.targetDate, result.toTZ, { hour12 });
        const from = formatZoned(result.sourceDate, result.fromTZ, { hour12 });
        const m = to.time.match(/^(\d+):(\d+)\s*(.*)$/);
        return (
          <div ref={answerRef} className={`st-answer st-tz-answer${stale ? ' stale' : ''}${flashClass(answerFlash)}`} aria-live="polite">
            <div>
              <p className="st-tz-place">{result.toName}</p>
              <p key={round} className="st-big st-tz-time">
                {/* "12:00 PM": the hours and minutes on tiles, AM/PM beside them */}
                {m ? (
                  <>
                    <Flap value={m[1]} />
                    <span className="st-tz-colon">:</span>
                    <Flap value={m[2]} />
                    {m[3] && <span className="u">{m[3]}</span>}
                  </>
                ) : (
                  to.time
                )}
              </p>
              <p className="st-tz-date">
                {to.weekday}, {to.date} ({getOffsetLabel(result.toTZ, result.targetDate)})
              </p>
            </div>
            <div>
              <p className="st-tz-diff">{getTimeDifference()}.</p>
              <dl className="st-also st-tz-from">
                <div>
                  <dt>{result.fromName}</dt>
                  <dd>{from.time}</dd>
                </div>
              </dl>
              <p className="st-note">
                {from.weekday}, {from.date} ({getOffsetLabel(result.fromTZ, result.targetDate)})
              </p>
              {result.clock !== 'normal' && (() => {
                const [h, mm] = result.inputTime.split(':').map(Number);
                const typed = formatTime(h * 60 + mm, !hour12);
                return (
                  <p className="st-note st-tz-clock-note">
                    {result.clock === 'skipped'
                      ? `${typed} doesn't happen in ${result.fromName} that day: the clocks jump forward past it, so this uses ${from.time}.`
                      : `${typed} happens twice in ${result.fromName} that day, as the clocks go back. This is the first one, before the change.`}
                  </p>
                );
              })()}
            </div>
          </div>
        );
      })()}


    </div>
  );
}
