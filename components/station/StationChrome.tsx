import Link from "next/link"
import { Archivo, BigShoulders } from "./fonts"
import { lineForTool } from "@/lib/lines"
import AnnouncementBanner from "@/components/AnnouncementBanner"
import { ClassicToggle } from "./ClassicToggle"
import { StationTabs } from "./StationTabs"
import { ThemeToggle } from "./ThemeToggle"
import { channels, contrast, luminance } from "@/lib/colour"
import "./station.css"
import "./tools.css"
import "./lines.css"
import "./colour-bands.css"
import "./quiz.css"
import "./type.css"
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
// The page's grey text (--quiet in station.css) must stay >= 4.6:1 on the tint.
const QUIET = channels("#656b72")

const mixRgb = (rgb: number[], with_: number, p: number) => `rgb(${rgb.map((c) => Math.round(c * p + with_ * (1 - p))).join(" ")})`

// An event's colours for the bands. A light board (Easter lilac, the
// weekend's yellow) would make a muddy footer mixed with black, so its footer
// is a deep shade of its own dark ink instead, and its explainers' tint takes
// more of the colour so it shows at all (colour-bands.css).
//
// The sign over the board is a shade of the board's colour, not the colour
// itself: the same colour twice read as one slab. Darker for mid colours,
// lighter for near-black ones (a darker black is still black), the dark ink
// shade for light ones. Each keeps its text >= 5:1 and differs from the
// board by >= 1.65:1 (checked against every board in Oct 2026).
function heroStyle(hero: { color: string; ink?: string }): React.CSSProperties {
  const ink = hero.ink ?? "#ffffff"
  const style: Record<string, string> = { "--hero": hero.color, "--hero-ink": ink }
  const rgb = channels(hero.color)
  const lum = luminance(rgb)
  style["--hero-sign"] = lum < 0.05 ? mixRgb(rgb, 255, 0.8) : mixRgb(rgb, 0, 0.6)
  style["--hero-sign-ink"] = ink
  if (lum > 0.4) {
    style["--hero-deep"] = `color-mix(in srgb, ${ink} 88%, #000000)`
    style["--hero-sign"] = style["--hero-deep"]
    style["--hero-sign-ink"] = "#ffffff"
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
      className={`station ${Archivo.variable} ${BigShoulders.variable}`}
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
