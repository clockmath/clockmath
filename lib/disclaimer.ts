/**
 * Reusable disclaimer template for event countdowns that reference a
 * third-party brand. Fill in the brand name and rights holder(s).
 * Example: buildEventDisclaimer('Grand Theft Auto', 'Rockstar Games or Take-Two Interactive')
 * (Lives in lib, not EventCountdown, so lib/countdowns.ts can use it from
 * server code — the embed routes' generateStaticParams.)
 */
export function buildEventDisclaimer(brand: string, rightsHolders: string, opts: { released?: boolean } = {}): string {
  // Once it's out, "Release date subject to change" no longer applies.
  const dateNote = opts.released ? '' : ' Release date subject to change.';
  return `ClockMath is not affiliated with, endorsed by, or sponsored by ${rightsHolders}. "${brand}" and related names are trademarks of their respective owners.${dateNote}`;
}
