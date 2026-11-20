'use client';

import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';
import { RELEASED } from './launch';

// Theatrical release of Avengers: Doomsday.
// Dec 18, 2026 worldwide (Marvel/Disney listings, rechecked Nov 20, 2026); UK
// opens Wed Dec 16 (MovieWeb, Sep 24, 2026, citing Digital Spy). Theaters
// only at release; no Disney+ date announced as of Nov 20, 2026. Sequel
// Avengers: Secret Wars is dated Dec 17, 2027.
// The after-release version (RELEASED, see launch.ts) only states what was
// known before release: no box office or reviews, which would need a recheck.

const COUNTDOWN_FAQS = [
  {
    question: 'How many days until Avengers: Doomsday?',
    answer:
      'Avengers: Doomsday is scheduled for December 18, 2026 — the live counter at the top of this page shows exactly how many days, hours, and minutes remain right now.',
  },
  {
    question: 'When does Avengers: Doomsday come out?',
    answer:
      'Avengers: Doomsday is scheduled to release in theaters on Friday, December 18, 2026. In the UK it opens two days early, on Wednesday, December 16.',
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
];

const RELEASED_FAQS = [
  {
    question: 'Is Avengers: Doomsday out?',
    answer:
      'Yes. Avengers: Doomsday opened in theaters on Friday, December 18, 2026 in the US, and on Wednesday, December 16 in the UK.',
  },
  {
    question: 'Is Avengers: Doomsday on Disney+?',
    answer:
      'Not at release: it opened in theaters only. Disney has said it will come to Disney+ later but had not announced a date when this page was last checked.',
  },
  {
    question: 'When does the next Avengers movie come out?',
    answer: 'Avengers: Secret Wars, the follow-up to Doomsday, is scheduled for December 17, 2027.',
  },
  {
    question: 'Who plays Doctor Doom in Avengers: Doomsday?',
    answer:
      'Robert Downey Jr. — who launched the MCU as Iron Man — plays Victor von Doom, the film’s villain.',
  },
  {
    question: 'Who directed Avengers: Doomsday?',
    answer:
      'Anthony and Joe Russo, the directors of Avengers: Infinity War and Avengers: Endgame.',
  },
];

export default function AvengersDoomsdayCountdownPage() {
  return (
    <EventPage
      {...countdownProps('avengers-doomsday')}
      heading={RELEASED ? 'Avengers: Doomsday Is Out: Release Date' : 'How Many Days Until Avengers: Doomsday?'}
      tagline={RELEASED ? 'Avengers: Doomsday opened in theaters on December 18, 2026' : 'Time until Avengers: Doomsday hits theaters'}
      lastUpdated={RELEASED ? '2026-12-18' : '2026-11-20'}
      breadcrumb="Avengers: Doomsday"
      facts={
        RELEASED
          ? [
              { label: 'Released', value: 'December 18, 2026' },
              { label: 'Where', value: 'In theaters' },
              { label: 'Next', value: 'Secret Wars, Dec 17, 2027' },
            ]
          : [
              { label: 'Release date', value: 'December 18, 2026' },
              { label: 'Directed by', value: 'Anthony & Joe Russo' },
              { label: 'Starring', value: 'Robert Downey Jr.' },
            ]
      }
      intro={
        RELEASED ? (
          <>
            <strong>Avengers: Doomsday</strong> is out. It opened in theaters on <strong>December 18, 2026</strong>{' '}
            (December 16 in the UK), with <strong>Robert Downey Jr.</strong> as <strong>Doctor Doom</strong> and the
            Russo brothers directing. The timer above shows how long it has been out. The next Avengers film,{' '}
            <strong>Avengers: Secret Wars</strong>, is set for December 17, 2027.
          </>
        ) : (
          <>
            The Avengers return in <strong>Avengers: Doomsday</strong>, hitting theaters on{' '}
            <strong>December 18, 2026</strong> — with <strong>Robert Downey Jr.</strong> back in the
            MCU, this time as <strong>Doctor Doom</strong>, and Infinity War directors the Russo
            brothers at the helm. The live countdown above shows exactly how many days, hours,
            minutes, and seconds remain until release — updating every second.
          </>
        )
      }
      faqs={RELEASED ? RELEASED_FAQS : COUNTDOWN_FAQS}
    />
  );
}
