import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Embeds live inside other sites' pages: never a search result of their own.
// The ClockMath link in the embed code points crawlers at the real page.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
