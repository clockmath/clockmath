"use client"

import { useClassicView } from "@/hooks/use-classic-view"

// Switches between the current design and classic view (the old green look).
// The label names where the button takes you, not where you are.
export function ClassicToggle() {
  const [isClassic, toggle] = useClassicView()
  const label = isClassic ? "New view" : "Classic view"
  return (
    <button type="button" className="st-view" onClick={toggle} aria-pressed={isClassic} title={`Switch to ${label.toLowerCase()}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 10h18M9 10v10" />
      </svg>
      <span>{label}</span>
    </button>
  )
}
