import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2027/canada/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('canada', 2027);

export default function Calendar2027Canada() {
  return <RegionCalendarPage id="canada" year={2027} />;
}
