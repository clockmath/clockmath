import MonthCalendarPage, { monthMetadata, monthParams } from '@/components/MonthCalendarPage';

// /calendar/2027/january/ … /december/ (Nov 2026): components/MonthCalendarPage.tsx
export const dynamicParams = false;

export function generateStaticParams() {
  return monthParams();
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }) {
  return monthMetadata(2027, (await params).month);
}

export default async function Calendar2027Month({ params }: { params: Promise<{ month: string }> }) {
  return <MonthCalendarPage year={2027} slug={(await params).month} />;
}
