'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import KeyDates from '@/components/KeyDates';
import { countdownProps } from '@/lib/countdowns';

// Fable (Playground Games, Xbox Game Studios): Tue Feb 23, 2027 on Xbox
// Series X|S, PS5 and PC (Steam, Microsoft Store), day one on Game Pass;
// the Premium Edition plays 5 days early, from Feb 18. Announced at the Xbox
// Games Showcase, Jun 2026, after the delay from autumn 2026 (Gematsu, VGC,
// GamesRadar; checked Nov 12, 2026). No unlock hour announced yet: the board
// counts to midnight on Feb 23 in the visitor's own timezone.

const DATES = [
  { what: 'Early access', note: 'Premium Edition, 5 days early', date: '2027-02-18' },
  { what: 'Release day', note: 'Xbox Series X|S, PS5, PC and Game Pass', date: '2027-02-23' },
];

export default function FableCountdownPage() {
  return (
    <EventPage
      {...countdownProps('fable')}
      heading={'How Many Days Until Fable?'}
      tagline="Time until Fable releases on February 23, 2027"
      lastUpdated="2026-11-12"
      breadcrumb="Fable"
      facts={[
        { label: 'Release date', value: 'Tuesday, February 23, 2027' },
        { label: 'Early access', value: 'February 18 (Premium Edition)' },
        { label: 'Platforms', value: 'Xbox Series X|S, PS5, PC' },
        { label: 'Game Pass', value: 'Day one' },
      ]}
      intro={
        <>
          <strong>Fable</strong>, Playground Games&apos; return to Albion, releases on{' '}
          <strong>Tuesday, February 23, 2027</strong> on Xbox Series X|S, PlayStation 5 and PC, and on Game Pass the same
          day. The Premium Edition starts <strong>five days early, on February 18</strong>. The countdown above runs to the
          start of release day in your timezone; Xbox hasn&apos;t announced an unlock hour yet. For any other date, use
          the <Link href="/tools/days-between-dates/" className="text-primary hover:text-primary/80 font-semibold">days
          between dates calculator</Link>.
        </>
      }
      extraContent={
        <KeyDates
          title="Fable early access and release dates"
          dates={DATES}
          footnote="Days are counted to the start of each date in your own timezone. Source: Xbox Game Studios' release announcement, June 2026."
        >
          Two dates matter: early access for the Premium Edition, then the full release for everyone, including Game Pass.
        </KeyDates>
      }
      faqs={[
        {
          question: 'How many days until Fable comes out?',
          answer:
            'Fable releases on Tuesday, February 23, 2027. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.',
        },
        {
          question: 'When does Fable come out?',
          answer:
            'February 23, 2027, on Xbox Series X|S, PlayStation 5 and PC (Steam and the Microsoft Store). It was delayed from autumn 2026.',
        },
        {
          question: 'When does Fable early access start?',
          answer:
            'On Thursday, February 18, 2027. The Premium Edition includes five days of early access before the February 23 release.',
        },
        {
          question: 'Is Fable on Game Pass?',
          answer: 'Yes. Fable is on Game Pass from release day, February 23, 2027.',
        },
        {
          question: 'Is Fable on PS5?',
          answer: 'Yes. Fable launches on PlayStation 5 on the same day as Xbox and PC, February 23, 2027.',
        },
        {
          question: 'What time does Fable unlock?',
          answer:
            'Xbox has not announced an unlock time yet. Many Xbox games unlock at midnight local time on release day; the countdown here runs to midnight on February 23 in your timezone.',
        },
      ]}
    />
  );
}
