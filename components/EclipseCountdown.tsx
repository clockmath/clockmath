'use client';

import { useEffect, useState } from 'react';
import { StationBoard } from '@/components/station/StationBoard';

/**
 * Countdown to an eclipse's greatest eclipse, plus that moment in the
 * visitor's own timezone. Peak times come from NASA's catalogue / EclipseWise;
 * ΔT is a prediction for future years, so pages quote the peak to the minute —
 * the local time shown here is rounded the same way so the two always agree.
 */
export interface EclipseCountdownProps {
  /** Greatest eclipse, UT (ms). */
  peakMs: number;
  /** Timer title, e.g. "the 2027 total solar eclipse". */
  title: string;
  arrivedLabel: string;
  /** Where greatest eclipse falls, e.g. "near Luxor, Egypt". */
  where: string;
}

export default function EclipseCountdown({ peakMs, title, arrivedLabel, where }: EclipseCountdownProps) {
  const peakDisplayMs = Math.round(peakMs / 60_000) * 60_000;
  const utcLabel = new Date(peakDisplayMs).toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const time = new Date(peakDisplayMs).toLocaleString('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
    setLocal(`${time} where you are (${tz.split('/').pop()?.replace(/_/g, ' ')})`);
  }, [peakDisplayMs]);

  return (
    <StationBoard target={new Date(peakMs)} title={title} arrivedLabel={arrivedLabel}>
      The eclipse peaks at about <strong>{utcLabel} UTC</strong> {where}
      {local ? (
        <>
          {' '}— that&apos;s <strong>{local}</strong>.
        </>
      ) : (
        '.'
      )}{' '}
      Whether you can see it depends on where you are — check the tables below.
    </StationBoard>
  );
}
