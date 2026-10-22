import type { Metadata } from 'next';
import { EventCountdownEmbed } from '@/components/embed/CountdownEmbed';
import { COUNTDOWN_SLUGS, getCountdown } from '@/lib/countdowns';

// One static embed per event in lib/countdowns.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTDOWN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${getCountdown(slug)?.name ?? 'Countdown'} countdown — ClockMath` };
}

export default async function EventEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventCountdownEmbed slug={slug} />;
}
