"use client"

/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import InfoTip from "@/components/InfoTip"
import SeoIntro from "@/components/SeoIntro"
import SiteFooter from "@/components/SiteFooter"
import StationChrome from "@/components/station/StationChrome"
import StationFold from "@/components/station/StationFold"
import { Flap } from "@/components/station/Flap"
import { InlineTimePicker } from "@/components/ui/InlineTimePicker"
import { InlineDatePicker } from "@/components/ui/InlineDatePicker"
import { DetailedDurationBreakdown } from "@/components/DetailedDurationBreakdown"
import { format, intervalToDuration, type Duration } from "date-fns"
import { event as gaEvent, toolUsed } from "@/lib/gtag"
import JsonLd, { getSoftwareApplicationSchema, getOrganizationSchema, getWebSiteSchema } from "@/components/JsonLd"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { useClockFormat } from "@/hooks/use-clock-format"
import { storageRemove } from "@/lib/safeStorage"
import { copyText } from "@/lib/clipboard"
import { useCalculateFeedback } from "@/hooks/use-answer-feedback"
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
  // Every Calculate shows it worked: the tiles flip again (even for the same
  // answer), the button says "Updated", and the answer is scrolled into view
  const answerRef = useRef<HTMLDivElement>(null)
  const { round, updated, confirm } = useCalculateFeedback(answerRef)




  // The site's shared 12h/24h setting (useClockFormat)
  const [is24HourFormat, setIs24HourFormat] = useClockFormat()

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
    confirm()
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
  }, [startDate, startTime, endDate, endTime, spanFor, confirm])

  // Calculate and Enter submit the form. A time typed and entered in the same
  // keystroke reaches state in that event, so the calculation runs in an
  // effect, on the render that has it.
  const [submits, setSubmits] = useState(0)
  useEffect(() => {
    if (submits) calculate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submits])

  // A start date moved while both dates were the same day takes the end date
  // with it: Oct 20, 9:00–17:30 read "4 days 8h 30m" with the end left on
  // Today. Overnight spans still roll to the next day on their own.
  const changeStartDate = useCallback((d: Date) => {
    if (startDate.toDateString() === endDate.toDateString()) setEndDate(d)
    setStartDate(d)
  }, [startDate, endDate])

  // "How long since 8:15?": the current minute, today
  const setNow = useCallback((which: "start" | "end") => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`
    if (which === "start") {
      setStartDate(now)
      setStartTime(time)
    } else {
      setEndDate(now)
      setEndTime(time)
    }
  }, [])

  // This exact span is in the history already: the button says Saved
  const alreadySaved = history.some(
    (h) =>
      h.startDate === format(calculated.startDate, "yyyy-MM-dd") &&
      h.startTime === calculated.startTime &&
      h.endDate === format(calculated.endDate, "yyyy-MM-dd") &&
      h.endTime === calculated.endTime,
  )

  const saveToHistory = useCallback(() => {
    if ("error" in span || stale || alreadySaved) return
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
  }, [span, stale, alreadySaved, calculated])

  const copyResult = useCallback(async () => {
    if ("error" in span || !span.detailed || stale) return
    // copyText falls back where the clipboard API is blocked
    if (await copyText(`${span.summary} (${span.detailed.hours.toFixed(2)} hours)`)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
          {/* A form, so Enter in a field calculates as the button does */}
          <form
            id="st-calc-form"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmits((n) => n + 1)
            }}
          >
          <div className="st-fields">
            <div className="st-field">
              <div className="st-field-head">
                <span>Start</span>
                <button type="button" className="st-now" onClick={() => setNow("start")} aria-label="Set start to now">Now</button>
              </div>
              <div className="st-pair">
                <InlineDatePicker ariaLabel="Start date" value={startDate} onChange={changeStartDate} placeholder="Select date" startOnCalendar />
                <InlineTimePicker ariaLabel="Start time" value={startTime} onChange={setStartTime} is24h={is24HourFormat} placeholder="Time" />
              </div>
            </div>
            <div className="st-field">
              <div className="st-field-head">
                <span>End</span>
                <button type="button" className="st-now" onClick={() => setNow("end")} aria-label="Set end to now">Now</button>
              </div>
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
            <button type="submit" className="st-btn primary">{updated ? "Updated" : "Calculate"}</button>
            <span className="sr-only" role="status">{updated ? "Answer updated" : ""}</span>
            {stale && <p>Times changed. Press Calculate for the new answer.</p>}
          </div>
          </form>

          {"error" in span ? (
            <div ref={answerRef} className={`st-answer${stale ? " stale" : ""}`} aria-live="polite">
              <p className="st-error">{span.error}</p>
            </div>
          ) : (
            <>
              <div ref={answerRef} className={`st-answer${stale ? " stale" : ""}`} aria-live="polite">
                {/* The figures on split-flap tiles; the plain answer for screen readers */}
                <p key={round} className={`st-big${bigParts.length > 3 ? " long" : ""}`} aria-hidden="true">
                  {bigParts.map(([n, u]) => (
                    <span key={u}>
                      <Flap value={String(n)} />
                      <span className="u">{u}</span>
                    </span>
                  ))}
                </p>
                <span className="sr-only">{span.summary}</span>
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
                    <button type="button" className="st-btn primary" onClick={saveToHistory} disabled={stale || alreadySaved}>
                      {alreadySaved && !stale ? "Saved" : "Save to history"}
                    </button>
                    <button type="button" className="st-btn quiet" onClick={copyResult} disabled={stale}>{copied ? "Copied" : "Copy result"}</button>
                  </div>
                </div>
              </div>
              {span.detailed && (
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="st-link-btn" onClick={() => setShowBreakdown((prev) => !prev)} aria-expanded={showBreakdown}>
                    {showBreakdown ? "Hide the other units" : "Show it in other units"}
                  </button>
                  {showBreakdown && (
                    <div style={{ marginTop: 12 }}>
                      <DetailedDurationBreakdown detailedResult={span.detailed} omit={["hours", "minutes"]} />
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

        {/* History: a ruled list like the timesheet's summary. Tick rows to
            add them up; the total goes on the line's board. */}
        {history.length > 0 && (
          <section className="st-history" aria-labelledby="st-history-title">
            <div className="st-history-head">
              <h2 id="st-history-title">
                Recent calculations
                {history.length >= 2 && (
                  <InfoTip label="adding up calculations">
                    Tick two or more calculations and press Add them up, for example separate work sessions in a day.
                  </InfoTip>
                )}
              </h2>
              <div className="st-history-tools">
                {selectedCalculations.size > 0 && (
                  <>
                    <span>{selectedCalculations.size} selected</span>
                    <button type="button" className="st-btn primary" onClick={calculateSum}>Add them up</button>
                    <button type="button" className="st-btn quiet" onClick={clearSelection}>Clear selection</button>
                  </>
                )}
                <button
                  type="button"
                  className="st-link-btn"
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
                >
                  Clear history
                </button>
              </div>
            </div>

            <ul className="st-history-list">
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
                const label = startTimeFormatted && endTimeFormatted
                  ? `${isMultiDay && startDateFormatted ? `${startDateFormatted} ` : ""}${startTimeFormatted} – ${isMultiDay && endDateFormatted ? `${endDateFormatted} ` : ""}${endTimeFormatted}`
                  : "Invalid time data"

                return (
                  <li key={entry.id} data-selected={isSelected || undefined}>
                    <div className="st-history-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCalculationSelection(entry.id)}
                        />
                        <span>{label}</span>
                      </label>
                      <span className="st-history-result">{entry.result || "Invalid result"}</span>
                      {entry.detailedResult && (
                        <button
                          type="button"
                          className="st-history-more"
                          onClick={() => {
                            const newExpanded = new Set(expandedHistory)
                            if (isExpanded) {
                              newExpanded.delete(entry.id)
                            } else {
                              newExpanded.add(entry.id)
                            }
                            setExpandedHistory(newExpanded)
                          }}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Hide details for ${label}` : `Show details for ${label}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isExpanded && entry.detailedResult && (
                      <DetailedDurationBreakdown detailedResult={entry.detailedResult} />
                    )}
                  </li>
                )
              })}
            </ul>

            {sumResult && (
              <div className="st-result st-sum" aria-live="polite">
                <p>
                  Total of {selectedCalculations.size} calculation{selectedCalculations.size !== 1 ? "s" : ""}
                </p>
                <p className="st-figure">{sumResult.total}</p>
                <DetailedDurationBreakdown detailedResult={sumResult.detailed} />
              </div>
            )}
          </section>
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
