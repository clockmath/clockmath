'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EmbedCode } from '@/components/embed/EmbedCode';
import { buildDayCount } from '@/components/EventCountdown';
import { COUNTDOWNS, COUNTDOWN_SLUGS, eventColour, type CountdownEntry, type CountdownSlug } from '@/lib/countdowns';
import { badgePath } from '@/lib/badges';

// Nov 2026: the embeds had been live three weeks and nobody had copied one;
// each sat in a closed fold on its event page. This page puts them all in
// one place that can rank for "countdown widget" (Bing: 2.6K impressions a
// quarter, the top ten all widget makers) and "free countdown timer".
const GROUPS: Array<{ title: string; slugs: CountdownSlug[] }> = [
  {
    title: 'Holidays and seasons',
    slugs: [
      'thanksgiving', 'black-friday', 'christmas', 'hanukkah', 'new-year', 'lunar-new-year', 'valentines-day', 'ramadan',
      'first-day-of-spring', 'easter', 'first-day-of-summer', 'canada-day', 'july-4th', 'halloween', 'weekend',
    ],
  },
  { title: 'Sport', slugs: ['super-bowl', 'march-madness', 'womens-world-cup-2027', 'olympics-2028'] },
  { title: 'Games and films', slugs: ['gta-6', 'fable', 'avengers-doomsday', 'final-fantasy-7-revelation', 'god-of-war-laufey', 'beyond-the-spider-verse'] },
  { title: 'Sky and clocks', slugs: ['solar-eclipse-2027', 'annular-eclipse-2028', 'solar-eclipse-2028', 'daylight-saving-time'] },
];

const entry = (slug: CountdownSlug) => COUNTDOWNS[slug] as CountdownEntry;
// Names read mid-sentence elsewhere ("the clock change"); as a pick, a capital
const label = (slug: CountdownSlug) => {
  const n = entry(slug).name;
  return n.charAt(0).toUpperCase() + n.slice(1);
};

// Days from the build day: the same on server and client, so the order (and
// the first pick) hydrates. Holidays run soonest first; the weekend and
// anything without a count go last.
const soonness = (slug: CountdownSlug) => {
  const e = entry(slug);
  if (e.eclipse || e.clockChange) return null;
  const { target, recurring, nthWeekday, dateRanges } = e.spec;
  return buildDayCount({ target, recurring, nthWeekday, dateRanges });
};

function groups() {
  const listed = new Set(GROUPS.flatMap((g) => g.slugs));
  const rest = COUNTDOWN_SLUGS.filter((s) => !listed.has(s));
  const all = rest.length ? [...GROUPS, { title: 'More', slugs: rest }] : GROUPS;
  return all.map((g, i) =>
    i === 0
      ? { ...g, slugs: [...g.slugs].sort((a, b) => (soonness(a) ?? Infinity) - (soonness(b) ?? Infinity)) }
      : g,
  );
}

const GROUPED = groups();
const FIRST = GROUPED[0].slugs[0];

export function CountdownWidgetGallery() {
  const [slug, setSlug] = useState<CountdownSlug>(FIRST);
  const codeRef = useRef<HTMLElement>(null);

  // /tools/countdown-widget/#gta-6 opens on that event
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount; the static HTML shows the first pick
    if (fromHash && fromHash in COUNTDOWNS) setSlug(fromHash as CountdownSlug);
  }, []);

  const pick = (s: CountdownSlug) => {
    setSlug(s);
    // On a phone the code is a long way below the picks: bring it up
    const code = codeRef.current;
    if (code && code.getBoundingClientRect().top > window.innerHeight * 0.6) {
      code.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    try {
      window.history.replaceState(null, '', `#${s}`);
    } catch {
      /* ignore */
    }
  };

  const e = entry(slug);
  return (
    <>
      <section className="st-calc st-widgets" aria-label="Choose a countdown">
        {GROUPED.map((g) => (
          <div key={g.title} className="st-widgets-group">
            <h2 className="st-widgets-h">{g.title}</h2>
            <div className="st-widgets-picks" role="group" aria-label={g.title}>
              {g.slugs.map((s) => {
                const dot = eventColour(entry(s).path);
                return (
                  <button key={s} type="button" aria-pressed={s === slug} onClick={() => pick(s)}>
                    {dot && <span className="st-dot" style={{ '--dot': dot } as React.CSSProperties} aria-hidden="true" />}
                    {label(s)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section ref={codeRef} className="st-widgets-code">
        <h2 className="st-widgets-h">{label(slug)} countdown widget</h2>
        <EmbedCode
          key={slug}
          src={`/embed/countdown/${slug}/`}
          creditHref={`https://clockmath.com${e.path}`}
          label={`Countdown to ${e.name}`}
          id={slug}
          badge={e.clockChange ? undefined : { src: badgePath(slug), name: e.name }}
        />
        <p className="st-embedcode-help">
          {e.clockChange
            ? 'It counts to the next clock change where each visitor is, and says so if their clocks don’t change. '
            : ''}
          See the <Link href={e.path}>{e.name} countdown page</Link>, or{' '}
          <Link href="/tools/countdown/">make a countdown to your own date</Link> and press “Embed on your site”.
        </p>
      </section>
    </>
  );
}
