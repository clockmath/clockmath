import Image from 'next/image';
import Link from 'next/link';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';
import { generateSEOMetadata } from '@/lib/seo';
import deck from './deck.jpg';

// Nov 2026: ClockMath's iPhone app, TOrDO. Until now the site never mentioned
// it. A server page (no state), so all of it is in the static HTML.
// Wording rules: "designed with ADHD in mind", never that it treats or
// manages ADHD; the paywall is on for new users from build 44, so only the
// basics are called free.
export const metadata = generateSEOMetadata({
  title: 'TOrDO: ADHD Task Planner for iPhone and iPad | ClockMath',
  description:
    'TOrDO, a to-do list taken one card at a time: a deck deals seven tasks, swipe right to plan them for Today, then work through Today with a gentle timer.',
  path: '/tordo',
  ogImage: '/og/tordo.png?v=1',
});

// App Store campaign link: ct=website tells App Store Connect the install
// came from this page.
const APP_STORE = 'https://apps.apple.com/app/apple-store/id6759168718?pt=128300986&ct=website&mt=8';

export default function TordoPage() {
  return (
    <StationChrome currentTool="tordo">
      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/">ClockMath</Link> / TOrDO for iPhone
        </nav>
        <h1 className="st-h1">Your to-do list, one card at a time.</h1>
        <p className="st-lede">For brains that freeze at a long list.</p>
      </div>

      <section className="st-panel mb-section" aria-labelledby="tordo-name">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="max-w-[60ch]">
            <h2 id="tordo-name" className="text-xl sm:text-2xl font-bold text-foreground mb-1">
              TOrDO: ADHD Task Planner
            </h2>
            <p className="text-muted-foreground mb-5">For iPhone and iPad, from ClockMath</p>
            <p className="mb-4">
              A deck deals you seven task cards. Swipe right to plan a task for Today, then work through Today one
              task at a time, with a gentle timer for the one in front of you.
            </p>
            <p className="mb-4">
              It&rsquo;s designed with ADHD in mind: one thing on screen at once instead of a list to scan. The basics
              (the deck, Today, recurring tasks) are free.
            </p>
            <div className="st-actions">
              <a className="st-btn primary" href={APP_STORE} target="_blank" rel="noopener">
                Get TOrDO on the App Store
              </a>
            </div>
          </div>
          <Image
            src={deck}
            alt="TOrDO on an iPhone: the deck shows one task card, “Pick up the prescription, 15 min”, with buttons to skip it or plan it for Today."
            sizes="(min-width: 640px) 280px, 70vw"
            className="w-[70vw] max-w-[280px] h-auto mx-auto sm:mx-0 rounded-2xl border border-border/50"
          />
        </div>
      </section>

      <SiteFooter />
    </StationChrome>
  );
}
