import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import { generateSEOMetadata } from '@/lib/seo';
import { TIME_PAIRS, formatGap, segments, yearOfGaps, type TimePair } from '@/lib/timePairs';

// Nov 2026: the index of the time difference pages, linked from the time
// zone converter. Each row gives the pair's gaps over the year, computed at
// build time like the pages themselves.
export const metadata = generateSEOMetadata({
  title: 'Time Difference Between Cities: US, Canada, Europe & Asia',
  description:
    'The time difference between US and Canadian cities and London, Paris, Berlin, Athens, Mumbai, Manila, Tokyo, Sydney and Lusaka, with the dates it changes and the best meeting times.',
  path: '/time',
  ogImage: '/og/tool/timezone.png?v=3',
  keywords: 'time difference between cities, city time difference, time difference chart, us uk time difference, est to gmt, pst to gmt, time zones',
});

const BUILD_MS = Date.now();

// "London 7 or 8 hours ahead", "Sydney 17, 18 or 19 hours ahead",
// "Los Angeles 2 hours behind all year", "Same time or Los Angeles 1 hour behind"
function gapsWords(slug: string): string {
  const p = TIME_PAIRS.find((x) => x.slug === slug)!;
  const year = yearOfGaps(segments(p.a.zone, p.b.zone, BUILD_MS, BUILD_MS + 365 * 86_400_000), BUILD_MS);
  const gaps = year.map((g) => g.gap).sort((x, y) => Math.abs(x) - Math.abs(y));
  const word = (gap: number) => (gap > 0 ? 'ahead' : 'behind');
  if (gaps.length === 1) return gaps[0] === 0 ? 'Same time all year' : `${p.b.name} ${formatGap(gaps[0])} ${word(gaps[0])} all year`;
  if (gaps.includes(0)) {
    const rest = gaps.filter((g) => g !== 0);
    return `Same time or ${p.b.name} ${rest.map((g) => formatGap(g)).join(' or ')} ${word(rest[0])}`;
  }
  const list = (xs: string[]) => `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`;
  // Whole hours share the unit ("17, 18 or 19 hours"); half hours keep their own
  if (gaps.some((g) => g % 60 !== 0)) return `${p.b.name} ${list(gaps.map((g) => formatGap(g)))} ${word(gaps[0])}`;
  return `${p.b.name} ${list(gaps.map((g) => String(Math.abs(g) / 60)))} hours ${word(gaps[0])}`;
}

const GROUPS = ['US and Canada', 'Europe', 'Asia and Australia', 'Africa'] as const;

/** The list a pair goes in: the region of whichever city is farther from North America. */
function groupOf(p: TimePair): (typeof GROUPS)[number] {
  const zones = [p.a.zone, p.b.zone];
  if (zones.some((z) => z.startsWith('Asia/') || z.startsWith('Australia/'))) return 'Asia and Australia';
  if (zones.some((z) => z.startsWith('Africa/'))) return 'Africa';
  if (zones.some((z) => z.startsWith('Europe/'))) return 'Europe';
  return 'US and Canada';
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

      {/* Nov 2026: 34 pairs, so one list per region (the farther city's) */}
      {GROUPS.map((g, i) => (
        <section key={g} className={i === 0 ? 'st-calc st-tp-group' : 'st-tp-group'}>
          <h2>{g}</h2>
          <ul className="st-list st-tp-index">
            {TIME_PAIRS.filter((p) => groupOf(p) === g).map((p) => (
              <li key={p.slug}>
                <Link href={`/time/${p.slug}/`}>
                  {p.a.name} to {p.b.name}
                </Link>
                <span>{gapsWords(p.slug)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="st-nudge">
        Two other places? The <Link href="/tools/timezone/">time zone converter</Link> takes any city, on any date.
        Every pair above also comes as a widget for your own site: open it and see “Put these clocks on your site”.
      </p>

      <SiteFooter />
    </StationChrome>
  );
}
