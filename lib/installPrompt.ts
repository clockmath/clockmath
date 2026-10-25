/**
 * When to offer installing ClockMath as an app (components/station/InstallPrompt):
 * only to people who come back to the tools, never on a first visit, and not
 * again for a month once they say "Not now". Counts live in local storage.
 */
import { storageGet, storageSet } from '@/lib/safeStorage';

const USES_KEY = 'clockmath-tool-uses';
const DISMISSED_KEY = 'clockmath-install-dismissed';
/** Tool sessions (a toolUsed event per tool per page load) before the offer */
export const USES_BEFORE_OFFER = 3;
const QUIET_DAYS = 30;

/** Called from toolUsed: one more session of using a tool */
export function noteToolUse(): void {
  const n = Number(storageGet(USES_KEY)) || 0;
  storageSet(USES_KEY, String(n + 1));
}

export function toolUses(): number {
  return Number(storageGet(USES_KEY)) || 0;
}

export function dismissInstall(): void {
  storageSet(DISMISSED_KEY, String(Date.now()));
}

export function recentlyDismissed(now = Date.now()): boolean {
  const at = Number(storageGet(DISMISSED_KEY)) || 0;
  return at > 0 && now - at < QUIET_DAYS * 86400000;
}
