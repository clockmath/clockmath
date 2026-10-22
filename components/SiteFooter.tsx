/**
 * components/SiteFooter.tsx
 * The station-design footer: ruled across the top in ink like every other
 * band, left-aligned, in columns: the brand with contact and feedback, the
 * tools, popular countdowns, and site pages; a thin rule, then © and the
 * Buy Me a Coffee link. Server Component (FeedbackForm is the client part).
 *
 * The countdown column is evergreen on purpose: no seasonal list to go
 * stale. Every page carries these links, so they also help crawlers find
 * the tools and the most-searched countdowns from anywhere on the site.
 */
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';
import './station/footer.css';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Tools',
    links: [
      { label: 'Time between times', href: '/' },
      { label: 'Work hours', href: '/tools/timesheet/' },
      { label: 'Overtime', href: '/tools/overtime/' },
      { label: 'Minutes to decimal', href: '/tools/decimal-hours/' },
      { label: 'Time zones', href: '/tools/timezone/' },
      { label: 'Sleep', href: '/tools/sleep/' },
      { label: 'Market hours', href: '/tools/market-hours/' },
      { label: 'Daily quiz', href: '/tools/quiz/' },
      { label: 'All tools', href: '/tools/' },
    ],
  },
  {
    title: 'Countdowns',
    links: [
      { label: 'Christmas', href: '/countdown/christmas/' },
      { label: 'New Year', href: '/countdown/new-year/' },
      { label: 'Thanksgiving', href: '/countdown/thanksgiving/' },
      { label: 'Halloween', href: '/countdown/halloween/' },
      { label: 'Easter', href: '/countdown/easter/' },
      { label: 'Clock change', href: '/countdown/daylight-saving-time/' },
      { label: 'The weekend', href: '/countdown/weekend/' },
      { label: 'All holidays', href: '/countdown/holidays/' },
      { label: 'Make your own', href: '/tools/countdown/' },
    ],
  },
  {
    title: 'Site',
    links: [
      { label: 'Guides', href: '/articles/' },
      { label: 'Contact', href: '/contact/' },
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Terms', href: '/terms/' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="st-footer">
      <div className="st-footer-cols">
        <div className="st-footer-brand">
          <p className="st-footer-name">ClockMath</p>
          <p>Free time calculators. No ads, no sign-up.</p>
          <p>
            <a href="mailto:hello@clockmath.com?subject=ClockMath%20feedback">hello@clockmath.com</a>
          </p>
          <FeedbackForm />
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="st-footer-base">
        <span>© {year} ClockMath</span>
        <a
          href="https://www.buymeacoffee.com/clockmath?utm_source=clockmath&utm_medium=site&utm_campaign=footer_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Coffee aria-hidden="true" />
          Buy me a coffee
        </a>
      </div>
    </footer>
  );
}
