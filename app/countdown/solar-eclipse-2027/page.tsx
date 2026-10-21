'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import EclipseCountdown from '@/components/EclipseCountdown';
import EclipseCityTable from '@/components/EclipseCityTable';
import { TOTALITY, PARTIAL } from './eclipseData';

// Eclipse facts: NASA GSFC eclipse catalogue (greatest eclipse 25.5°N 33.2°E,
// central duration 6m23s, path width 257.7 km, Saros 136; next total eclipse
// 2028 Jul 22). City timings: see ./eclipseData.ts. Times are quoted to the
// minute because ΔT for 2027 is a prediction (NASA 76 s, EclipseWise 72.8 s).
const LINK = 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium';
const CARD = 'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6';
const H2 = 'text-xl font-bold text-foreground dark:text-slate-100 mb-3';
const BODY = 'text-muted-foreground dark:text-slate-400';
const STRONG = 'text-foreground dark:text-slate-200';

export default function SolarEclipse2027Page() {
  return (
    <EventPage
      board={{ color: '#10142b', ink: '#f5d76e' }}
      heading="2027 Total Solar Eclipse Countdown"
      tagline="Monday, August 2, 2027 — when totality reaches Spain, Morocco, Libya, Egypt and Saudi Arabia, in local time"
      lastUpdated="2026-10-15"
      breadcrumb="Solar eclipse 2027"
      countdownSlot={
        <EclipseCountdown
          peakMs={Date.UTC(2027, 7, 2, 10, 6, 37)}
          title="the 2027 total solar eclipse"
          arrivedLabel="The 2027 eclipse has passed — the next total eclipse is July 22, 2028"
          where="near Luxor, Egypt"
        />
      }
      facts={[
        { label: 'Date', value: 'Monday, August 2, 2027' },
        { label: 'Longest totality', value: '6 min 23 s, near Luxor' },
        { label: 'Path of totality', value: 'Spain to Somalia' },
      ]}
      intro={
        <>
          On <strong>August 2, 2027</strong> the Moon will completely cover the Sun along a path about 258 km wide,
          from the Strait of Gibraltar across North Africa and the Arabian Peninsula to the Horn of Africa. Near Luxor, Egypt, the sky will stay
          dark for <strong>6 minutes 23 seconds</strong>. Most of Europe, Africa and the Middle East will see a partial
          eclipse. The countdown above runs to the moment of greatest eclipse.
        </>
      }
      extraContent={
        <>
          <section className={CARD}>
            <h2 className={H2}>Where to see totality, and when</h2>
            <p className={`${BODY} mb-3`}>
              Totality is visible from Morocco, Spain, Algeria, Libya, Egypt, Saudi Arabia, Yemen and Somalia. Local times
              for cities in the path, west to east:
            </p>
            <EclipseCityTable rows={TOTALITY} columns={[{ key: 'time', header: 'Totality (local time)' }, { key: 'duration', header: 'Lasts', right: true }]} />
            <p className={`${BODY} text-sm mt-3`}>
              Times are shown to the minute, as a clock would read them. The exact seconds depend on your spot in the path — totality is longest
              along its centre line — and on small, still-uncertain changes in Earth&apos;s rotation.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Partial eclipse: how much of the Sun is covered</h2>
            <EclipseCityTable rows={PARTIAL} columns={[{ key: 'time', header: 'Peak (local time)' }, { key: 'covered', header: 'Sun covered', right: true }]} />
            <p className={`${BODY} text-sm mt-3`}>
              Aswan and Seville sit just outside the path. Even 99.8% isn&apos;t totality: the sky doesn&apos;t go dark
              and it is never safe to look at the Sun without eclipse glasses.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Can you see it from North America?</h2>
            <p className={`${BODY} mb-3`}>
              Only from the far east of Canada, and only at sunrise. In{' '}
              <strong className={STRONG}>St. John&apos;s, Newfoundland</strong>, the Sun rises already partly eclipsed;
              at its peak, around 6:09 AM NDT, about 29% of the Sun is covered while it sits low on the horizon. In{' '}
              <strong className={STRONG}>Halifax</strong>, only the last few minutes are visible just after sunrise,
              with the eclipse ending at about 6:19 AM ADT.
            </p>
            <p className={BODY}>
              Further west — Boston, New York, Toronto and beyond — it is over before the Sun comes up. To see the time
              of greatest eclipse in another city, use the <Link href="/tools/timezone" className={LINK}>timezone
              converter</Link>: it&apos;s 10:07 AM in UTC.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Watching safely</h2>
            <p className={BODY}>
              The only time it&apos;s safe to look at the Sun directly is during totality itself, inside the path. For
              every other moment — the partial phases before and after, and anywhere outside the path — use eclipse
              glasses or a solar viewer that meets the <strong className={STRONG}>ISO 12312-2</strong> standard. Ordinary
              sunglasses are not safe.
            </p>
          </section>
        </>
      }
      faqs={[
        {
          question: 'When is the 2027 total solar eclipse?',
          answer:
            'Monday, August 2, 2027. It peaks at about 10:07 UTC near Luxor, Egypt, where totality lasts 6 minutes 23 seconds.',
        },
        {
          question: 'Where can I see the 2027 total solar eclipse?',
          answer:
            'Totality crosses Morocco, southern Spain (including Tarifa, Cádiz, Málaga and Gibraltar), Algeria, Libya, Egypt, Saudi Arabia, Yemen and Somalia. Most of Europe, Africa, the Middle East and western Asia see a partial eclipse.',
        },
        {
          question: 'What time is the 2027 eclipse in Spain?',
          answer:
            'In Tarifa, totality runs from about 10:45 to 10:49 AM CEST, lasting 4 minutes 39 seconds. Cádiz and Málaga see shorter totality around the same time. Madrid and Seville are outside the path and see a deep partial eclipse at about 10:51 and 10:47 AM.',
        },
        {
          question: 'How long will totality last?',
          answer:
            'Up to 6 minutes 23 seconds, near Luxor, Egypt. Benghazi and Jeddah get about 6 minutes; Tarifa and Tangier get between 4½ and 5 minutes.',
        },
        {
          question: 'Can I see the 2027 eclipse from the US or Canada?',
          answer:
            'Not from the US. In Atlantic Canada the Sun rises partly eclipsed: about 29% covered at around 6:09 AM in St. John’s, and only the final few minutes in Halifax. Further west it is over before sunrise.',
        },
        {
          question: 'When is the next total solar eclipse after 2027?',
          answer:
            'July 22, 2028, across Australia and New Zealand, with up to 5 minutes 10 seconds of totality.',
        },
      ]}
    />
  );
}
