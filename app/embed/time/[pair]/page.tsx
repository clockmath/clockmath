import type { Metadata } from 'next';
import { TimeEmbed } from '@/components/embed/TimeEmbed';
import { TIME_PAIRS, getTimePair } from '@/lib/timePairs';

// One static embed per time difference page in lib/timePairs.ts (noindex,
// from app/embed/layout.tsx; framable by any site, scripts/worker/api.js).
export const dynamicParams = false;

export function generateStaticParams() {
  return TIME_PAIRS.map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const p = getTimePair(pair);
  return { title: p ? `${p.a.name} and ${p.b.name} time — ClockMath` : 'Time difference — ClockMath' };
}

export default async function TimeEmbedPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  return <TimeEmbed slug={pair} />;
}
