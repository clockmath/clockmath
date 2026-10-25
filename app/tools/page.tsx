import ToolsHub from '@/components/ToolsHub';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'All Tools — Free Time & Date Calculators | ClockMath',
  description:
    'Every ClockMath tool in one place: time duration, timesheet, overtime, sleep, timezone, market hours, decimal hours and countdowns. Free, no signup.',
  path: '/tools',
  ogImage: '/og/tool/tools.png?v=2',
  keywords:
    'time calculator tools, free time calculators, work hours tools, timesheet tools, time conversion tools',
});

export default function ToolsIndexPage() {
  return <ToolsHub />;
}
