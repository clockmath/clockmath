'use client';

import { useState, useEffect, useCallback } from 'react';
import { InlineDatePicker } from '@/components/ui/InlineDatePicker';
import { EventCountdown } from '@/components/EventCountdown';
import { event as gaEvent } from '@/lib/gtag';

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
    ? 'mobile'
    : 'desktop';

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
    const saved = localStorage.getItem(storageKey);
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
      localStorage.setItem(storageKey, String(d.getTime()));
      // Fires only on a real user selection (not the initial default load).
      gaEvent({
        action: 'user_date_set',
        params: { device: getDevice(), page: typeof window !== 'undefined' ? window.location.pathname : '' },
      });
    },
    [storageKey],
  );

  return (
    <div className="space-y-4">
      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50">
        <label className="block text-sm font-medium text-foreground mb-2">{prompt}</label>
        {mounted && date && (
          <InlineDatePicker value={date} onChange={handleChange} placeholder="Select your date" startOnCalendar />
        )}
        <p className="text-xs text-muted-foreground mt-2">Your date is saved on this device only.</p>
      </div>

      {mounted && date && <EventCountdown target={date} title={title} arrivedLabel={arrivedLabel} />}
    </div>
  );
}
