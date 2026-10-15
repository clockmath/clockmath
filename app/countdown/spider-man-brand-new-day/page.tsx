'use client';

import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';

// Theatrical release of Spider-Man: Brand New Day (now released — the timer
// counts up from release day and the copy targets post-release intent).
// Digital (rent/buy) release Oct 6, 2026, per Yahoo Entertainment (Sep 28) and
// Hollywood Reporter; no subscription-streaming (Netflix) date announced yet.
const RELEASE = new Date(2026, 6, 31);

export default function SpiderManCountdownPage() {
  return (
    <EventPage
      heading={'Spider-Man: Brand New Day'}
      tagline="Spider-Man: Brand New Day is out now — in theaters and to rent or buy digitally"
      lastUpdated="2026-10-15"
      breadcrumb="Spider-Man: Brand New Day"
      target={RELEASE}
      countdownTitle="Spider-Man: Brand New Day"
      arrivedLabel="Spider-Man: Brand New Day is here! 🕷️"
      disclaimer={buildEventDisclaimer(
        'Spider-Man',
        'Sony Pictures, Marvel Studios, or The Walt Disney Company',
        { released: true },
      )}
      facts={[
        { label: 'Released', value: 'July 31, 2026' },
        { label: 'On digital', value: 'Since October 6, 2026' },
        { label: 'Starring', value: 'Tom Holland' },
      ]}
      intro={
        <>
          <strong>Spider-Man: Brand New Day</strong> swung into theaters on{' '}
          <strong>July 31, 2026</strong>. The live timer above shows exactly how long the
          web-slinger has been out. Since <strong>October 6, 2026</strong> you can also rent or buy it
          digitally; a Netflix date hasn&apos;t been announced yet. Counting down to the next big
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
            'Yes. Spider-Man: Brand New Day opened in theaters on July 31, 2026, and has been available to rent or buy digitally since October 6, 2026.',
        },
        {
          question: 'When will Spider-Man: Brand New Day be on streaming?',
          answer:
            'It has been available to rent or buy on digital storefronts since October 6, 2026. A subscription-streaming date has not been announced; under Sony’s deals, its films go to Netflix first and Disney+ later, so expect Netflix in 2027.',
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
