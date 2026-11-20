import RegionCalendarPage, { regionMetadata } from '@/components/RegionCalendarPage';

// /calendar/2027/uk/ (Nov 2026): components/RegionCalendarPage.tsx, holidays in lib/regionCalendar.ts
export const metadata = regionMetadata('uk', 2027);

export default function Calendar2027Uk() {
  return <RegionCalendarPage id="uk" year={2027} />;
}
