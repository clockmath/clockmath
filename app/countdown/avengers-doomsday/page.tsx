'use client';

import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';

// Theatrical release of Avengers: Doomsday.
const RELEASE = new Date(2026, 11, 18);

export default function AvengersDoomsdayCountdownPage() {
  return (
    <EventPage
      heading={'Avengers: Doomsday'}
      tagline="Time until Avengers: Doomsday hits theaters"
      lastUpdated="2026-07-31"
      breadcrumb="Avengers: Doomsday"
      target={RELEASE}
      countdownTitle="Avengers: Doomsday"
      arrivedLabel="Avengers: Doomsday is here! 💥"
      disclaimer={buildEventDisclaimer(
        'Avengers',
        'Marvel Studios or The Walt Disney Company',
      )}
      facts={[
        { label: 'Release date', value: 'December 18, 2026' },
        { label: 'Directed by', value: 'Anthony & Joe Russo' },
        { label: 'Starring', value: 'Robert Downey Jr.' },
      ]}
      intro={
        <>
          The Avengers return in <strong>Avengers: Doomsday</strong>, hitting theaters on{' '}
          <strong>December 18, 2026</strong> — with <strong>Robert Downey Jr.</strong> back in the
          MCU, this time as <strong>Doctor Doom</strong>, and Infinity War directors the Russo
          brothers at the helm. The live countdown above shows exactly how many days, hours,
          minutes, and seconds remain until release — updating every second.
        </>
      }
      faqs={[
        {
          question: 'When does Avengers: Doomsday come out?',
          answer:
            'Avengers: Doomsday is scheduled to release in theaters on December 18, 2026.',
        },
        {
          question: 'Who plays Doctor Doom in Avengers: Doomsday?',
          answer:
            'Robert Downey Jr. — who launched the MCU as Iron Man — returns as Victor von Doom, the film’s villain.',
        },
        {
          question: 'Who directs Avengers: Doomsday?',
          answer:
            'Anthony and Joe Russo, the directors of Avengers: Infinity War and Avengers: Endgame, return to direct.',
        },
        {
          question: 'Who else stars in Avengers: Doomsday?',
          answer:
            'The ensemble includes Chris Evans, Chris Hemsworth, the Fantastic Four cast (Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach), and X-Men veterans including Patrick Stewart, Ian McKellen, and Kelsey Grammer.',
        },
      ]}
    />
  );
}
