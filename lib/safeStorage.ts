/**
 * localStorage that never throws. Safari with "Block all cookies", Chrome's
 * "block site data" and some embedded browsers throw a SecurityError on any
 * localStorage access; unguarded, that error inside an effect replaced the
 * whole page with Next's "client-side exception" screen (Oct 2026 audit).
 * Reads fall back to null and writes are dropped, so tools just forget
 * settings instead of breaking.
 */
export function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked or full — the setting just isn't remembered */
  }
}

export function storageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
