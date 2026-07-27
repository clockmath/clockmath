import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stock Market Hours — Is the Market Open? | ClockMath',
  description:
    'Live stock market hours in your timezone. See whether the NYSE, NASDAQ, LSE, Tokyo, and other major exchanges are open right now, with countdowns to the next open and close.',
  alternates: {
    canonical: 'https://clockmath.com/tools/market-hours/',
  },
  openGraph: {
    title: 'Stock Market Hours — Is the Market Open? | ClockMath',
    description:
      'Live open/closed status for the NYSE, NASDAQ, LSE, Tokyo, and other major exchanges, converted to your local timezone.',
    type: 'website',
    url: 'https://clockmath.com/tools/market-hours/',
    siteName: 'ClockMath',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ClockMath Stock Market Hours',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketHoursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
