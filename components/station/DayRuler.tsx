"use client"

import { useEffect, useId, useState } from "react"

// 24-hour ruler under the homepage answer: the entered span as an ink bar,
// an hour tick scale over a strip of sky colour (night, dawn, day, dusk),
// and the current time as a red tick. The sky is a typical day, not the
// viewer's sunrise; it's there to make "overnight" visible at a glance.
const SKY: Array<[hour: number, color: string]> = [
  [0, "var(--night)"],
  [5, "var(--night)"],
  [6.5, "var(--dawn)"],
  [8, "var(--day)"],
  [17, "var(--day)"],
  [18.5, "var(--dusk)"],
  [20, "var(--night)"],
  [24, "var(--night)"],
]

const W = 1000
const x = (h: number) => (h / 24) * W

interface DayRulerProps {
  /** Hours since midnight, fractional (9.5 = 09:30). */
  startHour: number
  endHour: number
  /** The span covers a whole day or more: fill the ruler. */
  fullDay: boolean
}

export default function DayRuler({ startHour, endHour, fullDay }: DayRulerProps) {
  const id = useId()
  // Client-only: the build has no "now".
  const [nowHour, setNowHour] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setNowHour(d.getHours() + d.getMinutes() / 60)
    }
    tick()
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [])

  const spans: Array<[number, number]> = fullDay
    ? [[0, 24]]
    : endHour >= startHour
      ? [[startHour, endHour]]
      : [[startHour, 24], [0, endHour]]

  return (
    <div className="st-ruler" aria-hidden="true">
      <div style={{ position: "relative" }}>
        <svg className="bars" viewBox={`0 0 ${W} 50`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sky${id}`} x1="0" x2="1" y1="0" y2="0">
              {SKY.map(([h, c]) => (
                <stop key={h} offset={h / 24} style={{ stopColor: c }} />
              ))}
            </linearGradient>
          </defs>
          {spans.map(([a, b]) => (
            <rect key={a} x={x(a)} y={0} width={Math.max(x(b) - x(a), 2)} height={12} style={{ fill: "var(--ink)" }} />
          ))}
          {Array.from({ length: 25 }, (_, h) => (
            <line
              key={h}
              x1={x(h)}
              x2={x(h)}
              y1={h % 6 === 0 ? 20 : 30}
              y2={42}
              style={{ stroke: "var(--quiet)" }}
              strokeWidth={h % 6 === 0 ? 1.5 : 1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <rect x={0} y={42} width={W} height={8} fill={`url(#sky${id})`} />
          {nowHour !== null && (
            <line x1={x(nowHour)} x2={x(nowHour)} y1={-18} y2={50} style={{ stroke: "var(--signal)" }} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {/* Labels in their own unstretched SVG so the text keeps its shape */}
        <svg className="labels" width="100%" height="22">
          {[0, 6, 12, 18, 24].map((h) => (
            <text key={h} x={`${(h / 24) * 100}%`} y={16} textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}>
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
        {nowHour !== null && (
          <span
            className="st-now-label"
            style={nowHour > 21 ? { right: `calc(${100 - (nowHour / 24) * 100}% + 6px)` } : { left: `calc(${(nowHour / 24) * 100}% + 6px)` }}
          >
            now
          </span>
        )}
      </div>
      <div className="st-ruler-key">
        <span><i style={{ background: "var(--ink)" }} />Your span</span>
        <span><i style={{ background: "var(--signal)", width: 3 }} />Now</span>
        <span>
          <i style={{ width: 54, background: "linear-gradient(90deg, var(--night), var(--dawn), var(--day), var(--dusk), var(--night))" }} />
          Night to night, a typical day
        </span>
      </div>
    </div>
  )
}
