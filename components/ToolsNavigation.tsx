'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  Clock,
  Globe,
  History,
  Hourglass,
  ClipboardList,
  CandlestickChart,
  BookOpen,
  Percent,
  Bed,
  Trophy,
  AlarmClockPlus,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react'
import { MARKETS, getMarketStatus } from '@/lib/markets'
import { navClick, navPanelOpen } from '@/lib/gtag'

interface NavItem {
  id: string
  /** Desktop label */
  label: string
  /** Short label under the icon on mobile */
  shortLabel: string
  href: string
  icon: React.ReactNode
}

// Visible tabs: the three highest-traffic tools, Markets (with its live
// open-dot), and the Daily Quiz (the engagement loop earns the slot; Guides
// moved to More, Sep 2026). Everything else lives in the More menu, which is
// where future tools get added without touching the bar.
const primaryTabs: NavItem[] = [
  {
    id: 'calculator',
    label: 'Time',
    shortLabel: 'Time',
    href: '/',
    icon: <Clock className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
  {
    id: 'timezone',
    label: 'Timezone',
    shortLabel: 'Zones',
    href: '/tools/timezone',
    icon: <Globe className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
  {
    id: 'timesheet',
    label: 'Timesheet',
    shortLabel: 'Shifts',
    href: '/tools/timesheet',
    icon: <ClipboardList className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
  {
    id: 'market-hours',
    label: 'Markets',
    shortLabel: 'Markets',
    href: '/tools/market-hours',
    icon: <CandlestickChart className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
  {
    id: 'quiz',
    label: 'Daily Quiz',
    shortLabel: 'Quiz',
    href: '/tools/quiz',
    icon: <Trophy className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
]

/**
 * The "All tools" panel: every tool, grouped by the job the visitor is
 * trying to do. Tools already in the tab bar are repeated here on purpose —
 * the panel is the complete map, not the leftovers drawer.
 */
const TOOL_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Durations',
    items: [
      {
        id: 'calculator',
        label: 'Time Duration',
        shortLabel: 'Duration',
        href: '/',
        icon: <Clock className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'countdown',
        label: 'Countdown Timer',
        shortLabel: 'Countdown',
        href: '/tools/countdown',
        icon: <Hourglass className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'sleep',
        label: 'Sleep Calculator',
        shortLabel: 'Sleep',
        href: '/tools/sleep',
        icon: <Bed className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    title: 'Work & payroll',
    items: [
      {
        id: 'timesheet',
        label: 'Work Hours',
        shortLabel: 'Shifts',
        href: '/tools/timesheet',
        icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'overtime',
        label: 'Overtime Pay',
        shortLabel: 'Overtime',
        href: '/tools/overtime',
        icon: <AlarmClockPlus className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'decimal-hours',
        label: 'Decimal Hours',
        shortLabel: 'Decimal',
        href: '/tools/decimal-hours',
        icon: <Percent className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    title: 'Time zones',
    items: [
      {
        id: 'timezone',
        label: 'Timezone Converter',
        shortLabel: 'Zones',
        href: '/tools/timezone',
        icon: <Globe className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'market-hours',
        label: 'Stock Market Hours',
        shortLabel: 'Markets',
        href: '/tools/market-hours',
        icon: <CandlestickChart className="w-4 h-4 shrink-0" />,
      },
    ],
  },
  {
    title: 'Learn & play',
    items: [
      {
        id: 'quiz',
        label: 'Daily Time Quiz',
        shortLabel: 'Quiz',
        href: '/tools/quiz',
        icon: <Trophy className="w-4 h-4 shrink-0" />,
      },
      {
        id: 'articles',
        label: 'Guides',
        shortLabel: 'Guides',
        href: '/articles',
        icon: <BookOpen className="w-4 h-4 shrink-0" />,
      },
    ],
  },
]

// Ids that only live in the panel — used for the button's active state.
const PANEL_ONLY_IDS = new Set(
  TOOL_GROUPS.flatMap((g) => g.items.map((i) => i.id)).filter(
    (id) => !primaryTabs.some((t) => t.id === id),
  ),
)

interface ToolsNavigationProps {
  currentTool?: string
  showHistory?: boolean
  historyCount?: number
  onHistoryClick?: () => void
  className?: string
}

export default function ToolsNavigation({
  currentTool,
  showHistory = false,
  historyCount = 0,
  onHistoryClick,
  className = "",
}: ToolsNavigationProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [marketsOpen, setMarketsOpen] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // Live green dot on the Markets tab while any exchange is open.
  // Computed after hydration only (the server can't know the visitor's "now").
  useEffect(() => {
    const compute = () => {
      const now = new Date()
      setMarketsOpen(MARKETS.filter((m) => getMarketStatus(m, now).state === 'open').length)
    }
    compute()
    const id = setInterval(compute, 60_000)
    return () => clearInterval(id)
  }, [])

  // Report panel opens from the state transition rather than the click
  // handler: keeps the updater pure (StrictMode double-invokes updaters) and
  // can't misfire on a stale closure value.
  useEffect(() => {
    if (moreOpen) navPanelOpen()
  }, [moreOpen])

  // Close the More menu on outside click or Escape
  useEffect(() => {
    if (!moreOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  // Determine active item based on pathname if currentTool not provided
  const activeToolId = currentTool || (
    pathname === '/' ? 'calculator' :
    pathname.startsWith('/tools/timezone') ? 'timezone' :
    pathname.startsWith('/tools/countdown') ? 'countdown' :
    pathname.startsWith('/tools/timesheet') ? 'timesheet' :
    pathname.startsWith('/tools/market-hours') ? 'market-hours' :
    pathname.startsWith('/tools/decimal-hours') ? 'decimal-hours' :
    pathname.startsWith('/tools/sleep') ? 'sleep' :
    pathname.startsWith('/tools/quiz') ? 'quiz' :
    pathname === '/tools' ? 'tools' :
    pathname.startsWith('/articles') ? 'articles' :
    pathname.startsWith('/countdown') ? 'countdown' :
    'calculator'
  )
  const moreActive = PANEL_ONLY_IDS.has(activeToolId) || activeToolId === 'tools'

  const tabClass = (active: boolean) =>
    `flex-1 min-w-0 px-2 lg:px-3 py-2 lg:py-3 text-sm font-medium rounded-xl transition-all duration-200 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-0.5 lg:gap-2 whitespace-nowrap min-h-[2.5rem] ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`

  return (
    <div className={`bg-card dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-border/50 dark:border-slate-700/50 ${className}`}>
      <div className="flex items-stretch min-h-[3rem]">
        {primaryTabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.label}
            onClick={() => navClick(tab.id, 'tab')}
            className={tabClass(activeToolId === tab.id)}
          >
            <span className="relative inline-flex">
              {tab.icon}
              {tab.id === 'market-hours' && marketsOpen > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-800"
                  title={`${marketsOpen} market${marketsOpen === 1 ? '' : 's'} open now`}
                />
              )}
            </span>
            <span className="text-[11px] leading-tight lg:text-sm">
              <span className="lg:hidden">{tab.shortLabel}</span>
              <span className="hidden lg:inline">{tab.label}</span>
            </span>
          </Link>
        ))}

        {/* More menu — items are always in the DOM (crawlable), visibility is CSS */}
        <div className="relative flex-1 min-w-0" ref={menuRef}>
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            aria-expanded={moreOpen}
            aria-haspopup="true"
            aria-label="All tools"
            className={`w-full h-full ${tabClass(moreActive)}`}
          >
            <ChevronDown
              className={`w-5 h-5 lg:w-4 lg:h-4 shrink-0 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
            />
            <span className="text-[11px] leading-tight lg:text-sm">All tools</span>
          </button>

          <div
            className={`${moreOpen ? '' : 'hidden'} absolute right-0 top-full mt-2 z-50 w-[min(16rem,calc(100vw-2rem))] sm:w-[34rem] bg-card dark:bg-slate-800 rounded-xl shadow-sm border border-border/50 dark:border-slate-700/50 p-3`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
              {TOOL_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h3>
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        navClick(item.id, 'panel', { group: group.title })
                        setMoreOpen(false)
                      }}
                      className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                        activeToolId === item.id
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 dark:border-slate-700/50 mt-2 pt-2">
              <Link
                href="/tools"
                onClick={() => {
                  navClick('tools-hub', 'panel_hub')
                  setMoreOpen(false)
                }}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-muted/50 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                Compare all tools on one page
              </Link>
            </div>
          </div>
        </div>

        {showHistory && (
          <button
            onClick={() => {
              navClick('history', 'history')
              onHistoryClick?.()
            }}
            className={`${tabClass(currentTool === 'history')} !flex-none`}
          >
            <History className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />
            <span className="text-[11px] leading-tight lg:text-sm">
              <span className="lg:hidden">History</span>
              <span className="hidden lg:inline">Recent Calculations</span>
            </span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-xs rounded-full min-w-[1.25rem] text-center hidden lg:inline">
                {historyCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
