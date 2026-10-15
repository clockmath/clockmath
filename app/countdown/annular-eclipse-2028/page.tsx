'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import EclipseCountdown from '@/components/EclipseCountdown';
import EclipseCityTable from '@/components/EclipseCityTable';
import { ANNULARITY, PARTIAL } from './eclipseData';

// Eclipse facts: NASA GSFC eclipse catalogue — greatest eclipse 15:07:43 UT
// (15:08:59 TD, ΔT 76.3 s) at 3.0°N 51.5°W, central duration 10m27s, path
// width 323 km, Saros 141; next total eclipse 2028 Jul 22. City timings and
// Sun directions: NASA's SEcirc.js on NASA's Besselian elements (see
// ./eclipseData.ts). Quoted to the minute because ΔT is a prediction.
const LINK = 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium';
const CARD = 'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6';
const H2 = 'text-xl font-bold text-foreground dark:text-slate-100 mb-3';
const BODY = 'text-muted-foreground dark:text-slate-400';
const STRONG = 'text-foreground dark:text-slate-200';

export default function AnnularEclipse2028Page() {
  return (
    <EventPage
      heading="2028 Annular Solar Eclipse Countdown"
      tagline="Wednesday, January 26, 2028 — a ring of fire across South America, then over Spain and Portugal at sunset"
      lastUpdated="2026-10-15"
      breadcrumb="Annular eclipse 2028"
      countdownSlot={
        <EclipseCountdown
          peakMs={Date.UTC(2028, 0, 26, 15, 7, 43)}
          title="the 2028 annular solar eclipse"
          arrivedLabel="The January 2028 eclipse has passed — next: a total eclipse on July 22, 2028"
          where="over the Atlantic off northern Brazil"
        />
      }
      facts={[
        { label: 'Date', value: 'Wednesday, January 26, 2028' },
        { label: 'Longest ring of fire', value: '10 min 27 s' },
        { label: 'Path', value: 'Ecuador to Spain' },
      ]}
      intro={
        <>
          On <strong>January 26, 2028</strong> the Moon passes in front of the Sun while it is far from Earth, so it
          looks slightly too small to cover it. The result is an <strong>annular eclipse</strong>: a bright ring of
          sunlight around the Moon. The ring is visible along a path about 323 km wide, from Ecuador across Peru and
          Brazil, over the Atlantic, and on to southern Portugal and Spain just before sunset. At its longest the ring
          lasts <strong>10 minutes 27 seconds</strong>.
        </>
      }
      extraContent={
        <>
          <section className={CARD}>
            <h2 className={H2}>Where to see the ring of fire, and when</h2>
            <EclipseCityTable
              rows={ANNULARITY}
              columns={[
                { key: 'time', header: 'Ring of fire (local time)' },
                { key: 'duration', header: 'Lasts', right: true },
                { key: 'sun', header: 'Sun height', right: true },
              ]}
            />
            <p className={`${BODY} text-sm mt-3`}>
              In <strong className={STRONG}>Spain and Portugal</strong> the ring forms just before sunset, low in the
              west-southwest — 3° to 9° above the horizon. You&apos;ll need a clear, unobstructed view that way: a
              hill, building or band of cloud on the horizon will hide it, especially in Valencia, where the Sun is
              only about 3° up. Times are shown to the minute, as a clock would read them.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Partial eclipse: how much of the Sun is covered</h2>
            <EclipseCityTable
              rows={PARTIAL}
              columns={[
                { key: 'time', header: 'Peak (local time)' },
                { key: 'covered', header: 'Sun covered', right: true },
              ]}
            />
            <p className={`${BODY} text-sm mt-3`}>
              Madrid and Lisbon are just outside the path. In London and Paris the eclipse begins in the late afternoon,
              but the Sun sets before it reaches its peak.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Can you see it from North America?</h2>
            <p className={BODY}>
              Only as a small partial eclipse in the east, during the morning. The Moon covers about 16% of the Sun in
              Miami, 34% in San Juan, Puerto Rico and 36% in Mexico City, but only a sliver further north — about 3% in
              New York and 1% in Toronto. From the West Coast it isn&apos;t visible at all. The next{' '}
              <Link href="/countdown/solar-eclipse-2028" className={LINK}>total eclipse, on July 22, 2028</Link>, is
              visible from Australia and New Zealand.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Watching safely</h2>
            <p className={BODY}>
              An annular eclipse is <strong className={STRONG}>never safe to look at directly</strong> — not even at the
              moment of the ring, when part of the Sun is still uncovered. Use eclipse glasses or a solar viewer that
              meets the <strong className={STRONG}>ISO 12312-2</strong> standard the whole time. Ordinary sunglasses are
              not safe. A low sunset Sun still needs protection.
            </p>
          </section>
        </>
      }
      faqs={[
        {
          question: 'When is the 2028 annular solar eclipse?',
          answer:
            'Wednesday, January 26, 2028. It peaks at about 15:08 UTC over the Atlantic off northern Brazil, where the ring of fire lasts 10 minutes 27 seconds.',
        },
        {
          question: 'What is an annular eclipse?',
          answer:
            'An eclipse where the Moon is too far from Earth to cover the Sun completely, so a bright ring of sunlight — the "ring of fire" — stays visible around it. The sky does not go dark the way it does in a total eclipse.',
        },
        {
          question: 'Can I see the 2028 ring of fire from Spain?',
          answer:
            'Yes, just before sunset. In Seville the ring lasts from about 5:52 to 5:59 PM CET (7 minutes 15 seconds), with the Sun about 8° above the west-southwest horizon. Córdoba, Granada, Málaga, Gibraltar, Valencia and Faro in Portugal are also in the path. Madrid and Lisbon see a deep partial eclipse.',
        },
        {
          question: 'Where in South America can I see the ring of fire?',
          answer:
            'The path crosses southern Ecuador (Cuenca), northern Peru (Iquitos) and the Brazilian Amazon (Manaus), then reaches the Atlantic near Suriname and French Guiana. Iquitos gets about 8½ minutes of annularity.',
        },
        {
          question: 'Is it safe to look at an annular eclipse?',
          answer:
            'No — not at any point. Part of the Sun is always uncovered, so you need certified ISO 12312-2 eclipse glasses or a solar viewer for the whole eclipse, including the ring.',
        },
        {
          question: 'Can I see the January 2028 eclipse from the US or Canada?',
          answer:
            'Only a small partial eclipse in the east, in the morning: about 16% of the Sun covered in Miami, 34% in Puerto Rico, and around 3% in New York. It is not visible from the West Coast.',
        },
      ]}
    />
  );
}
