'use client';

import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';

// Theatrical release of Spider-Man: Brand New Day.
const RELEASE = new Date(2026, 6, 31);

export default function SpiderManCountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">Spider-Man:</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Brand New Day</span>
        </>
      }
      tagline="Time until Spider-Man: Brand New Day hits theaters"
      breadcrumb="Spider-Man: Brand New Day"
      target={RELEASE}
      countdownTitle="Spider-Man: Brand New Day"
      arrivedLabel="Spider-Man: Brand New Day is here! 🕷️"
      disclaimer={buildEventDisclaimer(
        'Spider-Man',
        'Sony Pictures, Marvel Studios, or The Walt Disney Company',
      )}
      facts={[
        { label: 'Release date', value: 'July 31, 2026' },
        { label: 'Format', value: 'Theatrical' },
        { label: 'Starring', value: 'Tom Holland' },
      ]}
      intro={
        <>
          The next chapter of the MCU&apos;s web-slinger, <strong>Spider-Man: Brand New Day</strong>,
          swings into theaters on <strong>July 31, 2026</strong>. The live countdown above shows exactly
          how many days, hours, minutes, and seconds remain until release — updating every second.
        </>
      }
      faqs={[
        {
          question: 'When does Spider-Man: Brand New Day come out?',
          answer: 'Spider-Man: Brand New Day is scheduled to release in theaters on July 31, 2026.',
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
