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
  LayoutGrid,
  ChevronDown,
} from 'lucide-react'
import { MARKETS, getMarketStatus } from '@/lib/markets'

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
// open-dot), and Guides. Everything else lives in the More menu, which is
// where future tools (pomodoro, sleep, …) get added without touching the bar.
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
    id: 'articles',
    label: 'Guides',
    shortLabel: 'Guides',
    href: '/articles',
    icon: <BookOpen className="w-5 h-5 lg:w-4 lg:h-4 shrink-0" />,
  },
]

const moreItems: NavItem[] = [
  {
    id: 'countdown',
    label: 'Countdown Timer',
    shortLabel: 'Countdown',
    href: '/tools/countdown',
    icon: <Hourglass className="w-4 h-4 shrink-0" />,
  },
  {
    id: 'decimal-hours',
    label: 'Decimal Hours',
    shortLabel: 'Decimal',
    href: '/tools/decimal-hours',
    icon: <Percent className="w-4 h-4 shrink-0" />,
  },
]

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
    pathname === '/tools' ? 'tools' :
    pathname.startsWith('/articles') ? 'articles' :
    pathname.startsWith('/countdown') ? 'countdown' :
    'calculator'
  )
  const moreActive = moreItems.some((item) => item.id === activeToolId) || activeToolId === 'tools'

  const tabClass = (active: boolean) =>
    `flex-1 min-w-0 px-2 lg:px-3 py-2 lg:py-3 text-sm font-medium rounded-xl transition-all duration-200 flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-0.5 lg:gap-2 whitespace-nowrap min-h-[2.5rem] ${
      active
        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`

  return (
    <div className={`bg-card/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-border/50 dark:border-slate-700/50 ${className}`}>
      <div className="flex items-stretch min-h-[3rem]">
        {primaryTabs.map((tab) => (
          <Link key={tab.id} href={tab.href} aria-label={tab.label} className={tabClass(activeToolId === tab.id)}>
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
            aria-label="More tools"
            className={`w-full h-full ${tabClass(moreActive)}`}
          >
            <ChevronDown
              className={`w-5 h-5 lg:w-4 lg:h-4 shrink-0 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
            />
            <span className="text-[11px] leading-tight lg:text-sm">More</span>
          </button>

          <div
            className={`${moreOpen ? '' : 'hidden'} absolute right-0 top-full mt-2 z-50 w-56 bg-card dark:bg-slate-800 rounded-xl shadow-xl border border-border/50 dark:border-slate-700/50 p-1.5`}
          >
            {moreItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeToolId === item.id
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border/50 dark:border-slate-700/50 mt-1 pt-1">
              <Link
                href="/tools"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-muted/50 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                View all tools
              </Link>
            </div>
          </div>
        </div>

        {showHistory && (
          <button
            onClick={onHistoryClick}
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
