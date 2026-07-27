import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the market-hours
// page itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Stock Market Hours — Is the Market Open? | ClockMath',
  description:
    'Live stock market hours in your timezone. See whether the NYSE, NASDAQ, LSE, Tokyo, and other major exchanges are open right now, with countdowns to the next open and close.',
  path: '/tools/market-hours',
  keywords:
    'stock market hours, is the stock market open, nyse hours, nasdaq hours, market open time, stock market open today, market hours in my timezone, when does the stock market open',
});

export default function MarketHoursLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
