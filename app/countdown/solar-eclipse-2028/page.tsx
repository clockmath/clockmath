'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import EclipseCountdown from '@/components/EclipseCountdown';
import EclipseCityTable from '@/components/EclipseCityTable';
import { TOTALITY, PARTIAL } from './eclipseData';

// Eclipse facts: NASA GSFC eclipse catalogue — greatest eclipse 02:55:23 UT
// (02:56:40 TD, ΔT 76.6 s) at 15.6°S 126.7°E, central duration 5m10s, path
// width 230 km, Saros 146; next total eclipse 2030 Nov 25. City timings and
// Sun directions: NASA's SEcirc.js on NASA's Besselian elements (see
// ./eclipseData.ts). Quoted to the minute because ΔT is a prediction.
const LINK = 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium';
const CARD = 'bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50 mb-6';
const H2 = 'text-xl font-bold text-foreground dark:text-slate-100 mb-3';
const BODY = 'text-muted-foreground dark:text-slate-400';
const STRONG = 'text-foreground dark:text-slate-200';

export default function SolarEclipse2028Page() {
  return (
    <EventPage
      heading="2028 Total Solar Eclipse Countdown"
      tagline="Saturday, July 22, 2028 — totality across Australia, through Sydney, and on to New Zealand, in local time"
      lastUpdated="2026-10-15"
      breadcrumb="Solar eclipse 2028"
      countdownSlot={
        <EclipseCountdown
          peakMs={Date.UTC(2028, 6, 22, 2, 55, 23)}
          title="the 2028 total solar eclipse"
          arrivedLabel="The 2028 eclipse has passed — the next total eclipse is November 25, 2030"
          where="in the Kimberley, Western Australia"
        />
      }
      facts={[
        { label: 'Date', value: 'Saturday, July 22, 2028' },
        { label: 'Totality in Sydney', value: '1:59 PM AEST, 3 min 48 s' },
        { label: 'Longest totality', value: '5 min 10 s, in the Kimberley' },
      ]}
      intro={
        <>
          On <strong>July 22, 2028</strong> the Moon will completely cover the Sun along a path about 230 km wide, from
          the Kimberley in Western Australia across the Northern Territory, south-west Queensland and New South Wales,
          then over the Tasman Sea to the South Island of New Zealand. It passes straight over{' '}
          <strong>Sydney</strong>, where the sky goes dark for <strong>3 minutes 48 seconds</strong> just before 2 PM.
          The rest of Australia, New Zealand and much of Southeast Asia see a partial eclipse.
        </>
      }
      extraContent={
        <>
          <section className={CARD}>
            <h2 className={H2}>Where to see totality, and when</h2>
            <p className={`${BODY} mb-3`}>Local times for towns and cities in the path, west to east:</p>
            <EclipseCityTable
              rows={TOTALITY}
              columns={[
                { key: 'time', header: 'Totality (local time)' },
                { key: 'duration', header: 'Lasts', right: true },
                { key: 'sun', header: 'Sun height', right: true },
              ]}
            />
            <p className={`${BODY} text-sm mt-3`}>
              Times are shown to the minute, as a clock would read them. Totality is longest along the centre line of
              the path — Bourke gets just over 4 minutes — and the exact seconds depend on small, still-uncertain
              changes in Earth&apos;s rotation.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>Sydney: totality over the harbour</h2>
            <p className={BODY}>
              Sydney is the largest city in the path. Totality runs from about <strong className={STRONG}>1:59 to
              2:03 PM AEST</strong>, with the Sun 29° above the horizon to the north-northwest — high enough to clear
              most buildings. It falls on a Saturday afternoon.
              Wollongong and the Blue Mountains are in the path too.{' '}
              <strong className={STRONG}>Newcastle and Canberra are not</strong>: they sit just outside the edge and see
              a deep partial eclipse (99.7% and 96%), which is nothing like totality.
            </p>
          </section>

          <section className={CARD}>
            <h2 className={H2}>New Zealand: a low Sun before sunset</h2>
            <p className={BODY}>
              The path reaches the South Island in the late afternoon. In{' '}
              <strong className={STRONG}>Queenstown and Dunedin</strong> totality starts at about 4:15 PM NZST and lasts
              just under 3 minutes, but the Sun is only 8–10° up in the northwest, so you&apos;ll need a clear view low
              over that horizon — mountains around Queenstown can block it. Invercargill is just outside the path;
              Christchurch, Wellington and Auckland see a partial eclipse.
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
              Even 99.97% isn&apos;t totality: the sky doesn&apos;t go dark and it is never safe to look at the Sun
              without eclipse glasses. It isn&apos;t visible from Hawaii or anywhere in the Americas. To see the peak in
              your own time, use the <Link href="/tools/timezone" className={LINK}>timezone converter</Link>: it&apos;s
              2:55 AM UTC.
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
          question: 'When is the 2028 total solar eclipse?',
          answer:
            'Saturday, July 22, 2028. It peaks at about 2:55 UTC in the Kimberley, Western Australia, where totality lasts 5 minutes 10 seconds.',
        },
        {
          question: 'What time is the 2028 eclipse in Sydney?',
          answer:
            'Totality in Sydney runs from about 1:59 to 2:03 PM AEST on Saturday, July 22, 2028, lasting 3 minutes 48 seconds. The partial phases begin at about 12:41 PM and end at about 3:15 PM.',
        },
        {
          question: 'Where in Australia can I see the 2028 total eclipse?',
          answer:
            'The path of totality crosses the Kimberley in Western Australia (Wyndham, Kununurra), the Northern Territory (Tennant Creek), south-west Queensland (Thargomindah), and New South Wales (Bourke, Dubbo, Orange, Bathurst, the Blue Mountains, Sydney and Wollongong). Newcastle and Canberra are just outside it.',
        },
        {
          question: 'Can I see the 2028 eclipse in New Zealand?',
          answer:
            'Yes — totality crosses the South Island, including Queenstown and Dunedin, at about 4:15 PM NZST, lasting just under 3 minutes with the Sun low in the northwest. Auckland, Wellington and Christchurch see a partial eclipse.',
        },
        {
          question: 'Will Melbourne, Brisbane or Perth see the 2028 eclipse?',
          answer:
            'Only as a partial eclipse: about 81% of the Sun covered in Melbourne, 82% in Brisbane and 50% in Perth. To see totality you need to be inside the path, which runs through Sydney.',
        },
        {
          question: 'When is the next total solar eclipse after 2028?',
          answer:
            'November 25, 2030, across southern Africa (Botswana and South Africa) and southern Australia.',
        },
      ]}
    />
  );
}
