"use client"

import { useDarkMode } from "@/hooks/use-dark-mode"

// The header's light/dark switch, for pages that don't run their own
// useDarkMode (server-rendered guides, privacy, terms, 404). The <html>
// class is the source of truth, so any number of these stay in step.
export function ThemeToggle({ isDarkMode, onToggle }: { isDarkMode?: boolean; onToggle?: () => void }) {
  const [ownDark, ownToggle] = useDarkMode()
  const dark = onToggle ? !!isDarkMode : ownDark
  const toggle = onToggle ?? ownToggle
  return (
    <button
      type="button"
      className="st-theme"
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.4 15.4A9 9 0 0 1 8.6 3.6 9 9 0 1 0 20.4 15.4z" />
        </svg>
      )}
    </button>
  )
}
