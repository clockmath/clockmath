'use client';

import Link from 'next/link';
import { CountdownWidgetGallery } from '@/components/CountdownWidgetGallery';
import SiteFooter from '@/components/SiteFooter';
import StationChrome from '@/components/station/StationChrome';
import StationFold from '@/components/station/StationFold';
import JsonLd, { getSoftwareApplicationSchema, getFAQPageSchema } from '@/components/JsonLd';
import { useDarkMode } from '@/hooks/use-dark-mode';

const FAQS = [
  {
    question: 'Is the countdown widget free?',
    answer:
      'Yes. There is no sign-up, no account and no limit on how many pages show it. Copy the code, paste it into your page, and it keeps itself up to date.',
  },
  {
    question: 'Does it track my visitors or set cookies?',
    answer:
      'No. The widget runs no analytics and sets no cookies on your site, so it needs no consent banner. ClockMath only notes which sites show it, by the site’s address, to see where the widgets are used.',
  },
  {
    question: 'What time zone does it count in?',
    answer:
      'Each visitor’s own. A countdown to Christmas reaches zero at midnight on December 25 wherever the visitor is, and an eclipse or a fixed launch time counts to the same instant everywhere.',
  },
  {
    question: 'How do I add it to WordPress, Squarespace or Blogger?',
    answer:
      'Paste the widget code into a Custom HTML block (WordPress), a Code block (Squarespace), an HTML/JavaScript gadget (Blogger) or an HTML card (Ghost). On WordPress.com’s Free and Personal plans, which remove widgets, use the image badge instead.',
  },
  {
    question: 'How do I add it to Notion, Google Sites or Wix?',
    answer:
      'Choose Link and copy the address. In Notion, type /embed and paste it; in Google Sites, use Insert, Embed, By URL; in Wix, add Embed a Site. Make the box about 230 pixels tall.',
  },
  {
    question: 'What is the countdown badge?',
    answer:
      'A small image of the days left, such as “43 days until Christmas”, linked to the countdown page. It works where widgets can’t: forums, newsletters, GitHub README files and site builders that strip embeds. It updates during the day; the live widget ticks every second.',
  },
  {
    question: 'Can I make a countdown to my own date?',
    answer:
      'Yes. Make it in the countdown tool, with a title and a time, then press “Embed on your site” and pick a board colour. It works for a launch, a wedding, an exam or the last day of school.',
  },
];

export default function CountdownWidgetPage() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <StationChrome currentTool="countdown-widget" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Countdown Widgets',
          description:
            'Free live countdown widgets and image badges for websites: holidays, game and film releases, sport and eclipses. One line of code, no sign-up, no cookies.',
          url: 'https://clockmath.com/tools/countdown-widget/',
        })}
      />
      <JsonLd data={getFAQPageSchema(FAQS)} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/tools/">Tools</Link> / Countdown Widgets
        </nav>
        <h1 className="st-h1">Countdown Widgets for Your Website</h1>
        <p className="st-lede">
          A free live countdown to a holiday, a release or an eclipse. Pick one, copy the code, paste it into your page
        </p>
      </div>

      <CountdownWidgetGallery />

      <StationFold>
        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Three ways to add it</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Widget:</strong> the live board, ticking every second, for any page
              that takes HTML. It fits its column, from a sidebar to the full width.
            </li>
            <li>
              <strong className="text-foreground">Badge:</strong> an image of the days left with a link, as HTML,
              Markdown or forum code, for places that strip widgets.
            </li>
            <li>
              <strong className="text-foreground">Link:</strong> the widget’s address, for site builders that embed a
              web page from its address (Notion, Google Sites, Wix).
            </li>
          </ul>
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-4">Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="bg-card dark:bg-card rounded-2xl p-4 sm:p-5 border border-border/50 dark:border-border/50">
                <h3 className="font-semibold text-foreground mb-1.5">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto mb-section">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground mb-3">Related</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/tools/countdown/" className="text-primary hover:text-primary/80 font-semibold">
                Countdown timer
              </Link>{' '}
              — count down to any date and time, share it, or embed it
            </li>
            <li>
              <Link href="/countdown/holidays/" className="text-primary hover:text-primary/80 font-semibold">
                Holidays 2026–2027
              </Link>{' '}
              — every holiday and the days left until each
            </li>
            <li>
              <Link href="/tools/days-between-dates/" className="text-primary hover:text-primary/80 font-semibold">
                Days between dates
              </Link>{' '}
              — how many days, weeks and business days to any date
            </li>
          </ul>
        </section>
      </StationFold>

      <SiteFooter />
    </StationChrome>
  );
}
