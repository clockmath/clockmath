/* eslint-disable react/no-unescaped-entities */
import StationChrome from "@/components/station/StationChrome";
import SiteFooter from "@/components/SiteFooter";
import { Metadata } from "next";
import ManageConsentButton from "@/components/ManageConsentButton";

export const metadata: Metadata = {
  title: "Privacy Policy | ClockMath",
  description: "What ClockMath collects, why, how long it's kept, and your choices. The tools run in your browser; what you type stays on your device.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://clockmath.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy | ClockMath",
    description: "Privacy Policy for ClockMath.com time duration calculator.",
    type: "website",
    url: "https://clockmath.com/privacy",
    siteName: "ClockMath",
  },
  twitter: {
    card: "summary",
  },
};

export default function PrivacyPage() {
  return (
    <StationChrome currentTool="privacy">
      <div className="st-intro">
        <h1 className="st-h1">Privacy Policy</h1>
        <p className="st-lede">ClockMath.com</p>
      </div>

        {/* Content */}
        <div className="st-article article-prose">
          <div>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">
              <strong>Effective date:</strong> October 18, 2026
            </p>

            <p className="mb-6">
              This policy explains what ClockMath.com collects, why, how long we keep it, and the choices you have. In
              short: the tools work in your browser, what you type into them stays on your device, and the analytics we
              use only see how the site is used, not your numbers.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">1. What you type into the tools</h2>
            <p className="mb-4">
              The calculators run in your browser. The times, dates, shifts, pay rates, names and countdown titles you
              enter are not sent to us. To remember them between visits (calculation history, timesheet drafts, saved
              timesheets, your 12/24-hour setting), the site stores them in your browser&apos;s local storage, on your
              device only. Clearing your browser data removes them.
            </p>
            <p className="mb-6">
              <strong>Share links</strong> are the exception you control: a shared timesheet or countdown link contains
              that data inside the link itself, so anyone you send it to can see it. We remove that part of the address
              before any analytics records the page, and a timesheet link is tidied out of the address bar once it has
              opened.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">2. Analytics</h2>
            <p className="mb-4">We use three services to understand how the site is used:</p>
            <ul className="mb-4">
              <li>
                <strong>Google Analytics 4:</strong> pages visited, device and browser, approximate location (which
                Google derives from your IP address; GA4 does not store IP addresses), where visits come from, and tool
                usage events. Those events carry counts and totals (for example how many shifts a timesheet has, its
                total minutes, the length of a calculated duration, which time zones were converted between, a quiz
                score and time), never the times, dates, names or pay you enter.
              </li>
              <li>
                <strong>Microsoft Clarity:</strong> session replays and heatmaps (where people click and scroll), with
                sensitive content masked. It doesn&apos;t run on a page whose address contains shared data.
              </li>
              <li>
                <strong>Cloudflare Web Analytics:</strong> page-view counts without cookies, provided by our host.
              </li>
            </ul>
            <p className="mb-4">
              <strong>Consent:</strong> in the EEA, the UK and Switzerland, Google Analytics and Clarity don&apos;t load
              at all until you choose &ldquo;Accept&rdquo;. Elsewhere they load by default, and you can turn them off at
              any time: <ManageConsentButton />.
            </p>
            <p className="mb-6">
              We don&apos;t use advertising features, remarketing or user IDs, and we don&apos;t sell or share visitor
              data. You can also block Google Analytics everywhere with the{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">Google Analytics opt-out add-on</a>. See{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">Google's</a> and{' '}
              <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">Microsoft's</a> privacy statements for how they handle
              this data.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">3. Information you send us</h2>
            <ul className="mb-6">
              <li>
                <strong>Feedback form:</strong> your message, the topic, your email address if you choose to give one
                (so we can reply), and your country (from our host, Cloudflare). It is stored on Cloudflare and emailed
                to us, and the stored copy is deleted automatically after 90 days.
              </li>
              <li>
                <strong>Contact page:</strong> the form opens your own email app; we receive whatever you send, like any
                email.
              </li>
              <li>
                <strong>Daily quiz:</strong> when you finish, your score, your time and, if you enter them, three
                initials for the leaderboard. Each day&apos;s leaderboard is deleted after about two weeks. A cookie
                (two days) stops the same browser submitting twice in one day.
              </li>
              <li>
                <strong>Place search</strong> (time zone converter): the place name you type is sent through our server
                to Geoapify to find matching places. We don&apos;t store it.
              </li>
              <li>
                <strong>Your country</strong> (from Cloudflare) is checked on each visit to decide whether to show the
                consent banner. It isn&apos;t stored.
              </li>
            </ul>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">4. Cookies and local storage</h2>
            <p className="mb-6">
              Google Analytics and Clarity set cookies when they run (see above for when that is). The quiz sets one
              cookie for two days. Everything else is local storage on your device: your tool settings and drafts, and
              your consent choice. You can clear both in your browser settings; the tools still work, they just
              won&apos;t remember anything.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">5. Third-party links</h2>
            <p className="mb-6">
              Our site links to other websites. We are not responsible for their privacy practices.
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">6. Your rights</h2>
            <p className="mb-4">Depending on where you live, you may have the right to ask for:</p>
            <ul className="mb-4">
              <li>A copy of the data we hold about you (in practice, a feedback message or quiz entry)</li>
              <li>Its deletion before it expires on its own</li>
              <li>An end to analytics tracking (the consent setting above does this immediately)</li>
            </ul>
            <p className="mb-6">
              Email us at{' '}
              <a href="mailto:hello@clockmath.com" className="text-primary hover:text-primary/80 underline">
                hello@clockmath.com
              </a>
              .
            </p>

            <hr className="my-6 border-border/50 dark:border-slate-700/50" />

            <h2 className="text-2xl font-semibold mb-4">7. Updates</h2>
            <p className="mb-6">
              We&apos;ll post any changes to this policy here with a new effective date.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <SiteFooter />
        </div>
    </StationChrome>
  );
}
