import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2028/canada/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('canada', 2028);

export default function Calendar2028Canada() {
  return <RegionCalendarPage id="canada" year={2028} />;
}
