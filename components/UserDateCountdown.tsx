'use client';

import { useState, useEffect, useCallback } from 'react';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { StationBoard } from '@/components/station/StationBoard';
import { event as gaEvent } from '@/lib/gtag';
import { storageGet, storageSet } from '@/lib/safeStorage';
import { getDevice } from '@/lib/device';


interface UserDateCountdownProps {
  /** localStorage key used to remember the user's chosen date. */
  storageKey: string;
  /** Title shown inside the timer ("Until {title}"). */
  title: string;
  /** Heading shown once the date arrives. */
  arrivedLabel?: string;
  /** Label above the date picker. */
  prompt?: string;
  /** Years from today used as the default date until the user picks one. */
  defaultYearsAhead?: number;
}

// Interactive countdown where the visitor supplies their own target date
// (e.g. a retirement countdown). The choice persists in localStorage.
export function UserDateCountdown({
  storageKey,
  title,
  arrivedLabel,
  prompt = 'Choose your date',
  defaultYearsAhead = 10,
}: UserDateCountdownProps) {
  const [date, setDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: Date | null = null;
    const saved = storageGet(storageKey);
    if (saved) {
      const ms = parseInt(saved, 10);
      if (!Number.isNaN(ms)) initial = new Date(ms);
    }
    if (!initial) {
      const now = new Date();
      initial = new Date(now.getFullYear() + defaultYearsAhead, now.getMonth(), now.getDate());
    }
    setDate(initial);
    setMounted(true);
  }, [storageKey, defaultYearsAhead]);

  const handleChange = useCallback(
    (d: Date) => {
      setDate(d);
      storageSet(storageKey, String(d.getTime()));
      // Fires only on a real user selection (not the initial default load).
      gaEvent({
        action: 'user_date_set',
        params: { device: getDevice(), page: typeof window !== 'undefined' ? window.location.pathname : '' },
      });
    },
    [storageKey],
  );

  return (
    <div>
      <div className="st-picker">
        <span>{prompt}</span>
        <div className="st-picker-field">
          {mounted && date && (
            <InlineDatePicker ariaLabel="Your date" value={date} onChange={handleChange} placeholder="Select your date" startOnCalendar />
          )}
        </div>
        <p>Your date is saved on this device only.</p>
      </div>

      {/* Keyed on the date so a new pick resolves a fresh target */}
      {mounted && date && <StationBoard key={date.getTime()} target={date} title={title} arrivedLabel={arrivedLabel} />}
    </div>
  );
}
