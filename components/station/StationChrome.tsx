import Link from "next/link"
import { Archivo } from "./fonts"
import AnnouncementBanner from "@/components/AnnouncementBanner"
import { ClassicToggle } from "./ClassicToggle"
import { StationTabs } from "./StationTabs"
import { ThemeToggle } from "./ThemeToggle"
import "./station.css"
import "./tools.css"
import "./classic.css"

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
  /** A tab id, or the page's own id (overtime, articles, privacy…). */
  currentTool: string
  /** Optional: without them the header runs its own toggle (server pages). */
  onToggleTheme?: () => void
  isDarkMode?: boolean
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
  // Tools without a tab of their own light up "All tools"; guides and
  // site pages light none.
  const active = TABS.some((t) => t.id === currentTool)
    ? currentTool
    : ["overtime", "decimal-hours", "market-hours"].includes(currentTool)
      ? "tools"
      : null
  return (
    <div className={`station ${Archivo.variable}`}>
      <AnnouncementBanner />
      <header className="st-header">
        <div className="st-wrap">
          <Link href="/" className="st-mark" aria-label="ClockMath home">
            <Mark />
            <span>ClockMath</span>
          </Link>
          <StationTabs tabs={TABS} active={active} />
          <ClassicToggle />
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>
      </header>
      <main className="st-wrap st-main">{children}</main>
    </div>
  )
}
