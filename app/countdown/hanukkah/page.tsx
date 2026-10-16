'use client';

import EventPage from '@/components/EventPage';
import StackedTable from '@/components/StackedTable';
import { HANUKKAH } from '@/lib/holidays';

const label = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ROWS = HANUKKAH.map((h) => ({
  year: h.start.slice(0, 4),
  start: `${label(h.start)}, at sundown`,
  end: label(h.end ?? h.start),
}));

export default function HanukkahCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Hanukkah?'}
      tagline="Live countdown to the first night of Hanukkah — in 2026, sundown on Friday, December 4"
      lastUpdated="2026-10-15"
      breadcrumb="Hanukkah"
      dateRanges={HANUKKAH}
      countdownTitle="Hanukkah"
      arrivedLabel="Happy Hanukkah! 🕎"
      facts={[
        { label: 'Begins', value: 'Sundown, Fri, Dec 4, 2026' },
        { label: 'Ends', value: 'Nightfall, Sat, Dec 12, 2026' },
        { label: 'Lasts', value: 'Eight nights' },
      ]}
      intro={
        <>
          Counting down to the first night of <strong>Hanukkah</strong> (also spelled Chanukah). In 2026 it begins at
          sundown on <strong>Friday, December 4</strong>, when the first candle is lit. The countdown runs to the start of
          that day in your timezone; during the eight days of Hanukkah it shows how long the festival has been going.
        </>
      }
      extraContent={
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
            Hanukkah dates, 2026–2031
          </h2>
          <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50 px-4 py-2">
            <StackedTable
              rows={ROWS}
              firstKey="year"
              firstHeader="Year"
              stack="lines"
              columns={[
                { key: 'start', header: 'First candle', mobileLabel: 'First candle:' },
                { key: 'end', header: 'Last day', mobileLabel: 'Last day:' },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Like every Jewish holiday, each day of Hanukkah begins at sundown the evening before, so the first candle
            is lit on the evening of the first date and the festival ends at nightfall on the last.
          </p>
        </section>
      }
      faqs={[
        {
          question: 'When is Hanukkah 2026?',
          answer:
            'Hanukkah 2026 begins at sundown on Friday, December 4, when the first candle is lit, and ends at nightfall on Saturday, December 12.',
        },
        {
          question: 'How many days until Hanukkah?',
          answer:
            'The line at the top of this page gives the days and weeks left until December 4, updated daily. The first candle is lit after sundown that evening.',
        },
        {
          question: 'Why does the date of Hanukkah change every year?',
          answer:
            'Hanukkah starts on the 25th of Kislev in the Hebrew calendar, which follows the moon and adds a leap month seven times every 19 years. Its Gregorian date therefore moves around, anywhere from late November to late December.',
        },
        {
          question: 'How long does Hanukkah last?',
          answer:
            'Eight nights. One more candle is lit each night, so on the last night all eight are burning, along with the shamash, the helper candle used to light the others.',
        },
        {
          question: 'When is Hanukkah 2027?',
          answer:
            'Hanukkah 2027 begins at sundown on Friday, December 24 — Christmas Eve — and ends on Saturday, January 1, 2028.',
        },
      ]}
    />
  );
}
