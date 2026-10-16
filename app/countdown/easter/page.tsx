'use client';

import EventPage from '@/components/EventPage';
import StackedTable from '@/components/StackedTable';

// Easter dates from the computus: the Anonymous Gregorian algorithm (Western)
// and Meeus's Julian algorithm + 13 days (Orthodox), computed Oct 15, 2026.
// Good Friday is two days before Western Easter.
const YEARS = [
  { year: '2027', easter: '2027-03-28', orthodox: '2027-05-02' },
  { year: '2028', easter: '2028-04-16', orthodox: '2028-04-16' },
  { year: '2029', easter: '2029-04-01', orthodox: '2029-04-08' },
  { year: '2030', easter: '2030-04-21', orthodox: '2030-04-28' },
  { year: '2031', easter: '2031-04-13', orthodox: '2031-04-13' },
  { year: '2032', easter: '2032-03-28', orthodox: '2032-05-02' },
] as const;

const fmt = (iso: string, offsetDays = 0) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
  });
};

const ROWS = YEARS.map((y) => ({
  year: y.year,
  easter: `Sunday, ${fmt(y.easter)}`,
  goodFriday: `Friday, ${fmt(y.easter, -2)}`,
  orthodox: y.orthodox === y.easter ? 'Same day' : `Sunday, ${fmt(y.orthodox)}`,
}));
const RANGES = YEARS.map((y) => ({ start: y.easter }));

export default function EasterCountdownPage() {
  return (
    <EventPage
      heading={'How Many Days Until Easter?'}
      tagline="Live countdown to Easter Sunday 2027 — March 28"
      lastUpdated="2026-10-15"
      breadcrumb="Easter"
      dateRanges={RANGES}
      countdownTitle="Easter"
      arrivedLabel="Happy Easter! 🐣"
      facts={[
        { label: 'Easter 2027', value: 'Sunday, March 28' },
        { label: 'Good Friday', value: 'Friday, March 26' },
        { label: 'Orthodox Easter', value: 'Sunday, May 2' },
      ]}
      intro={
        <>
          Counting down to <strong>Easter Sunday</strong>, which in 2027 falls on <strong>March 28</strong>, in your own
          timezone. Easter moves every year; once it has passed, the countdown moves on to next year&apos;s date.
        </>
      }
      extraContent={
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-slate-100 mb-3">Easter dates, 2027–2032</h2>
          <div className="bg-card dark:bg-slate-800 rounded-2xl border border-border/50 dark:border-slate-700/50 px-4 py-2">
            <StackedTable
              rows={ROWS}
              firstKey="year"
              firstHeader="Year"
              stack="lines"
              columns={[
                { key: 'easter', header: 'Easter Sunday', mobileLabel: 'Easter:' },
                { key: 'goodFriday', header: 'Good Friday', mobileLabel: 'Good Friday:' },
                { key: 'orthodox', header: 'Orthodox Easter', mobileLabel: 'Orthodox:' },
              ]}
            />
          </div>
        </section>
      }
      faqs={[
        {
          question: 'When is Easter 2027?',
          answer:
            'Easter Sunday 2027 is March 28. Good Friday is March 26. The line at the top of this page gives the days and weeks left, updated daily.',
        },
        {
          question: 'Why does Easter change date every year?',
          answer:
            'Easter is the first Sunday after the first full moon on or after March 21 (using a fixed table of church full moons rather than the real Moon). That puts it anywhere between March 22 and April 25.',
        },
        {
          question: 'When is Orthodox Easter 2027?',
          answer:
            'Sunday, May 2, 2027, five weeks after Western Easter. Orthodox churches use the older Julian calendar for the calculation; in 2028 and 2031 both Easters fall on the same day.',
        },
        {
          question: 'Is the stock market open on Good Friday?',
          answer:
            'No. The NYSE and Nasdaq close on Good Friday, even though it is not a US federal holiday. In 2027 that is Friday, March 26.',
        },
        {
          question: 'Is Easter Monday a holiday?',
          answer:
            'In the UK (except Scotland), Ireland, Australia and much of Europe, yes — it is a public holiday. In the US it is not.',
        },
      ]}
    />
  );
}
