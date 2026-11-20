import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2026/canada/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('canada', 2026);

export default function Calendar2026Canada() {
  return <RegionCalendarPage id="canada" year={2026} />;
}
