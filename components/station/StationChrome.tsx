import Link from "next/link"
import { Archivo } from "./fonts"
import "./station.css"

// Station-clock frame (design/station-clock preview): wordmark, plain text
// tabs, theme toggle. Stands in for PageChrome on the pages being trialled;
// everything inside picks up the palette from .station (station.css).
const TABS = [
  { id: "calculator", label: "Time", href: "/" },
  { id: "timezone", label: "Time zones", href: "/tools/timezone/" },
  { id: "timesheet", label: "Work hours", href: "/tools/timesheet/" },
  { id: "sleep", label: "Sleep", href: "/tools/sleep/" },
  { id: "countdown", label: "Countdowns", href: "/tools/countdown/" },
  { id: "quiz", label: "Quiz", href: "/tools/quiz/" },
  { id: "tools", label: "All tools", href: "/tools/" },
] as const

interface StationChromeProps {
  children: React.ReactNode
  currentTool: (typeof TABS)[number]["id"]
  onToggleTheme: () => void
  isDarkMode: boolean
}

// The mark is the dial itself: black hands, the red second hand.
function Mark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12.6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <line x1="14" y1="14" x2="14" y2="6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="14" y1="14" x2="19.5" y2="14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="14" y1="17.5" x2="14" y2="5" style={{ stroke: "var(--signal)" }} strokeWidth="1.2" />
      <circle cx="14" cy="5.6" r="2" style={{ fill: "var(--signal)" }} />
    </svg>
  )
}

export default function StationChrome({ children, currentTool, onToggleTheme, isDarkMode }: StationChromeProps) {
  return (
    <div className={`station ${Archivo.variable}`}>
      <header className="st-header">
        <div className="st-wrap">
          <Link href="/" className="st-mark" aria-label="ClockMath home">
            <Mark />
            <span>ClockMath</span>
          </Link>
          <nav className="st-tabs" aria-label="Tools">
            {TABS.map((t) => (
              <Link key={t.id} href={t.href} aria-current={t.id === currentTool ? "page" : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className="st-theme"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
            title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
          >
            {isDarkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.4 15.4A9 9 0 0 1 8.6 3.6 9 9 0 1 0 20.4 15.4z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      <main className="st-wrap st-main">{children}</main>
    </div>
  )
}
