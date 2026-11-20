import MonthCalendarPage, { monthMetadata, monthParams } from '@/components/MonthCalendarPage';

// /calendar/2026/january/ … /december/ (Nov 2026): components/MonthCalendarPage.tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return monthParams();
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  return monthMetadata(2026, (await params).month);
}

export default async function Calendar2026Month({ params }: { params: Promise<{ month: string }> }) {
  return <MonthCalendarPage year={2026} slug={(await params).month} />;
}
