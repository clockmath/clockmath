import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2027/australia/ (Nov 2026): NSW public holidays; components/RegionCalendarPage.tsx, lib/regionCalendar.ts
export const metadata = regionMetadata('australia', 2027);

export default function Calendar2027Australia() {
  return <RegionCalendarPage id="australia" year={2027} />;
}
