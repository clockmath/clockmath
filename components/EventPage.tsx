'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { EventCountdown } from '@/components/EventCountdown';
import SiteFooter from '@/components/SiteFooter';
import PageChrome from '@/components/PageChrome';
import JsonLd, { getFAQPageSchema } from '@/components/JsonLd';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { event as gaEvent } from '@/lib/gtag';

const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches
    ? 'mobile'
    : 'desktop';

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
  weekly?: { weekday: number };
  /** Title used inside the timer ("Until {countdownTitle}"). */
  countdownTitle?: string;
  /** Heading shown once the event arrives (e.g. "It's Christmas! 🎄"). */
  arrivedLabel?: string;
  /** Trademark/affiliation disclaimer (use buildEventDisclaimer). */
  disclaimer?: string;
  /**
   * Custom countdown element rendered in place of the built-in timer — used
   * for interactive countdowns where the user supplies their own date.
   */
  countdownSlot?: ReactNode;
  facts?: Array<{ label: string; value: string }>;
  intro: ReactNode;
  faqs: Array<{ question: string; answer: string }>;
}

// Shared scaffold for every event countdown landing page: dark-mode wiring,
// chrome, header/breadcrumb, the live timer, facts, intro, FAQ (+ schema) and
// a CTA back to the countdown tool. Pages supply only their content via props.
export default function EventPage({
  heading,
  tagline,
  breadcrumb,
  target,
  recurring,
  weekly,
  countdownTitle,
  arrivedLabel,
  disclaimer,
  countdownSlot,
  facts,
  intro,
  faqs,
}: EventPageProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('clockmath-darkmode');
    if (saved) setIsDarkMode(saved === 'true');
    else setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('clockmath-darkmode', next.toString());
      return next;
    });
  }, []);

  const handleShare = useCallback(async () => {
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

  return (
    <PageChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd data={getFAQPageSchema(faqs)} />

      <header className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold">{heading}</h1>
        <p className="text-slate-700 dark:text-emerald-200 text-base sm:text-lg font-medium mt-1">{tagline}</p>
        <nav className="text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:text-primary transition-colors">
            ClockMath
          </Link>
          <span className="mx-2">›</span>
          <Link href="/tools/countdown/" className="hover:text-primary transition-colors">
            Countdown
          </Link>
          <span className="mx-2">›</span>
          <span>{breadcrumb}</span>
        </nav>
      </header>

      {countdownSlot ? (
        <div className="mb-6">{countdownSlot}</div>
      ) : (
        <EventCountdown
          target={target}
          recurring={recurring}
          weekly={weekly}
          title={countdownTitle ?? breadcrumb}
          arrivedLabel={arrivedLabel}
          disclaimer={disclaimer}
          className="mb-6"
        />
      )}

      <div className="flex justify-center mb-6">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share this countdown
        </button>
      </div>

      {facts && facts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          {facts.map((f) => (
            <div
              key={f.label}
              className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 dark:border-slate-700/50 text-center"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</div>
              <div className="font-semibold text-foreground dark:text-slate-100 mt-1">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50 mb-6">
        <p className="text-foreground dark:text-slate-200 leading-relaxed">{intro}</p>
      </div>

      <section className="bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 dark:border-slate-700/50 mb-6">
        <h2 className="text-xl font-bold text-foreground dark:text-slate-100 mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-foreground dark:text-slate-100">{faq.question}</h3>
              <p className="text-muted-foreground dark:text-slate-400 mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground mb-3">Want a countdown to your own event?</p>
        <Link
          href="/tools/countdown/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
        >
          Make your own countdown
        </Link>
      </div>

      <SiteFooter />
      <Toaster />
    </PageChrome>
  );
}
