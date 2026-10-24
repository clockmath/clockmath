/**
 * A duration in other units: "8.50 hours, 510 minutes, 30,600 seconds".
 *
 * Only units the span fills at least once are shown. An 8-hour shift as
 * "0.0010 years, 0.012 months" told nobody anything (Oct 2026); hours,
 * minutes and seconds always show, days and up once the span reaches one.
 * Laid out as ruled figures like the answer's own (st-units, station.css).
 */

interface DetailedDuration {
  years: number
  months: number
  weeks?: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

const fmt = (n: number, digits: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })

export function DetailedDurationBreakdown({
  detailedResult: d,
  omit = [],
}: {
  detailedResult: DetailedDuration
  /** Units already on screen (the homepage board shows hours and minutes). */
  omit?: string[]
}) {
  const units: Array<{ value: string; label: string } | false> = [
    d.years >= 1 && { value: fmt(d.years, 2), label: 'years' },
    d.months >= 1 && { value: fmt(d.months, 2), label: 'months' },
    d.weeks !== undefined && d.weeks >= 1 && { value: fmt(d.weeks, 2), label: 'weeks' },
    d.days >= 1 && { value: fmt(d.days, 2), label: 'days' },
    { value: fmt(d.hours, 2), label: 'hours' },
    { value: fmt(d.minutes, Number.isInteger(d.minutes) ? 0 : 1), label: 'minutes' },
    { value: d.seconds.toLocaleString(), label: 'seconds' },
  ]

  return (
    <dl className="st-units">
      {units.filter((u) => u && !omit.includes(u.label)).map((u) => u && (
        <div key={u.label}>
          <dt>{u.label}</dt>
          <dd>{u.value}</dd>
        </div>
      ))}
    </dl>
  )
}
