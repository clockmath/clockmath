"use client"

/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import InfoTip from "@/components/InfoTip"
import SeoIntro from "@/components/SeoIntro"
import SiteFooter from "@/components/SiteFooter"
import StationChrome from "@/components/station/StationChrome"
import StationFold from "@/components/station/StationFold"
import { InlineTimePicker } from "@/components/ui/InlineTimePicker"
import { InlineDatePicker } from "@/components/ui/InlineDatePicker"
import { DetailedDurationBreakdown } from "@/components/DetailedDurationBreakdown"
import { format, intervalToDuration, type Duration } from "date-fns"
import { event as gaEvent, toolUsed } from "@/lib/gtag"
import JsonLd, { getSoftwareApplicationSchema, getOrganizationSchema, getWebSiteSchema } from "@/components/JsonLd"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { storageRemove } from "@/lib/safeStorage"
import { getDevice } from "@/lib/device"

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


type StoredCalculation = Omit<CalculationHistory, "timestamp"> & { timestamp: string };

export default function ClockMathPage() {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00:00")
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState("17:30:00")
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [isDarkMode, toggleTheme] = useDarkMode();
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [selectedCalculations, setSelectedCalculations] = useState<Set<string>>(new Set());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false)
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
    return parts.length ? parts.join(" ") : "0s"
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

  // The inputs the answer was last calculated from. Editing the fields doesn't
  // change the answer until Calculate is pressed (Oct 2026: people set both
  // ends first, then want the result); the page opens on the defaults' answer.
  const [calculated, setCalculated] = useState(() => ({ startDate, startTime, endDate, endTime }))
  const stale =
    calculated.startTime !== startTime ||
    calculated.endTime !== endTime ||
    calculated.startDate.toDateString() !== startDate.toDateString() ||
    calculated.endDate.toDateString() !== endDate.toDateString()

  // The span between a set of inputs. Same date with an earlier end time is
  // an overnight span (22:00 → 06:00), as the FAQ promises: the end is the
  // next day. A genuinely earlier end date is an error.
  const spanFor = useCallback((inputs: typeof calculated) => {
    const { startDate, startTime, endDate, endTime } = inputs
    const startSeconds = parseTimeToSeconds(startTime)
    const endSeconds = parseTimeToSeconds(endTime)
    if (isNaN(startSeconds) || isNaN(endSeconds)) return { error: "Enter a start and end time, like 09:00." } as const

    const at = (date: Date, secs: number) => {
      const d = new Date(date)
      d.setHours(Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60, 0)
      return d
    }
    const start = at(startDate, startSeconds)
    const end = at(endDate, endSeconds)
    let overnight = false
    if (end < start && end.toDateString() === start.toDateString()) {
      end.setDate(end.getDate() + 1)
      overnight = true
    }
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000)
    if (seconds < 0) return { error: "The end is before the start. Pick a later end date or time." } as const
    return {
      start,
      end,
      seconds,
      overnight,
      parts: intervalToDuration({ start, end }),
      summary: formatDuration(start, end),
      detailed: formatDetailedDuration(seconds),
    }
  }, [parseTimeToSeconds, formatDuration, formatDetailedDuration])

  const span = useMemo(() => spanFor(calculated), [spanFor, calculated])

  const calculate = useCallback(() => {
    const inputs = { startDate, startTime, endDate, endTime }
    setCalculated(inputs)
    if (!toolUsedRef.current) {
      toolUsedRef.current = true
      toolUsed("calculator", { device: getDevice() })
    }
    const result = spanFor(inputs)
    if ("error" in result) return
    const daysDiff = Math.floor(result.seconds / 86400)
    gaEvent({
      action: "calculation_completed",
      params: {
        page: "calculator",
        duration_seconds: result.seconds,
        duration_days: daysDiff,
        is_multi_day: daysDiff > 0,
        device: getDevice(),
      },
    })
  }, [startDate, startTime, endDate, endTime, spanFor])

  const saveToHistory = useCallback(() => {
    if ("error" in span || stale) return
    const { startDate, startTime, endDate, endTime } = calculated
    const newEntry: CalculationHistory = {
      id: Date.now().toString(),
      startDate: format(startDate, 'yyyy-MM-dd'),
      startTime,
      endDate: format(endDate, 'yyyy-MM-dd'),
      endTime,
      result: span.summary,
      seconds: span.seconds, // Store raw seconds for efficient sum calculations
      detailedResult: span.detailed || undefined,
      timestamp: new Date()
    }
    setHistory(prev => [newEntry, ...prev.slice(0, 9)]) // Keep last 10

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

    gaEvent({ action: "calculation_saved", params: { page: "calculator", device: getDevice() } })
  }, [span, stale, calculated])

  const copyResult = useCallback(async () => {
    if ("error" in span || !span.detailed || stale) return
    try {
      await navigator.clipboard.writeText(`${span.summary} (${span.detailed.hours.toFixed(2)} hours)`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the answer is on screen to copy by hand
    }
  }, [span, stale])

  // The big answer: "8h 30m", "2d 4h", "1y 3mo 2d". Seconds only under a day.
  const bigParts: Array<[number, string]> = []
  if (!("error" in span)) {
    const p = span.parts
    const units: Array<[number | undefined, string]> = [[p.years, "y"], [p.months, "mo"], [p.days, "d"], [p.hours, "h"], [p.minutes, "m"]]
    for (const [n, u] of units) if (n) bigParts.push([n, u])
    if (p.seconds && !p.years && !p.months && !p.days) bigParts.push([p.seconds, "s"])
    if (bigParts.length === 0) bigParts.push([0, "m"])
  }

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
      storageRemove("clockmath-history")
    }
  }, [])

  return (
    <StationChrome currentTool="calculator" onToggleTheme={toggleTheme} isDarkMode={isDarkMode}>
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getWebSiteSchema()} />
      <JsonLd
        data={getSoftwareApplicationSchema({
          name: 'ClockMath Time Duration Calculator',
          description: 'Calculate the time difference between two times instantly. Handles overnight shifts, shows results in hours, minutes, seconds, and decimal formats.',
          url: 'https://clockmath.com/',
        })}
      />
      <div>
        <div className="st-intro">
          <h1 className="st-h1">Time Duration Calculator</h1>
          <p className="st-lede">
            The exact time between two times or dates, overnight included, with decimal hours for timesheets. Free, no signup.
          </p>
        </div>

        {/* One ruled band: inputs, Calculate, the answer */}
        <section className="st-calc" aria-label="Duration calculator">
          <div className="st-fields">
            <div className="st-field">
              <span>Start</span>
              <div className="st-pair">
                <InlineDatePicker ariaLabel="Start date" value={startDate} onChange={setStartDate} placeholder="Select date" startOnCalendar />
                <InlineTimePicker ariaLabel="Start time" value={startTime} onChange={setStartTime} is24h={is24HourFormat} placeholder="Time" />
              </div>
            </div>
            <div className="st-field">
              <span>End</span>
              <div className="st-pair">
                <InlineDatePicker ariaLabel="End date" value={endDate} onChange={setEndDate} placeholder="Select date" startOnCalendar />
                <InlineTimePicker ariaLabel="End time" value={endTime} onChange={setEndTime} is24h={is24HourFormat} placeholder="Time" />
              </div>
            </div>
            <div className="st-seg" role="group" aria-label="Clock format">
              <button type="button" onClick={() => setIs24HourFormat(false)} aria-pressed={!is24HourFormat}>12h</button>
              <button type="button" onClick={() => setIs24HourFormat(true)} aria-pressed={is24HourFormat}>24h</button>
            </div>
          </div>

          <div className="st-go">
            <button type="button" className="st-btn primary" onClick={calculate}>Calculate</button>
            {stale && <p>Times changed. Press Calculate for the new answer.</p>}
          </div>

          {"error" in span ? (
            <div className={`st-answer${stale ? " stale" : ""}`} aria-live="polite">
              <p className="st-error">{span.error}</p>
            </div>
          ) : (
            <>
              <div className={`st-answer${stale ? " stale" : ""}`} aria-live="polite">
                <p className={`st-big${bigParts.length > 3 ? " long" : ""}`}>
                  {bigParts.map(([n, u]) => (
                    <span key={u}>
                      {n.toLocaleString()}
                      <span className="u">{u}</span>
                    </span>
                  ))}
                </p>
                <div>
                  {span.detailed && (
                    <dl className="st-also">
                      <div><dt>Decimal hours</dt><dd>{span.detailed.hours.toFixed(2)}</dd></div>
                      <div><dt>Total minutes</dt><dd>{Math.round(span.detailed.minutes).toLocaleString()}</dd></div>
                    </dl>
                  )}
                  {span.overnight && (
                    <p className="st-note">The end is earlier than the start, so it counts to {formatTime(calculated.endTime)} the next day.</p>
                  )}
                  <div className="st-actions">
                    <button type="button" className="st-btn primary" onClick={saveToHistory} disabled={stale}>Save to history</button>
                    <button type="button" className="st-btn quiet" onClick={copyResult} disabled={stale}>{copied ? "Copied" : "Copy result"}</button>
                  </div>
                </div>
              </div>
              {span.detailed && (
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="st-link-btn" onClick={() => setShowBreakdown((prev) => !prev)} aria-expanded={showBreakdown}>
                    {showBreakdown ? "Hide the breakdown" : "Show it in weeks, days and seconds"}
                  </button>
                  {showBreakdown && (
                    <div style={{ marginTop: 12 }}>
                      <DetailedDurationBreakdown detailedResult={span.detailed} variant="primary" size="large" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Intent-matched nudge: decimal hours usually means payroll math */}
        <p className="st-nudge">
          Adding up a work week?{" "}
          <Link href="/tools/timesheet/">Total your shifts in the work hours calculator</Link>, with breaks, overnight shifts and gross pay.
        </p>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-card rounded-lg p-5 sm:p-6 mt-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-slate-100 inline-flex items-center gap-1.5">
                  Recent Calculations
                  {history.length >= 2 && (
                    <InfoTip label="adding up calculations">
                      Tick two or more calculations and press Sum Selected to add them together, for example
                      separate work sessions in a day.
                    </InfoTip>
                  )}
                </h3>
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
                    storageRemove("clockmath-history");
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
          <div className="bg-card rounded-lg p-5 sm:p-6 mt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sum of Selected Calculations
              </h3>
              <p className="text-xs text-foreground mb-4">
                Total of {selectedCalculations.size} calculation{selectedCalculations.size !== 1 ? 's' : ''}
              </p>
              
              {/* Main sum result - largest and centered */}
              <p className="text-4xl font-bold text-foreground font-mono mb-4">
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


        <StationFold>
          <div className="st-legacy">
            <SeoIntro />
          </div>
        </StationFold>
        <SiteFooter />
      </div>
    </StationChrome>
  )
}
