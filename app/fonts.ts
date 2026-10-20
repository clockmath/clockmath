import localFont from "next/font/local";

/**
 * Geist Mono, declared here instead of importing `GeistMono` from "geist":
 * the package's export preloads the 58 KB font on every page at high
 * priority, but only a handful of tools use `font-mono` (decimal results,
 * timesheet and overtime figures, the time picker) — the Thanksgiving page,
 * for one, never renders it (Oct 2026 audit). Same file and settings,
 * `preload: false`: the browser fetches it only when mono text appears.
 */
export const GeistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  preload: false,
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Roboto Mono",
    "Menlo",
    "Monaco",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Courier New",
    "monospace",
  ],
  weight: "100 900",
});
