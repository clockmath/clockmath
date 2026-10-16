'use client';

import EventPage from '@/components/EventPage';
import StackedTable from '@/components/StackedTable';
import { LUNAR_NEW_YEAR as YEARS } from '@/lib/holidays';

const label = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const ROWS = YEARS.map((y) => ({ year: y.start.slice(0, 4), date: label(y.start), animal: `Year of the ${y.animal}` }));
const RANGES = YEARS.map((y) => ({ start: y.start }));

export default function LunarNewYearCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Lunar New Year?'}
      tagline="Live countdown to Lunar New Year 2027 — Saturday, February 6, the Year of the Goat"
      lastUpdated="2026-10-15"
      breadcrumb="Lunar New Year"
      dateRanges={RANGES}
      countdownTitle="Lunar New Year"
      arrivedLabel="Happy Lunar New Year! 🧧"
      facts={[
        { label: '2027 date', value: 'Saturday, Feb 6' },
        { label: 'Zodiac', value: 'Year of the Goat' },
        { label: 'Lantern Festival', value: 'Saturday, Feb 20' },
      ]}
      intro={
        <>
          Counting down to <strong>Lunar New Year</strong>, also called Chinese New Year or the Spring Festival. In 2027 it
          falls on <strong>Saturday, February 6</strong> and begins the <strong>Year of the Goat</strong>. The countdown
          runs to the start of February 6 in your timezone; the celebrations last until the Lantern Festival on February 20.
        </>
      }
      extraContent={
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">
            Lunar New Year dates, 2027–2032
          </h2>
          <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50 px-4 py-2">
            <StackedTable
              rows={ROWS}
              firstKey="year"
              firstHeader="Year"
              columns={[
                { key: 'date', header: 'Date (in China)' },
                { key: 'animal', header: 'Zodiac animal' },
              ]}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The new year starts on the day of a new moon, worked out in China&apos;s timezone. Countries that use their own
            timezone can land on a different day when the new moon is close to midnight: Korea celebrates Seollal 2027 on
            Sunday, February 7, because that new moon arrives at 11:56 PM in Beijing but 12:56 AM in Seoul.
          </p>
        </section>
      }
      faqs={[
        {
          question: 'When is Lunar New Year 2027?',
          answer:
            'Saturday, February 6, 2027, in China and most places that follow the Chinese calendar. It starts the Year of the Goat. The line at the top of this page gives the days and weeks left, updated daily.',
        },
        {
          question: 'What animal is 2027 in the Chinese zodiac?',
          answer:
            'The Goat (sometimes translated as Sheep or Ram). It follows the Year of the Horse, 2026, and comes before the Year of the Monkey, which starts on January 26, 2028.',
        },
        {
          question: 'Why does the date of Lunar New Year change every year?',
          answer:
            'It usually falls on the second new moon after the winter solstice, so its date on the Western calendar moves between January 21 and February 20.',
        },
        {
          question: 'Is Korean Seollal on the same day as Chinese New Year?',
          answer:
            'Usually, but not in 2027. Korea works out its lunar calendar in Korean time, one hour ahead of China, and the February 2027 new moon arrives just after midnight there — so Seollal is Sunday, February 7, a day after Chinese New Year. Vietnam’s Tết can differ the other way: in 2030 it falls on February 2, a day before China’s February 3.',
        },
        {
          question: 'When is the Lantern Festival in 2027?',
          answer:
            'Saturday, February 20, 2027 — the 15th day of the new year, which closes the Spring Festival celebrations.',
        },
      ]}
    />
  );
}
