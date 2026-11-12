'use client';

import { useEffect, useState } from 'react';
import StackedTable from '@/components/StackedTable';
import { SEASON_STARTS, momentIn, type SeasonKind } from '@/lib/seasons';

// Cities that straddle the date line of the moment: in 2027 the equinox is
// on Mar 20 from Hawaii to Moscow and Mar 21 from Dubai east.
const PLACES = [
  { place: 'Los Angeles', zone: 'America/Los_Angeles' },
  { place: 'Chicago', zone: 'America/Chicago' },
  { place: 'New York, Toronto', zone: 'America/New_York' },
  { place: 'London', zone: 'Europe/London' },
  { place: 'Paris, Berlin', zone: 'Europe/Paris' },
  { place: 'Dubai', zone: 'Asia/Dubai' },
  { place: 'India', zone: 'Asia/Kolkata' },
  { place: 'Beijing, Singapore', zone: 'Asia/Shanghai' },
  { place: 'Tokyo', zone: 'Asia/Tokyo' },
  { place: 'Sydney', zone: 'Australia/Sydney' },
];

/** The visitor's zone after mount, if it isn't one of the listed ones. */
function useVisitorZone() {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (z && !PLACES.some((p) => p.zone === z)) setZone(z);
  }, []);
  return zone;
}

const cardClass = 'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6';

export default function SeasonTables({ kind, at, name }: { kind: SeasonKind; at: number; name: string }) {
  const zone = useVisitorZone();
  const year = new Date(at).getUTCFullYear();
  const places = [...(zone ? [{ place: 'Your time', zone }] : []), ...PLACES];
  const rows = places.map((p) => ({ place: p.place, when: momentIn(at, p.zone) }));
  const years = SEASON_STARTS[kind].map((ms) => ({
    place: String(new Date(ms).getUTCFullYear()),
    utc: momentIn(ms, 'UTC'),
    ny: momentIn(ms, 'America/New_York'),
  }));

  return (
    <>
      <section className={cardClass}>
        <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-3">
          When {name} {year} starts around the world
        </h2>
        <p className="text-muted-foreground dark:text-slate-400 mb-3">
          The {kind === 'spring' ? 'equinox' : 'solstice'} is one moment for the whole planet, so its local date and time
          depend on your timezone.
        </p>
        <StackedTable rows={rows} columns={[{ key: 'when', header: 'Local date and time' }]} />
      </section>
      <section className={cardClass}>
        <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-3">
          First day of {name}, {years[0].place} to {years[years.length - 1].place}
        </h2>
        <StackedTable
          rows={years}
          firstHeader="Year"
          stack="lines"
          columns={[
            { key: 'utc', header: 'UTC', mobileLabel: 'UTC:' },
            { key: 'ny', header: 'New York time', mobileLabel: 'New York:' },
          ]}
        />
        <p className="text-muted-foreground dark:text-slate-400 text-sm mt-3">
          Source: US Naval Observatory, via the National Weather Service and Natural Resources Canada.
        </p>
      </section>
    </>
  );
}
