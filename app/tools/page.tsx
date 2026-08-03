import ToolsHub from '@/components/ToolsHub';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'All Tools — Free Time & Date Calculators | ClockMath',
  description:
    'Every ClockMath tool in one place: time duration calculator, work hours and timesheet calculator, live stock market hours, timezone converter, decimal hours converter, and countdown timer. Free, no signup.',
  path: '/tools',
  keywords:
    'time calculator tools, free time calculators, work hours tools, timesheet tools, time conversion tools',
});

export default function ToolsIndexPage() {
  return <ToolsHub />;
}
