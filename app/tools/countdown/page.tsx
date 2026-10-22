'use client';

import Link from 'next/link';
import { CountdownTool } from '@/components/CountdownTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import { Toaster } from '@/components/ui/toaster';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import { useDarkMode } from '@/hooks/use-dark-mode';

const FAQS = [
  {
    question: 'How do I make a countdown to a date?',
    answer:
      'Give it a name if you like, pick the date and time, and press Start countdown. It counts down live in days, hours, minutes and seconds — and in months and years too, for dates further away.',
  },
  {
    question: 'Can I share my countdown?',
    answer:
      'Yes. Share gives you a link with the name, date and time built in, so anyone who opens it sees the same countdown. There is nothing to sign up for and nothing is stored on a server.',
  },
  {
    question: 'Whose time zone does a shared countdown use?',
    answer:
      "Each viewer's own. A countdown to midnight on December 25 reaches zero at midnight wherever the person watching is, which is what you want for holidays and birthdays. For an event at one exact moment worldwide, like a 9 AM New York launch, put the time zone in the name and check it with the timezone converter.",
  },
  {
    question: 'Is my countdown saved?',
    answer:
      'Press Save and it is kept in this browser under Saved countdowns, up to 12 at a time. Saved countdowns stay on your device; to open one on another device, share the link to yourself.',
  },
  {
    question: 'Are there ready-made countdowns?',
    answer:
      'Yes — the Popular row links to live countdowns for holidays like Christmas, Thanksgiving and New Year, plus the weekend, the next clock change, eclipses and big releases. Each has its own page with the dates and details.',
  },
];

export default function CountdownPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();




  return (
    <StationChrome currentTool="countdown" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Countdown Timer',
          description:
            'Create a live countdown to any date and time, then share it with a link. Counts down days, hours, minutes, and seconds.',
          url: 'https://clockmath.com/tools/countdown/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />
      <Toaster />

      <div className="st-intro">

        <nav className="st-crumbs" aria-label="Breadcrumb">

          <Link href="/tools/">Tools</Link> / Countdown Timer

        </nav>

        <h1 className="st-h1">Countdown Timer</h1>

        <p className="st-lede">Count down to any date — and share it with a link</p>

      </div>

      <CountdownTool className="mb-section" />

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          How the countdown works
        </h2>
        <p className="text-muted-foreground">
          The timer counts the exact time left to the date and time you set, using real calendar months and leap years,
          so a countdown to a date next year reads correctly rather than assuming 30-day months. It runs on your own
          clock and timezone: midnight on New Year&apos;s Eve is your midnight. The link you share carries the name, date
          and time, so friends see the same countdown on their own clocks.
        </p>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">
          Related tools
        </h2>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <Link href="/" className="text-primary hover:text-primary/80 font-semibold">
              Time duration calculator
            </Link>{' '}
            — the exact time between two dates or times, without the live timer
          </li>
          <li>
            <Link href="/tools/timezone" className="text-primary hover:text-primary/80 font-semibold">
              Time zone converter
            </Link>{' '}
            — check what time an event happens where your friends are
          </li>
          <li>
            <Link href="/countdown/daylight-saving-time" className="text-primary hover:text-primary/80 font-semibold">
              When do the clocks change?
            </Link>{' '}
            — a live countdown to the next clock change where you are
          </li>
        </ul>
      </section>

      <SiteFooter />
    </StationChrome>
  );
}
