import type { ReactNode } from 'react';
import { generateSEOMetadata } from '@/lib/seo';

// Metadata lives in this server-component layout because the overtime page
// itself is a client component ("use client") and can't export metadata.
export const metadata = generateSEOMetadata({
  title: 'Overtime Calculator — Time and a Half & Double Time Pay | ClockMath',
  description:
    'Split your week into regular and overtime hours and see exactly what time-and-a-half or double time pays. Set your own overtime threshold and rate. Free, no signup.',
  path: '/tools/overtime',
  keywords:
    'overtime calculator, time and a half calculator, overtime pay calculator, ot calculator, time and a half of 18, overtime hours calculator, double time calculator, 1.5x pay calculator',
});

export default function OvertimeLayout({ children }: { children: ReactNode }) {
  return children;
}
