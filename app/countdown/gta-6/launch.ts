import { buildDay } from '@/lib/buildDay';

// Single source of truth for the release date — easy to update if it slips
// again (Nov 19, 2026, local midnight).
export const GTA6_RELEASE = new Date(2026, 10, 19);

/**
 * The page and its title switch from countdown to "GTA 6 is out" by build
 * date: any deploy on or after release day ships the launch version, no code
 * change needed (both versions are below). The day passing alone changes
 * nothing — the static page only changes on a deploy. If the date slips,
 * moving GTA6_RELEASE moves the switch with it. Oct 2026.
 */
export const LAUNCHED = buildDay().getTime() >= GTA6_RELEASE.getTime();
