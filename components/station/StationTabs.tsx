"use client"

import Link from "next/link"
import { navClick } from "@/lib/gtag"

// The header tabs. Client-side only for the nav_click event, the same one
// the old ToolsNavigation sent (surface "tab"), so nav reports carry on.
export function StationTabs({
  tabs,
  active,
}: {
  tabs: ReadonlyArray<{ id: string; label: string; href: string }>
  active: string | null
}) {
  return (
    <nav className="st-tabs" aria-label="Tools">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={t.id === active ? "page" : undefined} onClick={() => navClick(t.id, "tab")}>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
