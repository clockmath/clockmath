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
  formatClock,
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
  wallDateLabel,
  yearOfGaps,
  yearSentence,
  type GapChange,
  type TimePair,
  type Window,
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

/** "9:00 AM to 12:00 PM in New York (2:00 to 5:00 PM in London)" */
function windowWords(p: TimePair, gap: number, w: Window): string {
  return `${formatClock(w.aStart)} to ${formatClock(w.aEnd)} in ${p.a.name}, which is ${formatClock(w.aStart + gap)} to ${formatClock(w.aEnd + gap)}${dayShiftWords(w.bDayShift)} in ${p.b.name}`;
}

/** "Clocks go forward 1 hour, 2:00 AM → 3:00 AM" for the city that moved. */
function changeWords(p: TimePair, c: GapChange): string {
  const parts: string[] = [];
  for (const side of ['a', 'b'] as const) {
    const before = c.before[side];
    const after = c.after[side];
    if (before === after) continue;
    const place = p[side];
    const local = (offset: number) => {
      const d = new Date(c.at + offset * 60_000);
      return formatClock(d.getUTCHours() * 60 + d.getUTCMinutes());
    };
    parts.push(
      `${place.name} ${after > before ? 'goes forward' : 'goes back'} ${formatGap(after - before)} (${local(before)} → ${local(after)}, ${abbrFor(place, before)} → ${abbrFor(place, after)})`,
    );
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
  const gapLabel = (days: number, i: number) => (i === 0 && days > 300 ? 'most of the year' : `about ${days} days a year`);
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
        <p className="st-lede">{p.context}</p>
      </div>

      <TimePairBoard
        a={{ name: p.a.name, zone: p.a.zone, abbr: p.a.abbr }}
        b={{ name: p.b.name, zone: p.b.zone, abbr: p.b.abbr }}
        spec={liveSpec(segs)}
        build={{ ms: BUILD_MS, a: now.a, b: now.b }}
        converterHref={converterHref}
      />

      <section className="st-more">
        <h2>Through the year</h2>
        <div className="st-tp-prose">
          <p>{yearSentence(p, year)}</p>
          {changes.length > 0 ? (
            <>
              <p>
                {changes.every((c) => c.moved === 'both')
                  ? 'Both change their clocks on the same days, so the gap stays the same:'
                  : 'The gap changes when one city changes its clocks and the other doesn’t (yet):'}
              </p>
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
          ) : (
            <p>Neither city changes its clocks, so the difference is the same every day of the year.</p>
          )}
        </div>
      </section>

      <section className="st-more">
        <h2>Working hours and meetings</h2>
        <div className="st-tp-prose">
          {year.map((g, i) => {
            const advice = meetingAdvice(g.gap);
            return (
              <div key={g.gap} className="st-tp-meet">
                {year.length > 1 && (
                  <h3>
                    {gapShort(p, g.gap)} ({gapLabel(g.days, i)})
                  </h3>
                )}
                {advice.work ? (
                  <p>
                    <strong>Shared working hours: {formatGap(advice.work.aEnd - advice.work.aStart)} a day</strong>, from {windowWords(p, g.gap, advice.work)}.
                    {advice.work.aEnd - advice.work.aStart < 8 * 60 && advice.stretch && advice.stretch.aEnd - advice.stretch.aStart > advice.work.aEnd - advice.work.aStart
                      ? ` Starting at 8 and staying until 8 stretches it to ${formatGap(advice.stretch.aEnd - advice.stretch.aStart)}: ${windowWords(p, g.gap, advice.stretch)}.`
                      : ''}
                  </p>
                ) : advice.stretch ? (
                  <p>
                    <strong>No shared 9-to-5 hours.</strong> The best window is {windowWords(p, g.gap, advice.stretch)}: an early start for one, a late finish for the other.
                  </p>
                ) : (
                  <p>
                    <strong>Working hours never overlap.</strong>{' '}
                    {advice.awake ? `Both are awake from ${windowWords(p, g.gap, advice.awake)}.` : 'One of you will be up very early or very late.'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="st-more">
        <h2>Hour by hour</h2>
        <div>
          <TimePairHours
            aName={p.a.name}
            bName={p.b.name}
            gaps={year.map((g, i) => ({ gap: g.gap, label: gapLabel(g.days, i) }))}
          />
        </div>
      </section>

      <p className="st-nudge">
        Another date or time? The <Link href={converterHref}>time zone converter</Link> opens with {p.a.name} and {p.b.name} set, and
        uses the clock rules for whatever day you pick.
      </p>

      <StationFold summary="The two clocks and common questions">
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">The two clocks</h2>
          {[p.a, p.b].map((place) => (
            <p key={place.slug} className="text-muted-foreground mb-3">
              <strong className="text-foreground">{place.full}.</strong> {place.rules} Also on this clock: {place.sameTime.join(', ')}.
            </p>
          ))}
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50">
                <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </StationFold>

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

      <SiteFooter />
    </StationChrome>
  );
}
