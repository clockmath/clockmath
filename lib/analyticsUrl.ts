/**
 * URLs as analytics may see them. Several tools put the visitor's own data
 * in the address: a shared timesheet's ?d= carries names, pay rates and
 * every shift; a shared countdown's ?title= and ?to= carry a personal event.
 * GA attaches the current URL to every event (page_location) and the
 * previous one as page_referrer, so until Oct 2026 that data went to Google
 * with every click. Only campaign-tracking parameters are kept.
 */
export const ANALYTICS_PARAM_ALLOWLIST = /^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid|msclkid|fbclid)$/i;

/** `href` with every query parameter outside the allowlist removed. */
export function analyticsSafeUrl(href: string): string {
  try {
    const u = new URL(href);
    for (const key of [...u.searchParams.keys()]) {
      if (!ANALYTICS_PARAM_ALLOWLIST.test(key)) u.searchParams.delete(key);
    }
    u.hash = '';
    return u.toString();
  } catch {
    return '';
  }
}

/** True when the current address carries something a visitor typed in. */
export function urlHasVisitorData(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  const params = new URLSearchParams(search);
  return ['d', 'title', 'to'].some((k) => params.has(k));
}
