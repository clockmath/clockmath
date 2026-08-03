"use client"

/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Lightbulb } from "lucide-react"
import { RollingNumber } from "@/components/RollingNumber"
import SeoIntro from "@/components/SeoIntro"
import SiteFooter from "@/components/SiteFooter"
import PageChrome from "@/components/PageChrome"
import { InlineTimePicker } from "@/components/ui/InlineTimePicker"
import { InlineDatePicker } from "@/components/ui/InlineDatePicker"
import { DetailedDurationBreakdown } from "@/components/DetailedDurationBreakdown"
import { format, intervalToDuration, type Duration } from "date-fns"
import { event as gaEvent, toolUsed } from "@/lib/gtag"
import JsonLd, { getSoftwareApplicationSchema, getOrganizationSchema, getWebSiteSchema } from "@/components/JsonLd"

// Interface for calculator-specific data
interface CalculationHistory {
  id: string
  startDate: string  // ISO date string
  startTime: string
  endDate: string    // ISO date string
  endTime: string
  result: string
  seconds?: number // Raw seconds value for efficient sum calculations (optional for backward compatibility)
  detailedResult?: {
    years: number
    months: number
    weeks: number
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  timestamp: Date
}

// Helper function for device detection
function getDevice(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia?.("(pointer: coarse)")?.matches ? "mobile" : "desktop";
}

type StoredCalculation = Omit<CalculationHistory, "timestamp"> & { timestamp: string };

export default function ClockMathPage() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00:00")
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState("17:30:00")
  const [result, setResult] = useState("")
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedCalculations, setSelectedCalculations] = useState<Set<string>>(new Set());
  const [currentDetailedResult, setCurrentDetailedResult] = useState<{
    years: number
    months: number
    weeks: number
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [sumResult, setSumResult] = useState<{
    total: string
    detailed: {
      years: number
      months: number
      weeks: number
      days: number
      hours: number
      minutes: number
      seconds: number
    }
  } | null>(null);

  // Fire the unified tool_used event at most once per page session.
  const toolUsedRef = useRef(false)


  useEffect(() => {
    const savedDarkMode = localStorage.getItem("clockmath-darkmode")
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === "true")
    } else {
      // Check system preference
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Global time format for both start and end times
  const [is24HourFormat, setIs24HourFormat] = useState(true)

  const parseTimeToSeconds = useCallback((str: string): number => {
    if (!str) return Number.NaN
    const parts = str.split(":")
    if (parts.length < 2) return Number.NaN
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    const seconds = parts[2] !== undefined ? parseInt(parts[2], 10) : 0
    if ([hours, minutes, seconds].some(Number.isNaN)) return Number.NaN
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return Number.NaN
    }
    return hours * 3600 + minutes * 60 + seconds
  }, [])

  // Format a calendar-accurate breakdown (from date-fns intervalToDuration)
  // into a friendly summary string. Single source of truth for the summary.
  const formatDurationParts = useCallback((d: Duration): string => {
    const years = d.years ?? 0
    const months = d.months ?? 0
    const days = d.days ?? 0
    const hours = d.hours ?? 0
    const minutes = d.minutes ?? 0
    const seconds = d.seconds ?? 0

    const parts: string[] = []
    if (years) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
    if (months) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
    if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
    if (hours) parts.push(`${hours}h`)
    if (minutes) parts.push(`${minutes}m`)
    // Show seconds only for sub-day durations (avoids noise on long spans).
    if (seconds && !years && !months && !days) parts.push(`${seconds}s`)
    return parts.length ? parts.join(", ") : "0s"
  }, [])

  // Calendar-accurate duration between two datetimes (handles real month
  // lengths, leap years, DST) — replaces average-constant division.
  const formatDuration = useCallback(
    (start: Date, end: Date): string => {
      if (end.getTime() < start.getTime()) return "Invalid"
      return formatDurationParts(intervalToDuration({ start, end }))
    },
    [formatDurationParts],
  )

  const formatDetailedDuration = useCallback((seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return null

    // Calculate all time units with appropriate precision
    const years = seconds / (365.25 * 24 * 3600)
    const months = seconds / (30.44 * 24 * 3600)
    const weeks = seconds / (7 * 24 * 3600)
    const days = seconds / (24 * 3600)
    const hours = seconds / 3600
    const minutes = seconds / 60

    return {
      years: parseFloat(years.toFixed(4)),
      months: parseFloat(months.toFixed(3)),
      weeks: parseFloat(weeks.toFixed(2)),
      days: parseFloat(days.toFixed(2)),
      hours: parseFloat(hours.toFixed(2)),
      minutes: parseFloat(minutes.toFixed(1)),
      seconds: Math.round(seconds)
    }
  }, [])

  // Handle calculation selection
  const toggleCalculationSelection = useCallback((id: string) => {
    const newSelected = new Set(selectedCalculations)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCalculations(newSelected)
  }, [selectedCalculations])

  // Calculate sum of selected calculations
  const calculateSum = useCallback(() => {
    if (selectedCalculations.size === 0) return

    let totalSeconds = 0
    const selectedEntries = history.filter(entry => selectedCalculations.has(entry.id))
    
    selectedEntries.forEach(entry => {
      // Use stored seconds value directly (much more efficient!)
      if (typeof entry.seconds === "number" && !isNaN(entry.seconds)) {
        totalSeconds += entry.seconds
      } else {
        // Fallback for old entries without seconds field (backward compatibility)
        const resultStr = entry.result
        if (resultStr && resultStr !== "Invalid") {
          // Parse "8h 30m" format
          const parts = resultStr.split(' ')
          parts.forEach(part => {
            if (part.endsWith('h')) {
              const hours = parseInt(part.replace('h', ''))
              if (!isNaN(hours)) totalSeconds += hours * 3600
            } else if (part.endsWith('m')) {
              const minutes = parseInt(part.replace('m', ''))
              if (!isNaN(minutes)) totalSeconds += minutes * 60
            } else if (part.endsWith('s')) {
              const seconds = parseInt(part.replace('s', ''))
              if (!isNaN(seconds)) totalSeconds += seconds
            }
          })
        }
      }
    })

    // A sum has no calendar anchor, so derive the breakdown from epoch + total
    // through the same intervalToDuration path the single calculation uses.
    const totalDuration = formatDurationParts(
      intervalToDuration({ start: 0, end: totalSeconds * 1000 }),
    )
    const detailedDuration = formatDetailedDuration(totalSeconds)

    if (detailedDuration) {
      setSumResult({
        total: totalDuration,
        detailed: detailedDuration
      })
    }
  }, [selectedCalculations, history, formatDurationParts, formatDetailedDuration])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedCalculations(new Set())
    setSumResult(null)
  }, [])

  const formatTime = useCallback((timeStr: string): string => {
    if (!timeStr || timeStr.length === 0) return ""
    
    // Handle edge case where timeStr might be an object or invalid data
    if (typeof timeStr !== 'string') {
      return ""
    }
    
    const parts = timeStr.split(":")
    if (parts.length < 2) {
      return timeStr
    }
    
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
      return timeStr
    }
    
    if (is24HourFormat) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    } else {
      const period = hours >= 12 ? "PM" : "AM"
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
    }
  }, [is24HourFormat])

  const calculateTimeDifference = useCallback(() => {
    if (!startTime || !endTime) return

    setIsCalculating(true)
    // Simulate calculation delay for animation
    setTimeout(() => {
      const startSeconds = parseTimeToSeconds(startTime)
      const endSeconds = parseTimeToSeconds(endTime)

      if (isNaN(startSeconds) || isNaN(endSeconds)) {
        setResult("Invalid time format")
        setIsCalculating(false)
        return
      }

      // Combine date and time into full datetime
      const startDateTime = new Date(startDate)
      startDateTime.setHours(Math.floor(startSeconds / 3600))
      startDateTime.setMinutes(Math.floor((startSeconds % 3600) / 60))
      startDateTime.setSeconds(startSeconds % 60)
      startDateTime.setMilliseconds(0)

      const endDateTime = new Date(endDate)
      endDateTime.setHours(Math.floor(endSeconds / 3600))
      endDateTime.setMinutes(Math.floor((endSeconds % 3600) / 60))
      endDateTime.setSeconds(endSeconds % 60)
      endDateTime.setMilliseconds(0)

      const diffMs = endDateTime.getTime() - startDateTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)

      if (diffSeconds < 0) {
        setResult("End is before start")
      } else {
        const duration = formatDuration(startDateTime, endDateTime)
        const detailedDuration = formatDetailedDuration(diffSeconds)
        setResult(duration)
        setCurrentDetailedResult(detailedDuration)

        // Add to history
        const newEntry: CalculationHistory = {
          id: Date.now().toString(),
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime,
          endDate: format(endDate, 'yyyy-MM-dd'),
          endTime,
          result: duration,
          seconds: diffSeconds, // Store raw seconds for efficient sum calculations
          detailedResult: detailedDuration || undefined,
          timestamp: new Date()
        }
        setHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10

        // Save to localStorage
        const storageEntry: StoredCalculation = {
          ...newEntry,
          timestamp: newEntry.timestamp.toISOString()
        }
        try {
          const existing = JSON.parse(localStorage.getItem("clockmath-history") || "[]")
          const updated = [storageEntry, ...existing.slice(0, 9)]
          localStorage.setItem("clockmath-history", JSON.stringify(updated))
        } catch {
          // Silently fail if localStorage is unavailable
        }

        // Analytics
        const daysDiff = Math.floor(diffSeconds / 86400)
        gaEvent({
          action: "calculation_completed",
          params: {
            page: "calculator",
            duration_seconds: diffSeconds,
            duration_days: daysDiff,
            is_multi_day: daysDiff > 0,
            device: getDevice(),
          },
        });
        if (!toolUsedRef.current) {
          toolUsedRef.current = true
          toolUsed("calculator", { device: getDevice() })
        }
      }

      setIsCalculating(false)
    }, 300)
  }, [startDate, startTime, endDate, endTime, parseTimeToSeconds, formatDuration, formatDetailedDuration])

  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem("clockmath-darkmode", newTheme.toString())
  }, [isDarkMode])

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clockmath-history")
      if (!saved) return
      
      const parsed = JSON.parse(saved)
      
      // Filter out entries missing required fields and convert timestamps
      const validEntries: CalculationHistory[] = (parsed as StoredCalculation[])
        .filter((item) =>
          item &&
          item.id &&
          item.startTime &&
          item.endTime &&
          item.result &&
          item.timestamp
        )
        .map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        .filter((item: CalculationHistory) => !isNaN(item.timestamp.getTime()))
      
      setHistory(validEntries)
      
      // Clean up localStorage if we filtered out invalid entries
      if (validEntries.length !== parsed.length && validEntries.length > 0) {
        const cleanedStorage: StoredCalculation[] = validEntries.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString()
        }))
        localStorage.setItem("clockmath-history", JSON.stringify(cleanedStorage))
      }
    } catch {
      localStorage.removeItem("clockmath-history")
    }
  }, [])

  return (
    <PageChrome currentTool="calculator" onToggleTheme={toggleTheme} isDarkMode={isDarkMode}>
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getWebSiteSchema()} />
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Time Duration Calculator',
          description: 'Calculate the time difference between two times instantly. Handles overnight shifts, shows results in hours, minutes, seconds, and decimal formats.',
          url: 'https://clockmath.com/',
        })}
      />
      <div className="space-y-section pb-10">
        {/* Header — slim: the nav already carries the brand, so the page
            leads with what the page is. Reclaims ~350px above the fold. */}
        <header className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Time Duration Calculator</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            The exact time between two times or dates — free, no signup
          </p>
        </header>

        {/* Main Calculator Card */}
        {/* No min-height: the card hugs its content (a fixed 600px left a large
            dead area below the form before any result existed) */}
        <div className="bg-card dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50 dark:border-slate-700/50">
          <div className="grid gap-6">

            {/* Time Format Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-muted/50 dark:bg-slate-700/50 rounded-xl p-1.5 flex items-center gap-1">
                <button
                  onClick={() => setIs24HourFormat(false)}
            aria-pressed={!is24HourFormat}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !is24HourFormat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  12h
                </button>
                <button
                  onClick={() => setIs24HourFormat(true)}
            aria-pressed={is24HourFormat}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    is24HourFormat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  24h
                </button>
              </div>
            </div>

            {/* Date and Time Inputs */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Start */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground dark:text-slate-100">
                  Start
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InlineDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Select date"
                      startOnCalendar
                    />
                  </div>
                  <div className="flex-1">
                    <InlineTimePicker
                      value={startTime}
                      onChange={setStartTime}
                      is24h={is24HourFormat}
                      placeholder="Time"
                    />
                  </div>
                </div>
              </div>

              {/* End */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground dark:text-slate-100">
                  End
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InlineDatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Select date"
                      startOnCalendar
                    />
                  </div>
                  <div className="flex-1">
                    <InlineTimePicker
                      value={endTime}
                      onChange={setEndTime}
                      is24h={is24HourFormat}
                      placeholder="Time"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateTimeDifference}
              disabled={!startTime || !endTime || isCalculating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Calculate Duration
                </>
              )}
            </button>

            {/* Result */}
            {result && (
              <div className="text-center">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 sm:p-6 border border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-4">
                    Duration
                  </h3>
                  
                  {/* Main duration (hours and minutes) - largest and centered */}
                  <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 font-mono mb-2">
                    <RollingNumber value={result} />
                  </p>

                  {/* The payroll-useful conversions stay inline; the full
                      years→seconds breakdown collapses behind a toggle after
                      user feedback that it made simple results feel busy. */}
                  {currentDetailedResult && (
                    <>
                      <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 mb-2">
                        = {currentDetailedResult.hours.toFixed(2)} decimal hours ·{' '}
                        {Math.round(currentDetailedResult.minutes).toLocaleString()} minutes
                      </p>
                      <button
                        onClick={() => setShowBreakdown((prev) => !prev)}
                        aria-expanded={showBreakdown}
                        className="text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline mb-2"
                      >
                        {showBreakdown ? 'Hide details' : 'Show details'}
                      </button>
                      {showBreakdown && (
                        <DetailedDurationBreakdown
                          detailedResult={currentDetailedResult}
                          variant="primary"
                          size="large"
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Intent-matched nudge: a duration result showing decimal hours
                    is usually someone doing payroll/timesheet math */}
                <div className="mt-4 flex items-center gap-2.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5">
                  <svg className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-sm text-foreground m-0">
                    Adding up a work week?{" "}
                    <Link href="/tools/timesheet/" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                      Total your shifts in the timesheet calculator
                    </Link>
                    {" "}— breaks, overnight shifts, and gross pay included.
                  </p>
                </div>

                {/* Contextual cross-promo: nudge engaged users toward the other tools */}
                <div className="mt-4 bg-card dark:bg-slate-800 rounded-xl p-4 border border-border/50 dark:border-slate-700/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground inline-flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />Did you know?</span> You can also use ClockMath to{" "}
                    <Link href="/tools/timesheet/" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                      add up your work hours
                    </Link>
                    ,{" "}
                    <Link href="/tools/countdown/" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                      create countdowns for events
                    </Link>
                    ,{" "}
                    <Link href="/tools/timezone/" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                      convert time between time zones
                    </Link>
                    , and{" "}
                    <Link href="/tools/market-hours/" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                      check when stock markets open
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-card dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-slate-100">
                  Recent Calculations
                </h3>
                {history.length >= 2 && selectedCalculations.size === 0 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Tip: Select multiple calculations to sum them together</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedCalculations.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedCalculations.size} selected
                    </span>
                    <button
                      onClick={calculateSum}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors animate-in slide-in-from-right-2 duration-300"
                    >
                      Sum Selected
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("clockmath-history");
                    setSelectedCalculations(new Set());
                    setSumResult(null);
                    gaEvent({
                      action: "history_cleared",
                      params: {
                        page: "calculator",
                        device: getDevice(),
                      },
                    });
                  }}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted dark:bg-slate-700/50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  title="Clear all calculation history"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {history.map((entry) => {
                const startTimeFormatted = formatTime(entry.startTime)
                const endTimeFormatted = formatTime(entry.endTime)
                const isExpanded = expandedHistory.has(entry.id)
                const isSelected = selectedCalculations.has(entry.id)

                // Format dates for display
                const formatEntryDate = (dateStr: string | undefined) => {
                  if (!dateStr) return null
                  try {
                    // Parse as local (new Date('yyyy-MM-dd') is UTC midnight,
                    // which renders a day early west of UTC).
                    const [yy, mm, dd] = dateStr.split('-').map(Number)
                    const date = new Date(yy, (mm || 1) - 1, dd || 1)
                    const today = new Date()
                    const yesterday = new Date(today)
                    yesterday.setDate(yesterday.getDate() - 1)

                    if (dateStr === format(today, 'yyyy-MM-dd')) return 'Today'
                    if (dateStr === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday'
                    return format(date, 'MMM d')
                  } catch {
                    return null
                  }
                }

                const startDateFormatted = formatEntryDate(entry.startDate)
                const endDateFormatted = formatEntryDate(entry.endDate)
                const isMultiDay = entry.startDate && entry.endDate && entry.startDate !== entry.endDate

                return (
                  <div
                    key={entry.id}
                    className={`bg-background/50 dark:bg-slate-700/50 rounded-lg overflow-hidden transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer group" title="Click to select for summing">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCalculationSelection(entry.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-border dark:border-slate-600 hover:border-primary/50 group-hover:scale-105'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-primary-foreground absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="20,6 9,17 4,12" strokeWidth="2" />
                              </svg>
                            )}
                          </div>
                        </label>
                        <span className="font-mono text-sm text-muted-foreground">
                          {startTimeFormatted && endTimeFormatted ? (
                            <>
                              {isMultiDay && startDateFormatted && (
                                <span className="text-xs text-primary/70 mr-1">{startDateFormatted}</span>
                              )}
                              {startTimeFormatted}
                              <span className="mx-1">→</span>
                              {isMultiDay && endDateFormatted && (
                                <span className="text-xs text-primary/70 mr-1">{endDateFormatted}</span>
                              )}
                              {endTimeFormatted}
                            </>
                          ) : (
                            <span className="text-red-500 text-xs">
                              Invalid time data
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">
                          {entry.result || "Invalid result"}
                        </span>
                        {entry.detailedResult && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedHistory)
                              if (isExpanded) {
                                newExpanded.delete(entry.id)
                              } else {
                                newExpanded.add(entry.id)
                              }
                              setExpandedHistory(newExpanded)
                            }}
                            className="p-1 hover:bg-muted/50 dark:hover:bg-slate-600 rounded transition-colors"
                            title={isExpanded ? "Hide details" : "Show details"}
                          >
                            <svg 
                              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {isExpanded && entry.detailedResult && (
                      <div className="px-3 pb-3 border-t border-border/50 dark:border-slate-600/50">
                        <div className="pt-3">
                          <div className="text-xs text-muted-foreground mb-2">Detailed breakdown:</div>
                          <DetailedDurationBreakdown 
                            detailedResult={entry.detailedResult}
                            variant="muted"
                            size="small"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sum Result */}
        {sumResult && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-200 dark:border-blue-800 animate-in fade-in-50 duration-500">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Sum of Selected Calculations
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                ✨ Great! You've successfully summed {selectedCalculations.size} calculation{selectedCalculations.size !== 1 ? 's' : ''}
              </p>
              
              {/* Main sum result - largest and centered */}
              <p className="text-4xl font-bold text-blue-900 dark:text-blue-100 font-mono mb-4">
                {sumResult.total}
              </p>
              
              {/* Detailed breakdown */}
              <DetailedDurationBreakdown 
                detailedResult={sumResult.detailed}
                variant="secondary"
                size="large"
              />
            </div>
          </div>
        )}


        <SeoIntro />
        <SiteFooter />
      </div>
    </PageChrome>
  )
}
