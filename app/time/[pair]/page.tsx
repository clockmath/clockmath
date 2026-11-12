import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { TimePairBoard } from '@/components/TimePairBoard';
import { TimePairHours } from '@/components/TimePairHours';
import { generateSEOMetadata } from '@/lib/seo';
import {
  TIME_PAIRS,
  abbrFor,
  dayShiftWords,
  formatGap,
  gapChanges,
  gapOf,
  getTimePair,
  liveSpec,
  meetingAdvice,
  pairDescription,
  pairFaqs,
  pairTitle,
  segmentAt,
  segments,
  shareWords,
  wallDateLabel,
  windowRange,
  yearOfGaps,
  yearSentence,
  type GapChange,
  type TimePair,
} from '@/lib/timePairs';

// Nov 2026: one static page per pair in lib/timePairs.ts. Every figure is
// computed at build time from the build instant: the year of gaps, the
// change dates and the meeting windows stay true until the dates pass (a
// year or more); the sentence and clocks on the board are kept current by
// the worker and the browser (components/TimePairBoard.tsx).
export const dynamicParams = false;

export function generateStaticParams() {
  return TIME_PAIRS.map((p) => ({ pair: p.slug }));
}

const YEAR_MS = 365 * 86_400_000;
const BUILD_MS = Date.now();

function pairData(p: TimePair) {
  const segs = segments(p.a.zone, p.b.zone, BUILD_MS, BUILD_MS + 2 * YEAR_MS);
  const year = yearOfGaps(segs, BUILD_MS);
  const changes = gapChanges(segs).filter((c) => c.at < BUILD_MS + 1.5 * YEAR_MS).slice(0, 6);
  return { segs, year, changes, faqs: pairFaqs(p, year, gapChanges(segs)) };
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const p = getTimePair(pair);
  if (!p) return {};
  const { segs, year } = pairData(p);
  const now = segmentAt(segs, BUILD_MS);
  return generateSEOMetadata({
    title: pairTitle(p),
    description: pairDescription(p, year),
    path: `/time/${p.slug}`,
    ogImage: '/og/tool/timezone.png?v=3',
    keywords: [
      `${p.a.name} to ${p.b.name} time`,
      `${p.a.name} ${p.b.name} time difference`,
      `time in ${p.b.name}`,
      `${p.b.name} time to ${p.a.name} time`,
      `${abbrFor(p.a, now.a)} to ${abbrFor(p.b, now.b)}`,
      `best time to call ${p.b.name} from ${p.a.name}`,
    ].join(', '),
  });
}

/** "New York clocks go forward (EST → EDT)" for the city that moved. */
function changeWords(p: TimePair, c: GapChange): string {
  const parts: string[] = [];
  for (const side of ['a', 'b'] as const) {
    const before = c.before[side];
    const after = c.after[side];
    if (before === after) continue;
    const place = p[side];
    parts.push(`${place.name} clocks go ${after > before ? 'forward' : 'back'} (${abbrFor(place, before)} → ${abbrFor(place, after)})`);
  }
  return parts.join('; ');
}

/** "London 4 hours ahead", "Same time" */
const gapShort = (p: TimePair, gap: number) =>
  gap === 0 ? 'Same time' : `${p.b.name} ${formatGap(gap)} ${gap > 0 ? 'ahead' : 'behind'}`;

const changeDay = (c: GapChange) => wallDateLabel(c.at, c.moved === 'b' ? c.after.b : c.after.a);

export default async function TimePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = getTimePair(pair);
  if (!p) notFound();
  const { segs, year, changes, faqs } = pairData(p);
  const now = segmentAt(segs, BUILD_MS);
  const converterHref = `/tools/timezone/?${new URLSearchParams({ from: p.a.zone, to: p.b.zone, fromName: p.a.name, toName: p.b.name })}`;
  const others = TIME_PAIRS.filter((o) => o.slug !== p.slug);
  const related = [...others.filter((o) => [o.a.slug, o.b.slug].some((s) => s === p.a.slug || s === p.b.slug)), ...others.filter((o) => ![o.a.slug, o.b.slug].some((s) => s === p.a.slug || s === p.b.slug))];

  return (
    <StationChrome currentTool="timezone">
      <JsonLd data={getFAQPageSchema(faqs)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Time zone converter', item: 'https://clockmath.com/tools/timezone/' },
            { '@type': 'ListItem', position: 2, name: 'Time differences', item: 'https://clockmath.com/time/' },
            { '@type': 'ListItem', position: 3, name: `${p.a.name} to ${p.b.name}`, item: `https://clockmath.com/time/${p.slug}/` },
          ],
        }}
      />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/timezone/">Time zones</Link> / <Link href="/time/">Time differences</Link> / {p.a.name} to {p.b.name}
        </nav>
        <h1 className="st-h1">
          {p.a.name} to {p.b.name} Time
        </h1>
        {/* No lede (Nov 2026, Mark): the board with the two times and the
            difference is the answer, so it comes straight after the heading */}
      </div>

      <TimePairBoard
        a={{ name: p.a.name, zone: p.a.zone, abbr: p.a.abbr }}
        b={{ name: p.b.name, zone: p.b.zone, abbr: p.b.abbr }}
        spec={liveSpec(segs)}
        build={{ ms: BUILD_MS, a: now.a, b: now.b }}
        converterHref={converterHref}
      />

      {/* Nov 2026, Mark: the page ends at the board; the rest is folded. It
          stays in the HTML, where Bing and Copilot read it, and it is what
          makes each pair's page its own (dates, meeting times, the chart) */}
      <StationFold id="details" summary="Clock changes, meeting times and hour chart">
        <section className="st-more">
          <h2>Through the year</h2>
          <div className="st-tp-prose">
            {year.length === 1 ? (
              // One gap all year: the board already shows it, so say only that
              // it holds, and why. The next date goes once it has passed
              <p>
                The difference stays the same all year:{' '}
                {changes.length === 0 ? (
                  'neither city changes its clocks.'
                ) : (
                  <>
                    both change their clocks on the same days
                    <span data-live-until={String(changes[0].at)}>, next on {changeDay(changes[0])}</span>.
                  </>
                )}
              </p>
            ) : (
              <>
                <p>{yearSentence(p, year)}</p>
                <ul className="st-list st-tp-changes">
                  {changes.map((c) => (
                    // Removed by the worker once the change has happened
                    <li key={c.at} data-live-until={String(c.at)}>
                      <span>
                        <strong>{changeDay(c)}</strong>
                        <br />
                        {changeWords(p, c)}
                      </span>
                      <span>{gapShort(p, gapOf(c.after))}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="st-more">
          <h2>Best times to meet</h2>
          <div>
            <ul className="st-list st-tp-meet">
              {year.map((g, i) => {
                const { work, stretch, awake } = meetingAdvice(g.gap);
                const best = work ?? stretch ?? awake;
                const label = work ? 'Both at work (9 to 5)' : stretch ? 'Early for one, late for the other' : 'Both awake';
                return (
                  <li key={g.gap}>
                    <span>
                      {label}
                      {year.length > 1 && (
                        <small>
                          {gapShort(p, g.gap)}, {shareWords(year[i])}
                        </small>
                      )}
                    </span>
                    <span>
                      {best && g.gap === 0 ? (
                        `${windowRange(best)} in both`
                      ) : best ? (
                        <>
                          {windowRange(best)} {p.a.name}
                          <br />
                          {windowRange(best, g.gap)}
                          {dayShiftWords(best.bDayShift)} {p.b.name}
                        </>
                      ) : (
                        'No good time'
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="st-more">
          <h2>Hour by hour</h2>
          <div>
            <TimePairHours
              aName={p.a.name}
              bName={p.b.name}
              gaps={year.map((g, i) => ({ gap: g.gap, label: shareWords(year[i]) }))}
            />
          </div>
        </section>

        <section className="st-more">
          <h2>Questions</h2>
          <div className="st-faq">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="st-more">
          <h2>Other time differences</h2>
          <div className="st-chips">
            {related.map((o) => (
              <Link key={o.slug} href={`/time/${o.slug}/`}>
                {o.a.name} to {o.b.name}
              </Link>
            ))}
            <Link href="/time/">All time differences</Link>
          </div>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
