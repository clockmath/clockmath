import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import { generateSEOMetadata } from '@/lib/seo';
import { TIME_PAIRS, formatGap, segments, yearOfGaps } from '@/lib/timePairs';

// Nov 2026: the index of the time difference pages, linked from the time
// zone converter. Each row gives the pair's gaps over the year, computed at
// build time like the pages themselves.
export const metadata = generateSEOMetadata({
  title: 'Time Difference Between Cities: US, UK, Europe & Canada',
  description:
    'The time difference between New York, Los Angeles, Chicago, London, Berlin, Toronto, Calgary, Phoenix and Sydney, with the dates it changes and the best meeting times.',
  path: '/time',
  ogImage: '/og/tool/timezone.png?v=3',
  keywords: 'time difference between cities, city time difference, time difference chart, us uk time difference, est to gmt, pst to gmt, time zones',
});

const BUILD_MS = Date.now();

function gapsWords(slug: string): string {
  const p = TIME_PAIRS.find((x) => x.slug === slug)!;
  const year = yearOfGaps(segments(p.a.zone, p.b.zone, BUILD_MS, BUILD_MS + 365 * 86_400_000), BUILD_MS);
  const words = year.map((g) => (g.gap === 0 ? 'same time' : `${formatGap(g.gap)} ${g.gap > 0 ? 'ahead' : 'behind'}`));
  return words.length === 1 ? `${p.b.name} ${words[0]} all year` : `${p.b.name} ${words.join(' or ')}`;
}

export default function TimeDifferencesPage() {
  return (
    <StationChrome currentTool="timezone">
      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/timezone/">Time zones</Link> / Time differences
        </nav>
        <h1 className="st-h1">Time Differences</h1>
        <p className="st-lede">The time now in two cities, the dates their difference changes, and when both are at work</p>
      </div>

      <section className="st-calc">
        <ul className="st-list st-tp-index">
          {TIME_PAIRS.map((p) => (
            <li key={p.slug}>
              <Link href={`/time/${p.slug}/`}>
                {p.a.name} to {p.b.name}
              </Link>
              <span>{gapsWords(p.slug)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="st-nudge">
        Two other places? The <Link href="/tools/timezone/">time zone converter</Link> takes any city, on any date.
      </p>

      <SiteFooter />
    </StationChrome>
  );
}
