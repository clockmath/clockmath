"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { navClick } from "@/lib/gtag"
import { lineForHref } from "@/lib/lines"

// The header tabs. On narrow screens they scroll sideways: the edge with more
// tabs past it fades (data-more-left / data-more-right, styled in
// station.css) so it's clear there's more, and the current page's tab is
// brought into view on load. Clicks send the nav_click event the old
// ToolsNavigation sent (surface "tab"), so nav reports carry on.
export function StationTabs({
  tabs,
  active,
}: {
  tabs: ReadonlyArray<{ id: string; label: string; href: string }>
  active: string | null
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const current = nav.querySelector<HTMLElement>("a[aria-current]")
    if (current) {
      const left = current.offsetLeft
      const right = left + current.offsetWidth
      // Only scroll when the tab is cut off; centre it, within bounds.
      if (left < nav.scrollLeft || right > nav.scrollLeft + nav.clientWidth) {
        nav.scrollLeft = Math.max(0, left - (nav.clientWidth - current.offsetWidth) / 2)
      }
    }
    const mark = () => {
      const more = nav.scrollWidth - nav.clientWidth
      nav.toggleAttribute("data-more-left", nav.scrollLeft > 1)
      nav.toggleAttribute("data-more-right", more - nav.scrollLeft > 1)
    }
    mark()
    nav.addEventListener("scroll", mark, { passive: true })
    window.addEventListener("resize", mark)
    return () => {
      nav.removeEventListener("scroll", mark)
      window.removeEventListener("resize", mark)
    }
  }, [active])

  return (
    <nav className="st-tabs" aria-label="Tools" ref={ref}>
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={t.id === active ? "page" : undefined}
          data-line={lineForHref(t.href) ?? undefined}
          onClick={() => navClick(t.id, "tab")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
