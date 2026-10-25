'use client';

import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StationBoard } from '@/components/station/StationBoard';
import { EmbedCode } from '@/components/embed/EmbedCode';
import StationFold from '@/components/station/StationFold';
import { eventColour, getCountdown } from '@/lib/countdowns';
import { tileShade } from '@/lib/colour';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { event as gaEvent } from '@/lib/gtag';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { getDevice } from '@/lib/device';

// Cross-linked from every event page (minus the current one). Renders in
// static HTML, so it also fixes pages otherwise orphaned from internal links.
export const POPULAR_COUNTDOWNS: Array<{ title: string; href: string }> = [
  { title: 'All holidays', href: '/countdown/holidays/' },
  { title: 'Avengers: Doomsday', href: '/countdown/avengers-doomsday/' },
  { title: 'GTA 6', href: '/countdown/gta-6/' },
  { title: 'Christmas', href: '/countdown/christmas/' },
  { title: 'Halloween', href: '/countdown/halloween/' },
  { title: 'Clocks change', href: '/countdown/daylight-saving-time/' },
  { title: 'Thanksgiving', href: '/countdown/thanksgiving/' },
  { title: 'Black Friday', href: '/countdown/black-friday/' },
  { title: 'Hanukkah', href: '/countdown/hanukkah/' },
  { title: 'New Year', href: '/countdown/new-year/' },
  { title: "Valentine's Day", href: '/countdown/valentines-day/' },
  { title: 'Super Bowl', href: '/countdown/super-bowl/' },
  { title: 'Lunar New Year', href: '/countdown/lunar-new-year/' },
  { title: 'Easter', href: '/countdown/easter/' },
  { title: '4th of July', href: '/countdown/july-4th/' },
  { title: 'Canada Day', href: '/countdown/canada-day/' },
  { title: 'The Weekend', href: '/countdown/weekend/' },
  { title: 'LA 2028 Olympics', href: '/countdown/olympics-2028/' },
  { title: '2027 solar eclipse', href: '/countdown/solar-eclipse-2027/' },
  { title: '2028 annular eclipse', href: '/countdown/annular-eclipse-2028/' },
  { title: '2028 solar eclipse', href: '/countdown/solar-eclipse-2028/' },
  { title: 'Retirement', href: '/countdown/retirement/' },
];


// Share sheet where there is one, else copy the link (with a toast saying so).
export function useShareCountdown() {
  return useCallback(async () => {
    const url = window.location.href;
    const shareTitle = document.title;
    gaEvent({ action: 'event_countdown_shared', params: { device: getDevice(), page: window.location.pathname } });

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        /* user dismissed or unsupported — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Share this countdown anywhere.' });
    } catch {
      toast({ title: 'Copy this link', description: url });
    }
  }, []);
}

export interface EventPageProps {
  /** Styled headline, e.g. <><span>GTA 6</span> Countdown</> */
  heading: ReactNode;
  /** Subtitle under the headline. */
  tagline: string;
  /** Breadcrumb leaf label (e.g. "GTA 6"). */
  breadcrumb: string;
  /** Fixed one-off target. Provide either this or `recurring`/`weekly`. */
  target?: Date;
  /** Recurring annual event ({ month: 0-indexed, day }). */
  recurring?: { month: number; day: number };
  /** Recurring weekly event ({ weekday: 0-indexed, 0 = Sun }). */
  weekly?: { weekday: number; spanDays?: number };
  /** Recurring nth-weekday-of-month event (see EventCountdown). */
  nthWeekday?: { month: number; weekday: number; n: number; offsetDays?: number };
  /** Explicit date ranges for non-Gregorian events (see EventCountdown). */
  dateRanges?: ReadonlyArray<{ start: string; end?: string }>;
  /** Title used inside the timer ("Until {countdownTitle}"). */
  countdownTitle?: string;
  /** Heading shown once the event arrives (e.g. "It's Christmas! 🎄"). */
  arrivedLabel?: string;
  /** Trademark/affiliation disclaimer (use buildEventDisclaimer). */
  disclaimer?: string;
  /**
   * ISO date (YYYY-MM-DD) the page's event facts were last verified against
   * a source. Rendered as a visible trust line and used by the sitemap for
   * an honest lastmod. Update whenever facts are re-checked or edited.
   */
  lastUpdated?: string;
  /**
   * Custom countdown element rendered in place of the built-in timer — used
   * for interactive countdowns where the user supplies their own date.
   */
  countdownSlot?: ReactNode;
  facts?: Array<{ label: string; value: string }>;
  intro: ReactNode;
  /**
   * Extra sections rendered after the intro and before the FAQ. The intro is
   * wrapped in a <p>, so tables, headings, and lists must go here instead.
   */
  extraContent?: ReactNode;
  faqs: Array<{ question: string; answer: string }>;
  /**
   * The event's own colour for the countdown board, and the numerals on it
   * (white unless given). Pick one with at least 4.5:1 contrast to `ink`.
   */
  board?: { color: string; ink?: string };
}

// Shared scaffold for every event countdown landing page, in the station-
// clock design (Oct 2026): heading, the countdown board in the event's own
// colour, share/make-your-own, then facts, intro, FAQ (+ schema) and links to
// the other countdowns as ruled sections. Pages supply only content via props.
export default function EventPage({
  heading,
  tagline,
  breadcrumb,
  target,
  recurring,
  weekly,
  nthWeekday,
  dateRanges,
  countdownTitle,
  arrivedLabel,
  disclaimer,
  lastUpdated,
  countdownSlot,
  extraContent,
  facts,
  intro,
  faqs,
  board,
}: EventPageProps) {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const pathname = usePathname();
  const handleShare = useShareCountdown();
  // Pages in lib/countdowns.ts have an embed at /embed/countdown/<slug>/.
  const slug = pathname?.match(/^\/countdown\/([^/]+)/)?.[1] ?? '';
  const embeddable = getCountdown(slug);

  // Only pages with event facts have anything to verify — a user-picked
  // date (retirement) does not. lastUpdated still feeds the sitemap.
  const verified =
    lastUpdated && facts && facts.length > 0
      ? new Date(`${lastUpdated}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

  return (
    <StationChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode} hero={board}>
      <JsonLd data={getFAQPageSchema(faqs)} />

      <div className="st-intro st-intro-event">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/countdown/">Countdowns</Link> / {breadcrumb}
        </nav>
        <h1 className="st-h1">{heading}</h1>
        <p className="st-lede">{tagline}</p>
      </div>

      {/* --board reaches custom countdowns (eclipses, clock change) too */}
      <div
        className="st-board-wrap"
        style={board ? ({ '--board': board.color, '--board-ink': board.ink ?? '#ffffff', '--board-tile': tileShade(board.color) } as React.CSSProperties) : undefined}
      >
        {countdownSlot ?? (
          <StationBoard
            target={target}
            recurring={recurring}
            weekly={weekly}
            nthWeekday={nthWeekday}
            dateRanges={dateRanges}
            title={countdownTitle ?? breadcrumb}
            arrivedLabel={arrivedLabel}
            disclaimer={disclaimer}
            dateNote={verified && `Event details last verified ${verified}`}
          />
        )}
      </div>
      {countdownSlot && verified && <p className="st-verified">Event details last verified {verified}</p>}

      <div className="st-cta">
        <button type="button" className="st-btn primary" onClick={handleShare}>
          Share this countdown
        </button>
        {embeddable && (
          <a href="#embed" className="st-btn quiet">
            Embed on your site
          </a>
        )}
        <Link href="/tools/countdown/" className="st-btn quiet">
          Make your own countdown
        </Link>
      </div>
      {/* Quiz nudge — countdown visitors are the site's most time-curious
          audience; this is the quiz's main internal discovery surface. */}
      <p className="st-nudge">
        While you wait,{' '}
        <Link href="/tools/quiz" onClick={() => gaEvent({ action: 'quiz_nudge_click', params: { from: pathname ?? 'countdown' } })}>
          try today&apos;s 60-second time quiz
        </Link>
        .
      </p>

      {/* Cross-links between event pages (excludes the page you're on). Every
          countdown, not a top-N slice: a .slice(0, 6) here left half the event
          pages with no internal links at all, so Google never found them. */}
      <section className="st-more">
        <h2>More countdowns</h2>
        <div className="st-chips">
          {/* Each with a dot of its own board colour, like the line colours on the tabs */}
          {POPULAR_COUNTDOWNS.filter((c) => !pathname?.startsWith(c.href.replace(/\/$/, ''))).map((c) => {
            const dot = eventColour(c.href);
            return (
              <Link key={c.href} href={c.href}>
                {dot && <span className="st-dot" style={{ '--dot': dot } as React.CSSProperties} aria-hidden="true" />}
                {c.title}
              </Link>
            );
          })}
        </div>
      </section>

      {/* The embed panel is large (a live preview and the code): folded, and
          opened by the "Embed on your site" button's #embed link. It sits
          with the other fold, so the page ends board, links, then the folds */}
      {embeddable && (
        <StationFold id="embed" summary="Put this countdown on your site">
          <div className="st-fold-plain">
            <EmbedCode
              src={`/embed/countdown/${slug}/`}
              creditHref={`https://clockmath.com${embeddable.path}`}
              label={`Countdown to ${embeddable.name}`}
              id={slug}
            />
          </div>
        </StationFold>
      )}

      {/* Facts, the explanation, date tables and FAQs: folded under the board
          (the FAQ schema above still matches them; they stay in the HTML) */}
      <StationFold>
        {facts && facts.length > 0 && (
          <section className="st-more">
            <h2>Key facts</h2>
            <div>
              <ul className="st-list">
                {facts.map((f) => (
                  <li key={f.label}>
                    <span>{f.label}</span>
                    <span>{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="st-more">
          <h2>About this countdown</h2>
          <div>
            <p style={{ margin: 0 }}>{intro}</p>
          </div>
        </section>

        {extraContent && <div className="st-extra">{extraContent}</div>}

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
      </StationFold>

      <SiteFooter />
      <Toaster />
    </StationChrome>
  );
}
