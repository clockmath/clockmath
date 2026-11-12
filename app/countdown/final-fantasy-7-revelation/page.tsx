'use client';

import Link from 'next/link';
import EventPage from '@/components/EventPage';
import { countdownProps } from '@/lib/countdowns';

// Final Fantasy VII Revelation (Square Enix), the third and last part of the
// remake trilogy: Thu Apr 8, 2027 on PS5, Xbox Series X|S, Nintendo Switch 2
// and PC (Steam, Epic Games Store, Microsoft Store), all on the same day.
// Revealed for "Spring 2027" in June 2026; the date came at PlayStation's
// State of Play, Sep 3, 2026 (VGC, Automaton, Windows Central; checked
// Nov 12, 2026). No unlock hour announced: the board counts to midnight on
// Apr 8 in the visitor's own timezone.

export default function Ff7RevelationCountdownPage() {
  return (
    <EventPage
      {...countdownProps('final-fantasy-7-revelation')}
      heading={'How Many Days Until Final Fantasy VII Revelation?'}
      tagline="Time until the last part of the Final Fantasy VII remake trilogy, out April 8, 2027"
      lastUpdated="2026-11-12"
      breadcrumb="Final Fantasy VII Revelation"
      facts={[
        { label: 'Release date', value: 'Thursday, April 8, 2027' },
        { label: 'Platforms', value: 'PS5, Xbox Series X|S, Switch 2, PC' },
        { label: 'Part', value: 'Third and last of the remake trilogy' },
      ]}
      intro={
        <>
          <strong>Final Fantasy VII Revelation</strong> ends the remake trilogy that began with Final Fantasy VII Remake
          (2020) and Rebirth (2024). Square Enix has set it for <strong>Thursday, April 8, 2027</strong>, on PlayStation
          5, Xbox Series X|S, Nintendo Switch 2 and PC on the same day. The countdown above runs to the start of release
          day in your timezone; Square Enix hasn&apos;t announced an unlock hour yet. If you&apos;re also waiting for{' '}
          <Link href="/countdown/gta-6/" className="text-primary hover:text-primary/80 font-semibold">
            GTA 6
          </Link>
          , it has its own countdown.
        </>
      }
      faqs={[
        {
          question: 'How many days until Final Fantasy VII Revelation comes out?',
          answer:
            'Final Fantasy VII Revelation releases on Thursday, April 8, 2027. The line at the top of this page gives the days and weeks left, updated daily, and the timer counts down to the second.',
        },
        {
          question: 'When does FF7 Revelation come out?',
          answer:
            'April 8, 2027. Square Enix announced the date at the September 3, 2026 State of Play, after first revealing the game for spring 2027.',
        },
        {
          question: 'What platforms is FF7 Revelation on?',
          answer:
            'PlayStation 5, Xbox Series X|S, Nintendo Switch 2 and PC (Steam, the Epic Games Store and the Microsoft Store), all on April 8, 2027.',
        },
        {
          question: 'Is FF7 Revelation the last part of the remake?',
          answer:
            'Yes. Revelation is the third and final part of the Final Fantasy VII remake trilogy, after Final Fantasy VII Remake (2020) and Final Fantasy VII Rebirth (2024).',
        },
        {
          question: 'What time does FF7 Revelation unlock?',
          answer:
            'Square Enix has not announced an unlock time yet. The countdown here runs to midnight on April 8 in your timezone. Store listings usually show unlock times by region closer to launch.',
        },
      ]}
    />
  );
}
