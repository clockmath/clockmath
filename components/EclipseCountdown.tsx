'use client';

import { useEffect, useState } from 'react';
import { EventCountdown } from '@/components/EventCountdown';

/**
 * Greatest eclipse, 2027 Aug 2: 10:06:37 UT1 (EclipseWise, ΔT 72.8 s; NASA's
 * catalogue gives 10:06:34 with ΔT 76 s). ΔT for 2027 is a prediction, so the
 * page quotes this to the minute, never the second.
 */
export const ECLIPSE_PEAK_MS = Date.UTC(2027, 7, 2, 10, 6, 37);
/** The peak rounded to the nearest minute (10:07 UTC) — what the copy quotes, so the UTC and local times agree. */
const PEAK_DISPLAY_MS = Math.round(ECLIPSE_PEAK_MS / 60_000) * 60_000;

export default function EclipseCountdown() {
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const time = new Date(PEAK_DISPLAY_MS).toLocaleString('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
    setLocal(`${time} where you are (${tz.split('/').pop()?.replace(/_/g, ' ')})`);
  }, []);

  return (
    <div>
      <EventCountdown
        target={new Date(ECLIPSE_PEAK_MS)}
        title="the 2027 total solar eclipse"
        arrivedLabel="The 2027 eclipse has passed — the next total eclipse is July 22, 2028"
      />
      <p className="text-center text-foreground dark:text-slate-200 mt-4">
        The eclipse peaks at about <strong>10:07 UTC</strong> near Luxor, Egypt
        {local ? (
          <>
            {' '}— that&apos;s <strong>{local}</strong>.
          </>
        ) : (
          '.'
        )}{' '}
        Whether you can see it depends on where you are — check the tables below.
      </p>
    </div>
  );
}
