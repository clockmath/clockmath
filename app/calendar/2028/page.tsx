'use client';

import YearCalendarPage from '@/components/YearCalendarPage';

// Another year: copy this folder, change the year here and in layout.tsx,
// and add it to CALENDAR_YEARS (lib/yearCalendar.ts).
export default function Calendar2028() {
  return <YearCalendarPage year={2028} />;
}
