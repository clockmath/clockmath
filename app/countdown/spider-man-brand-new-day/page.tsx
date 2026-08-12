'use client';

import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';

// Theatrical release of Spider-Man: Brand New Day (now released — the timer
// counts up from release day and the copy targets post-release intent).
const RELEASE = new Date(2026, 6, 31);

export default function SpiderManCountdownPage() {
  return (
    <EventPage
      heading={'Spider-Man: Brand New Day'}
      tagline="Spider-Man: Brand New Day is now in theaters"
      lastUpdated="2026-07-31"
      breadcrumb="Spider-Man: Brand New Day"
      target={RELEASE}
      countdownTitle="Spider-Man: Brand New Day"
      arrivedLabel="Spider-Man: Brand New Day is here! 🕷️"
      disclaimer={buildEventDisclaimer(
        'Spider-Man',
        'Sony Pictures, Marvel Studios, or The Walt Disney Company',
      )}
      facts={[
        { label: 'Released', value: 'July 31, 2026' },
        { label: 'Status', value: 'Now in theaters' },
        { label: 'Starring', value: 'Tom Holland' },
      ]}
      intro={
        <>
          <strong>Spider-Man: Brand New Day</strong> swung into theaters on{' '}
          <strong>July 31, 2026</strong>. The live timer above shows exactly how long the
          web-slinger has been on the big screen. A digital or streaming release hasn&apos;t been
          announced yet — see the FAQ below for when to expect it. Counting down to the next big
          Marvel release instead? Check the{' '}
          <a
            href="/countdown/avengers-doomsday/"
            className="text-primary hover:text-primary/80 font-semibold"
          >
            Avengers: Doomsday countdown
          </a>
          .
        </>
      }
      faqs={[
        {
          question: 'Is Spider-Man: Brand New Day out yet?',
          answer:
            'Yes — Spider-Man: Brand New Day released in theaters on July 31, 2026, and is playing now.',
        },
        {
          question: 'When will Spider-Man: Brand New Day be on streaming?',
          answer:
            'No digital or streaming date has been announced yet. Sony’s recent pattern puts premium digital roughly three months after the theatrical release, with a Netflix debut to follow — most likely late 2026 or early 2027.',
        },
        {
          question: 'Who stars in Spider-Man: Brand New Day?',
          answer: 'Tom Holland returns as Spider-Man, with Destin Daniel Cretton directing.',
        },
        {
          question: 'Is this the fourth Tom Holland Spider-Man movie?',
          answer:
            'Yes — Brand New Day is the fourth solo Spider-Man film starring Tom Holland in the Marvel Cinematic Universe.',
        },
      ]}
    />
  );
}
