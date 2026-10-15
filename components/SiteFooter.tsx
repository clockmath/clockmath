/**
 * components/SiteFooter.tsx
 * Flat footer: one row of site links, contact + feedback, and a quiet
 * Buy Me a Coffee text link. Server Component; no 'use client' needed.
 *
 * Until Oct 2026 this was a full card with an amber Buy Me a Coffee button —
 * the only non-emerald accent on the site, so every page ended with its
 * loudest element being a donation ask, competing with the page's own
 * primary action. The link stays (it is the site's only monetization) but
 * now reads like the other footer links.
 */
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 sm:mt-section border-t border-border/60 dark:border-slate-700/60 pt-6 pb-2 text-center text-xs sm:text-sm text-muted-foreground dark:text-slate-400">
      {/* One link row — the nav's All tools panel carries every tool on
          every page, so listing all nine here again was pure clutter. */}
      <nav aria-label="Site" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-3">
        <Link href="/tools" className="hover:text-foreground underline underline-offset-4 font-medium">
          All tools
        </Link>
        <Link href="/articles" className="hover:text-foreground underline underline-offset-4">
          Guides
        </Link>
        <Link href="/contact" className="hover:text-foreground underline underline-offset-4">
          Contact
        </Link>
        <Link href="/terms" className="hover:text-foreground underline underline-offset-4">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">
          Privacy
        </Link>
      </nav>

      {/* Contact */}
      <div className="mb-3">
        <a
          href="mailto:hello@clockmath.com?subject=ClockMath%20feedback"
          className="underline underline-offset-4 hover:text-foreground"
        >
          hello@clockmath.com
        </a>
        <FeedbackForm />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
        <span className="opacity-75">© {year} ClockMath</span>
        <span aria-hidden="true" className="opacity-50">·</span>
        <a
          href="https://www.buymeacoffee.com/clockmath?utm_source=clockmath&utm_medium=site&utm_campaign=footer_link"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground underline underline-offset-4"
        >
          <Coffee className="w-3.5 h-3.5" aria-hidden="true" />
          Buy me a coffee
        </a>
      </div>
    </footer>
  );
}
