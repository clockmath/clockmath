'use client';

/**
 * Self-expiring announcement bar for launch weeks. Date-gated in code so it
 * activates and removes itself with zero deploys; dismissals persist per
 * campaign id, so a future campaign (new id) shows again to everyone.
 *
 * To run a new campaign: change CAMPAIGN below — id, window, href, copy.
 * Outside the window the component renders nothing sitewide.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, X } from 'lucide-react';
import { event as gaEvent } from '@/lib/gtag';

const CAMPAIGN = {
  id: 'quiz-launch-sep-2026',
  start: Date.UTC(2026, 8, 8), // Sep 8, 00:00 UTC — launch day
  end: Date.UTC(2026, 8, 16), // hides from Sep 16, 00:00 UTC
  href: '/tools/quiz',
  hideOnPrefix: '/tools/quiz',
};

const dismissKey = `clockmath-banner-dismissed:${CAMPAIGN.id}`;

export default function AnnouncementBanner() {
  // Date + localStorage are client-only concerns; render nothing until
  // mounted so SSR output is stable (the banner is chrome, not content —
  // it shouldn't be in crawled HTML anyway).
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const now = Date.now();
    if (now < CAMPAIGN.start || now >= CAMPAIGN.end) return;
    try {
      if (window.localStorage.getItem(dismissKey)) return;
    } catch {
      /* storage unavailable — show; dismiss just won't persist */
    }
    setVisible(true);
  }, []);

  if (!visible || pathname?.startsWith(CAMPAIGN.hideOnPrefix)) return null;

  return (
    <div className="relative z-20 bg-emerald-600/10 dark:bg-emerald-500/10 border-b border-emerald-600/20 dark:border-emerald-500/20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        <Link
          href={CAMPAIGN.href}
          onClick={() => gaEvent({ action: 'banner_click', params: { campaign: CAMPAIGN.id, from: pathname ?? '' } })}
          className="text-foreground dark:text-slate-200 hover:underline underline-offset-4 min-w-0 truncate"
        >
          <span className="font-semibold">New:</span> the Daily Time Quiz — five questions, one world
          leaderboard. <span className="font-medium text-emerald-700 dark:text-emerald-400">Play today&apos;s →</span>
        </Link>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            try {
              window.localStorage.setItem(dismissKey, '1');
            } catch {
              /* non-persistent dismiss is still a dismiss */
            }
            setVisible(false);
            gaEvent({ action: 'banner_dismiss', params: { campaign: CAMPAIGN.id } });
          }}
          className="shrink-0 grid place-items-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-emerald-600/10 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
