import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2028/uk/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('uk', 2028);

export default function Calendar2028Uk() {
  return <RegionCalendarPage id="uk" year={2028} />;
}
