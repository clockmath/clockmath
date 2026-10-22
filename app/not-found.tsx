import Link from "next/link";
import StationChrome from "@/components/station/StationChrome";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — ClockMath",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/", label: "Time Calculator", desc: "Time between two times" },
  { href: "/tools/timezone/", label: "Time Zone Converter", desc: "Convert across time zones" },
  { href: "/tools/countdown/", label: "Countdown Timer", desc: "Count down to any date" },
  { href: "/tools/timesheet/", label: "Work Hours", desc: "Add up your shifts" },
  { href: "/tools/market-hours/", label: "Market Hours", desc: "Live stock market hours" },
];

export default function NotFound() {
  return (
    <StationChrome currentTool="not-found">
      <div className="st-intro">
        <p className="st-404" aria-hidden="true">404</p>
        <h1 className="st-h1">Page not found</h1>
        <p className="st-lede">That page doesn&apos;t exist or may have moved. Try one of the free tools:</p>
      </div>
      <ul className="st-links" style={{ maxWidth: '72ch' }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
            <span>{l.desc}</span>
          </li>
        ))}
      </ul>
      <div className="st-cta">
        <Link href="/" className="st-btn primary">
          Back to ClockMath
        </Link>
      </div>
      <SiteFooter />
    </StationChrome>
  );
}
