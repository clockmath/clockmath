import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2026/uk/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('uk', 2026);

export default function Calendar2026Uk() {
  return <RegionCalendarPage id="uk" year={2026} />;
}
