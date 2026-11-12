/**
 * Image badges: "42 days until Christmas" as an SVG at
 * /badge/countdown/<slug>.svg, for sites whose editors strip iframes
 * (WordPress.com's cheaper plans, Wix, Google Sites, forums, newsletters,
 * READMEs). A link around an <img> survives where the embed's iframe and
 * credit don't (Nov 2026: no embed had been copied in its first three weeks).
 *
 * The worker draws them (scripts/worker/badges.js). It gets this table from
 * the build: app/badge/countdown/data.json/route.ts writes it into the
 * export and scripts/build-worker.js bakes it into _worker.js, so a badge
 * counts with the same build day, dates and spec as the event page's answer
 * sentence.
 */
import { COUNTDOWNS, type CountdownEntry } from '@/lib/countdowns';
import { liveSpecFor } from '@/lib/liveSpec';
import { tileShade } from '@/lib/colour';
import { buildDay } from '@/lib/buildDay';

export interface BadgeEntry {
  /** "Christmas", for alt text and the gallery. */
  name: string;
  /** After "days until": "Christmas", "the 2027 total solar eclipse". */
  title: string;
  /** Shown instead of the count while the event is on. */
  arrived: string;
  /** The worker's day-count spec (lib/liveSpec.ts). */
  spec: string;
  color: string;
  ink: string;
  tile: string;
  /** The event page the badge links to. */
  path: string;
}

// tileShade gives "rgb(r g b)"; the badge says #rrggbb, which every SVG
// renderer reads (the space syntax is newer than some image libraries).
const toHex = (rgb: string) => {
  const parts = rgb.match(/\d+/g);
  if (!rgb.startsWith('rgb(') || !parts || parts.length < 3) return rgb;
  return `#${parts.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
};

// The clock-change countdown counts to the viewer's own next change (their
// zone's rules), which a badge served to everyone can't know: no badge.
const hasBadge = (e: CountdownEntry) => !e.clockChange;

export const BADGE_SLUGS = (Object.keys(COUNTDOWNS) as Array<keyof typeof COUNTDOWNS>).filter((s) =>
  hasBadge(COUNTDOWNS[s] as CountdownEntry),
);

/** The badge table, keyed by slug. */
export function badgeEntries(fromYear = buildDay().getFullYear()): Record<string, BadgeEntry> {
  const out: Record<string, BadgeEntry> = {};
  for (const slug of BADGE_SLUGS) {
    const entry = COUNTDOWNS[slug] as CountdownEntry;
    const { board } = entry.spec;
    const eclipse = entry.eclipse;
    const title = eclipse?.title ?? entry.spec.countdownTitle ?? entry.name;
    const spec = eclipse ? `t:${eclipse.peakMs}` : liveSpecFor(entry.spec, fromYear);
    if (!spec) continue;
    out[slug] = {
      name: entry.name,
      title,
      // Same fallback as the embed's heading (components/embed/CountdownEmbed.tsx)
      arrived: eclipse?.arrivedLabel ?? entry.spec.arrivedLabel ?? `${title} is here`,
      spec,
      color: board.color,
      ink: board.ink ?? '#ffffff',
      tile: toHex(tileShade(board.color)),
      path: entry.path,
    };
  }
  return out;
}

/** The badge's address for an event. */
export const badgePath = (slug: string) => `/badge/countdown/${slug}.svg`;
