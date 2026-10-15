/**
 * The day the site was built, as a local-midnight Date. Tools that need a
 * placeholder date before mount (so server and client render identical
 * HTML) use this instead of a hard-coded day: the static HTML crawlers read
 * then shows a current date, not "Jan 1, 2025". next.config.mjs inlines
 * NEXT_PUBLIC_BUILD_DATE into both bundles, so it is the same on both sides.
 * Tools still switch to the visitor's actual today on mount.
 */
export function buildDay(): Date {
  const [y, m, d] = (process.env.NEXT_PUBLIC_BUILD_DATE || '2026-01-01').split('-').map(Number);
  return new Date(y, m - 1, d);
}
