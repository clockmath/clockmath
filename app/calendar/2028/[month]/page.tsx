import MonthCalendarPage, { monthMetadata, monthParams } from '@/components/MonthCalendarPage';

// /calendar/2028/january/ … /december/ (Nov 2026): components/MonthCalendarPage.tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return monthParams();
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  return monthMetadata(2028, (await params).month);
}

export default async function Calendar2028Month({ params }: { params: Promise<{ month: string }> }) {
  return <MonthCalendarPage year={2028} slug={(await params).month} />;
}
