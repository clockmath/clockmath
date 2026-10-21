'use client';

import Link from 'next/link';
import { QuizTool } from '@/components/QuizTool';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import { useDarkMode } from '@/hooks/use-dark-mode';

const FAQS = [
  {
    question: 'Is the daily quiz the same for everyone?',
    answer:
      'Yes. Each day has one five-question puzzle, generated from the date, so every player worldwide answers the same questions. A new one starts at midnight UTC.',
  },
  {
    question: 'How is the score calculated?',
    answer:
      'One point per correct answer, out of five. Ties on the leaderboard go to the faster time, and the clock only runs while a question is waiting for your answer, so reading an explanation costs nothing.',
  },
  {
    question: 'What kind of questions are asked?',
    answer:
      'Everyday time math: the time between two clock times, durations across midnight, adding time to a clock, minutes to decimal hours, paid hours after an unpaid break, and on some days reading an analog clock or converting 12-hour and 24-hour time.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. Your results and streak are saved on your device, and the leaderboard only asks for three letters, arcade style. Practice mode is unlimited.',
  },
];

export default function QuizPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();




  return (
    <StationChrome currentTool="quiz" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Daily Time Quiz',
          description:
            'A free daily five-question quiz on elapsed time, clock math, decimal hours, and payroll shifts, with an arcade-style leaderboard and unlimited practice mode.',
          url: 'https://clockmath.com/tools/quiz/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">

        <nav className="st-crumbs" aria-label="Breadcrumb">

          <Link href="/tools/">Tools</Link> / Daily Quiz

        </nav>

        <h1 className="st-h1">Daily Time Quiz</h1>

        <p className="st-lede">How fast is your clock math?</p>

      </div>

      <QuizTool className="mb-section" />

      {/* About — plain text, no accordions: the quiz is the page, this is
          the small print. Mirrors the FAQPage JSON-LD above. */}
      <section className="max-w-3xl mx-auto mb-section">
        <h2 className="text-lg sm:text-xl font-bold text-foreground dark:text-foreground mb-3">About the quiz</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Time math is harder than it looks because clocks count in 60s while everything else counts in 10s. Each
          question matches a ClockMath tool, and every explanation shows the mental method: count up to the next full
          hour, add the whole hours, then the leftover minutes. Miss one and the quiz points you to the{' '}
          <Link href="/" className="text-primary underline underline-offset-4">
            duration
          </Link>
          ,{' '}
          <Link href="/tools/decimal-hours" className="text-primary underline underline-offset-4">
            decimal hours
          </Link>{' '}
          or{' '}
          <Link href="/tools/timesheet" className="text-primary underline underline-offset-4">
            work hours
          </Link>{' '}
          calculator. Teachers: practice mode is unlimited, untimed and needs no accounts, so it works on shared
          classroom devices.
        </p>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.question}>
              <dt className="font-semibold text-foreground text-sm sm:text-base mb-1">{faq.question}</dt>
              <dd className="text-sm text-muted-foreground">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <SiteFooter />
    </StationChrome>
  );
}
