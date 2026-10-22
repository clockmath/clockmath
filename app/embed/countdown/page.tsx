'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomCountdownEmbed } from '@/components/embed/CountdownEmbed';

// A countdown made in the countdown tool: /embed/countdown/?to=…&title=…&color=…
function FromQuery() {
  const q = useSearchParams();
  return <CustomCountdownEmbed to={q.get('to')} title={q.get('title')} color={q.get('color')} />;
}

export default function CustomEmbedPage() {
  return (
    <Suspense fallback={null}>
      <FromQuery />
    </Suspense>
  );
}
