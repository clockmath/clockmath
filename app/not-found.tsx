import Link from "next/link";
import StationChrome from "@/components/station/StationChrome";
import SiteFooter from "@/components/SiteFooter";
import { lineForHref } from "@/lib/lines";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — ClockMath",
  robots: { index: false, follow: true },
};

// The most used tools, as rows of the All tools page (each in its line's colour)
const links = [
  { href: "/", label: "Time Duration Calculator", desc: "The exact time between two times or dates" },
  { href: "/tools/timesheet/", label: "Work Hours Calculator", desc: "Add up shifts with breaks, for payroll" },
  { href: "/tools/timezone/", label: "Time Zone Converter", desc: "Any two places, daylight saving included" },
  { href: "/tools/countdown/", label: "Countdown Timer", desc: "Count down to any date, then share it" },
  { href: "/tools/market-hours/", label: "Stock Market Hours", desc: "Which exchanges are open, in your timezone" },
];

export default function NotFound() {
  return (
    <StationChrome currentTool="not-found">
      <div className="st-intro">
        <p className="st-404" aria-hidden="true">404</p>
        <h1 className="st-h1">Page not found</h1>
        <p className="st-lede">That page doesn&apos;t exist or may have moved. Try one of the free tools:</p>
      </div>
      <ul className="st-hub">
        {links.map((l) => (
          <li key={l.href} data-line={lineForHref(l.href) ?? undefined}>
            <Link href={l.href}>
              <span className="st-hub-title">{l.label}</span>
              <span className="st-hub-desc">{l.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="st-cta">
        <Link href="/" className="st-btn primary">
          Back to ClockMath
        </Link>
        <Link href="/tools/" className="st-btn quiet">
          See all tools
        </Link>
      </div>
      <SiteFooter />
    </StationChrome>
  );
}
