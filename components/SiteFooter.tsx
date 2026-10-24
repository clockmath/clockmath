/**
 * components/SiteFooter.tsx
 * A compact footer: one line with the wordmark and the site's main links,
 * one with ©, contact, the feedback form and Buy Me a Coffee. Server
 * Component (FeedbackForm is the client part).
 *
 * Oct 2026: the four-column version (22 links) was 470px tall on desktop
 * and 823px on phones; the nav already links every main tool, and All tools
 * and the countdowns hub link the rest.
 */
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';
import './station/footer.css';

const LINKS: Array<{ label: string; href: string }> = [
  { label: 'All tools', href: '/tools/' },
  { label: 'Countdowns', href: '/countdown/holidays/' },
  { label: 'Guides', href: '/articles/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="st-footer">
      <div className="st-footer-row">
        <Link href="/" className="st-footer-name">
          ClockMath
        </Link>
        <nav aria-label="Site" className="st-footer-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="st-footer-base">
        <span>© {year} ClockMath</span>
        <a href="mailto:hello@clockmath.com?subject=ClockMath%20feedback">hello@clockmath.com</a>
        <FeedbackForm />
        <a
          href="https://www.buymeacoffee.com/clockmath?utm_source=clockmath&utm_medium=site&utm_campaign=footer_link"
          target="_blank"
          rel="noopener noreferrer"
          className="st-footer-coffee"
        >
          <Coffee aria-hidden="true" />
          Buy me a coffee
        </a>
      </div>
    </footer>
  );
}
