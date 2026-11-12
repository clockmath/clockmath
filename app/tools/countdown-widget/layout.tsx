import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Nov 2026: every countdown embed in one indexable place. Bing: "countdown
// widget" 2.6K impressions a quarter, "free countdown timer" 2.4K, with
// widget makers in the top ten. Under 65 characters (Bing flags longer).
// Uses the countdown tool's share card until this page has its own.
export const metadata = generateSEOMetadata({
  title: 'Free Countdown Widget for Your Website: Embed Code | ClockMath',
  description:
    'Free countdown widgets for your website or blog: Christmas, Thanksgiving, New Year, GTA 6, eclipses and more. Copy one line of code. No sign-up, no cookies.',
  path: '/tools/countdown-widget',
  ogImage: '/og/tool/countdown.png?v=3',
  keywords:
    'countdown widget, countdown widget for website, free countdown timer, embed countdown timer, christmas countdown widget, countdown clock for website, countdown timer html, countdown badge',
});

export default function CountdownWidgetLayout({ children }: { children: ReactNode }) {
  return children;
}
