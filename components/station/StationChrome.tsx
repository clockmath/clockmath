import Link from "next/link"
import { Archivo } from "./fonts"
import { lineForTool } from "@/lib/lines"
import AnnouncementBanner from "@/components/AnnouncementBanner"
import { ClassicToggle } from "./ClassicToggle"
import { StationTabs } from "./StationTabs"
import { ThemeToggle } from "./ThemeToggle"
import "./station.css"
import "./tools.css"
import "./lines.css"
import "./colour-bands.css"
import "./quiz.css"
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
  /** The colour bands' colour when it isn't the page's line: an event
      page's own board colour (colour-bands.css). */
  hero?: { color: string; ink?: string }
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

// #rrggbb as 0-255 channels, and relative luminance / contrast (WCAG), to tell
// light boards from dark and keep the tint under body text readable.
const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => c / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
// The page's grey text (--quiet in station.css) must stay >= 4.6:1 on the tint.
const QUIET = channels("#656b72")

// An event's colours for the bands. A light board (Easter lilac, the
// weekend's yellow) would make a muddy footer mixed with black, so its footer
// is a deep shade of its own dark ink instead, and its explainers' tint takes
// more of the colour so it shows at all (colour-bands.css).
function heroStyle(hero: { color: string; ink?: string }): React.CSSProperties {
  const ink = hero.ink ?? "#ffffff"
  const style: Record<string, string> = { "--hero": hero.color, "--hero-ink": ink }
  const rgb = channels(hero.color)
  if (luminance(rgb) > 0.4) {
    style["--hero-deep"] = `color-mix(in srgb, ${ink} 88%, #000000)`
    // 8% of a colour this pale barely shows: use as much of it as the grey
    // text allows, up to 45%
    for (const p of [0.45, 0.35, 0.25, 0.15]) {
      const tint = rgb.map((c) => Math.round(c * p + 255 * (1 - p)))
      if (contrast(QUIET, tint) >= 4.6) {
        style["--hero-tint"] = `rgb(${tint.join(" ")})`
        break
      }
    }
  }
  return style as React.CSSProperties
}

export default function StationChrome({ children, currentTool, onToggleTheme, isDarkMode, hero }: StationChromeProps) {
  // Tools without a tab of their own light up "All tools"; guides and
  // site pages light none.
  const active = TABS.some((t) => t.id === currentTool)
    ? currentTool
    : ["overtime", "decimal-hours", "market-hours"].includes(currentTool)
      ? "tools"
      : null
  return (
    <div
      className={`station ${Archivo.variable}`}
      data-line={lineForTool(currentTool) ?? undefined}
      style={hero ? heroStyle(hero) : undefined}
    >
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
