'use client';

import EventPage from '@/components/EventPage';
import { buildEventDisclaimer } from '@/components/EventCountdown';

// Single source of truth for the release date — easy to update if it slips
// again (Nov 19, 2026, local midnight).
const GTA6_RELEASE = new Date(2026, 10, 19);

export default function Gta6CountdownPage() {
  return (
    <EventPage
      heading={
        <>
          <span className="text-emerald-600 dark:text-emerald-400">GTA 6</span>{' '}
          <span className="text-blue-600 dark:text-blue-400">Countdown</span>
        </>
      }
      tagline="Time until Grand Theft Auto VI releases"
      breadcrumb="GTA 6"
      target={GTA6_RELEASE}
      countdownTitle="GTA 6"
      arrivedLabel="GTA 6 has released! 🎮"
      disclaimer={buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games or Take-Two Interactive')}
      facts={[
        { label: 'Release date', value: 'November 19, 2026' },
        { label: 'Platforms', value: 'PlayStation 5, Xbox Series X|S' },
        { label: 'Pre-orders', value: 'Open now' },
      ]}
      intro={
        <>
          The wait for <strong>Grand Theft Auto VI</strong> is almost over. Rockstar Games has set the
          release for <strong>November 19, 2026</strong> on PlayStation 5 and Xbox Series X|S. The live
          countdown above shows exactly how many days, hours, minutes, and seconds remain until launch —
          updating every second.
        </>
      }
      faqs={[
        {
          question: 'When does GTA 6 come out?',
          answer:
            'Grand Theft Auto VI is scheduled to release on Thursday, November 19, 2026, according to Rockstar Games.',
        },
        {
          question: 'What platforms is GTA 6 releasing on?',
          answer: 'GTA 6 launches on PlayStation 5 and Xbox Series X|S.',
        },
        {
          question: 'Is there a GTA 6 PC release date?',
          answer:
            'Rockstar has not announced a PC release date. Previous Grand Theft Auto titles came to PC some time after their console launch.',
        },
        {
          question: 'Can I pre-order GTA 6?',
          answer: 'Yes — pre-orders for Grand Theft Auto VI are open at digital storefronts and select retailers.',
        },
      ]}
    />
  );
}
