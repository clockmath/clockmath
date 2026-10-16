'use client';

import { useEffect, useState } from 'react';
import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';
import StackedTable from '@/components/StackedTable';

// Single source of truth for the release date — easy to update if it slips
// again (Nov 19, 2026, local midnight).
const GTA6_RELEASE = new Date(2026, 10, 19);

// Rolling unlock: midnight on Nov 19 in each region, per the PlayStation
// Store listing (reported by PCGamesN, Sep 21 2026). A region with several
// timezones unlocks when its earliest one reaches midnight, so the whole US
// goes with Eastern. Not confirmed by Rockstar; recheck before launch.
const UNLOCKS = [
  { place: 'New Zealand', utc: '2026-11-18T11:00Z', local: 'Midnight, Nov 19' },
  { place: 'Australia', note: 'Sydney, Melbourne; Brisbane 11 PM, Perth 9 PM Nov 18', utc: '2026-11-18T13:00Z', local: 'Midnight, Nov 19' },
  { place: 'Japan and South Korea', utc: '2026-11-18T15:00Z', local: 'Midnight, Nov 19' },
  { place: 'India', utc: '2026-11-18T18:30Z', local: 'Midnight, Nov 19' },
  { place: 'Central Europe', note: 'Paris, Berlin, Madrid, Rome', utc: '2026-11-18T23:00Z', local: 'Midnight, Nov 19' },
  { place: 'UK and Ireland', utc: '2026-11-19T00:00Z', local: 'Midnight, Nov 19' },
  { place: 'United States', note: 'All states, with Eastern', utc: '2026-11-19T05:00Z', local: 'Midnight ET · 9 PM PT Nov 18' },
];

const timeIn = (iso: string, timeZone: string) => {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).replace(':00', '');
  const day = d.toLocaleDateString('en-US', { timeZone, weekday: 'short', month: 'short', day: 'numeric' });
  return `${time} ${day}`;
};

const ROWS = UNLOCKS.map((u) => ({ place: u.place, note: u.note ?? '', local: u.local, ny: timeIn(u.utc, 'America/New_York'), utc: u.utc }));

/** Adds a "Your time" column after mount, unless the visitor is on New York time anyway. */
function useVisitorZone() {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (z && ROWS.some((r) => timeIn(r.utc, z) !== r.ny)) setZone(z);
  }, []);
  return zone;
}

function UnlockTable() {
  const zone = useVisitorZone();
  const rows = zone ? ROWS.map((r) => ({ ...r, yours: timeIn(r.utc, zone) })) : ROWS;
  return (
    <section className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6">
      <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-3">GTA 6 unlock times around the world</h2>
      <p className="text-muted-foreground dark:text-slate-400 mb-3">
        The PlayStation Store listing has GTA 6 unlocking at <strong className="text-foreground dark:text-slate-200">midnight
        local time</strong> on November 19, so it rolls around the world starting in New Zealand — 6 AM on Wednesday,
        November 18 in New York. Countries with more than one timezone unlock together when the earliest reaches
        midnight, which puts the whole US at midnight Eastern: 9 PM on November 18 on the West Coast.
      </p>
      <StackedTable
        rows={rows}
        stack="lines"
        minWidth="sm:min-w-[34rem]"
        renderFirst={(r) => (
          <>
            {r.place}
            {r.note && <span className="block text-xs font-normal text-muted-foreground mb-1 sm:mb-0">{r.note}</span>}
          </>
        )}
        columns={[
          { key: 'local', header: 'Local time', mobileLabel: 'Local:' },
          { key: 'ny', header: 'New York time', mobileLabel: 'New York:' },
          ...(zone ? [{ key: 'yours', header: 'Your time', mobileLabel: 'Your time:' }] : []),
        ]}
      />
      <p className="text-muted-foreground dark:text-slate-400 text-sm mt-3">
        Rockstar has not confirmed these times, and Xbox may differ. The countdown above runs to midnight in your
        own timezone. Source: PlayStation Store listing, via PCGamesN.
      </p>
    </section>
  );
}

export default function Gta6CountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until GTA 6?'}
      tagline="Time until Grand Theft Auto VI releases"
      lastUpdated="2026-10-16"
      breadcrumb="GTA 6"
      target={GTA6_RELEASE}
      countdownTitle="GTA 6"
      arrivedLabel="GTA 6 has released! 🎮"
      disclaimer={buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games or Take-Two Interactive')}
      facts={[
        { label: 'Release date', value: 'November 19, 2026' },
        { label: 'Platforms', value: 'PlayStation 5, Xbox Series X|S' },
        { label: 'Pre-orders', value: 'Open now' },
      ]}
      intro={
        <>
          The wait for <strong>Grand Theft Auto VI</strong> is almost over. Rockstar Games has set the
          release for <strong>November 19, 2026</strong> on PlayStation 5 and Xbox Series X|S. The live
          countdown above shows exactly how many days, hours, minutes, and seconds remain until launch —
          updating every second.
        </>
      }
      extraContent={<UnlockTable />}
      faqs={[
        {
          question: 'How many days until GTA 6 comes out?',
          answer:
            "GTA 6 releases on Thursday, November 19, 2026. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.",
        },
        {
          question: 'When does GTA 6 come out?',
          answer:
            'Grand Theft Auto VI is scheduled to release on Thursday, November 19, 2026, according to Rockstar Games.',
        },
        {
          question: 'What platforms is GTA 6 releasing on?',
          answer: 'GTA 6 launches on PlayStation 5 and Xbox Series X|S.',
        },
        {
          question: 'What time does GTA 6 unlock?',
          answer:
            'The PlayStation Store listing has it unlocking at midnight local time on November 19, starting in New Zealand at 6 AM on November 18 New York time. The US unlocks all at once at midnight Eastern — 9 PM Pacific on November 18. Rockstar has not confirmed the times.',
        },
        {
          question: 'What time does GTA 6 come out in the UK?',
          answer:
            'Midnight at the start of Thursday, November 19 UK time, going by the PlayStation Store listing. That is 7 PM on November 18 in New York.',
        },
        {
          question: 'Is there a GTA 6 PC release date?',
          answer:
            'Rockstar has not announced a PC release date. Previous Grand Theft Auto titles came to PC some time after their console launch.',
        },
        {
          question: 'Can I pre-order GTA 6?',
          answer: 'Yes — pre-orders for Grand Theft Auto VI are open at digital storefronts and select retailers.',
        },
      ]}
    />
  );
}
