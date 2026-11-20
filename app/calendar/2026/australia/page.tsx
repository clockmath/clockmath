import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2026/australia/ (Nov 2026): NSW public holidays; components/RegionCalendarPage.tsx, lib/regionCalendar.ts
export const metadata = regionMetadata('australia', 2026);

export default function Calendar2026Australia() {
  return <RegionCalendarPage id="australia" year={2026} />;
}
