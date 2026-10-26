import { Metadata } from 'next';
import Link from 'next/link';
import { generateSEOMetadata } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Timezone Converter Guides - All Scenarios | ClockMath',
  description: 'Complete guide to timezone conversion for remote work, travel, gaming, family calls, and more. Master global time coordination with ClockMath.',
  path: '/articles/timezone-converters',
  type: 'website',
  keywords: 'timezone converter, time zone conversion, global time, remote work, international travel, family calls, gaming events, stock market hours',
});

interface TimezoneGuide {
  title: string;
  description: string;
  href: string;
  category: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime: string;
  useCase: string;
}

const TIMEZONE_GUIDES: TimezoneGuide[] = [
  {
    title: 'Remote Work Meeting Timezone Converter',
    description: 'Schedule global meetings without confusion. Perfect for distributed teams and international collaborations.',
    href: '/articles/timezone-converter-remote-work-meetings',
    category: 'Business',
    icon: '💼',
    difficulty: 'Beginner',
    readTime: '3 min read',
    useCase: 'Scheduling meetings across different time zones',
  },
  {
    title: 'Timezone Converter for Family Calls',
    description: 'Stay connected with loved ones abroad. Find the perfect time to call without waking anyone up.',
    href: '/articles/timezone-converter-family-calls',
    category: 'Personal',
    icon: '👨‍👩‍👧‍👦',
    difficulty: 'Beginner',
    readTime: '4 min read',
    useCase: 'Calling family and friends internationally',
  },
  {
    title: 'Travel Timezone Converter',
    description: 'Plan international trips with confidence. Handle jet lag and coordinate travel schedules efficiently.',
    href: '/articles/travel-timezone-converter',
    category: 'Travel',
    icon: '✈️',
    difficulty: 'Intermediate',
    readTime: '5 min read',
    useCase: 'International travel planning and jet lag management',
  },
  {
    title: 'Gaming Events Timezone Converter',
    description: 'Never miss game releases, esports tournaments, or online gaming events again.',
    href: '/articles/timezone-converter-gaming-events',
    category: 'Gaming',
    icon: '🎮',
    difficulty: 'Beginner',
    readTime: '3 min read',
    useCase: 'Game launches and esports event timing',
  },
  {
    title: 'Stock Market Timezone Converter',
    description: 'Track global market opens and closes. Master trading across NYSE, LSE, Tokyo, and more.',
    href: '/articles/stock-market-timezone-converter',
    category: 'Finance',
    icon: '📈',
    difficulty: 'Advanced',
    readTime: '6 min read',
    useCase: 'Global stock market trading and analysis',
  },
];


export default function TimezoneConvertersHubPage() {
  return (
    <StationChrome currentTool="articles">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Timezone Converter Guides',
          description:
            'Guides for converting time across timezones — remote work, travel, gaming, family calls, and more.',
          url: 'https://clockmath.com/articles/timezone-converters/',
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: TIMEZONE_GUIDES.map((guide, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: guide.title,
              url: `https://clockmath.com${guide.href}/`,
            })),
          },
        }}
      />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/articles/">Guides</Link> / Time zones
        </nav>
        <h1 className="st-h1">Timezone Converter Guides</h1>
        <p className="st-lede">Time coordination for every situation: meetings, family calls, travel, games and markets.</p>
      </div>

      <ul className="st-hub">
        {TIMEZONE_GUIDES.map((guide) => (
          <li key={guide.href} data-line="guides">
            <Link href={guide.href}>
              <span className="st-hub-title">{guide.title}</span>
              <span className="st-hub-desc">{guide.description}</span>
              <span className="st-hub-live">{guide.readTime}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="st-more">
        <h2>Converting a time right now?</h2>
        <div>
          <p style={{ marginTop: 0 }}>
            Whether you&apos;re scheduling international meetings, calling family abroad, or tracking global events,
            the converter does the daylight-saving maths for both places.
          </p>
          <Link href="/tools/timezone" className="st-btn primary">
            Open the time zone converter
          </Link>
        </div>
      </section>

      <section className="st-more">
        <h2>Essential timezone tips</h2>
        <div className="st-faq">
          <h3>Always include the time zone</h3>
          <p>When scheduling, always specify the time zone (&ldquo;3 PM ET&rdquo;, not just &ldquo;3 PM&rdquo;).</p>
          <h3>Account for daylight saving</h3>
          <p>Daylight saving changes can shift a meeting by an hour, and different countries change on different dates.</p>
          <h3>Use UTC as the reference</h3>
          <p>For global teams, UTC gives everyone the same fixed reference point.</p>
          <h3>Double-check important conversions</h3>
          <p>Verify the conversion for anything that matters, especially across a clock change.</p>
        </div>
      </section>

      <section className="st-more">
        <h2>Related tools</h2>
        <div>
          <ul className="st-links">
            <li>
              <Link href="/tools/timezone">Time zone converter</Link>
              <span>Convert a time between any two places</span>
            </li>
            <li>
              <Link href="/">Time duration calculator</Link>
              <span>The time between two times</span>
            </li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </StationChrome>
  );
}
