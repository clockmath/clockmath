import { buildDay } from '@/lib/buildDay';

// Single source of truth for the US release date (Dec 18, 2026, local
// midnight; Disney's film page, rechecked Nov 20, 2026).
export const DOOMSDAY_RELEASE = new Date(2026, 11, 18);

/**
 * The page and its title switch from countdown to "Avengers: Doomsday is out"
 * by build date, like GTA 6's (app/countdown/gta-6/launch.ts): any deploy on
 * or after release day ships the after-release version, no code change
 * needed. If the date slips, moving DOOMSDAY_RELEASE moves the switch with
 * it. Nov 2026.
 */
export const RELEASED = buildDay().getTime() >= DOOMSDAY_RELEASE.getTime();
