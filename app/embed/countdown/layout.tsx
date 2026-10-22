import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The custom-countdown embed is a client page and can't export metadata;
// event embeds override this with their own name.
export const metadata: Metadata = { title: 'Countdown — ClockMath' };

export default function CountdownEmbedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
