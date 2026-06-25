// lib/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

type GtagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Hostnames that should never send hits to production GA
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

// Check if analytics should be blocked
const isAnalyticsBlocked = () => {
  if (typeof window === "undefined") return true;

  const hostname = window.location.hostname;
  return process.env.NODE_ENV === 'development' ||
         process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === 'true' ||
         LOCAL_HOSTNAMES.has(hostname) ||
         hostname.endsWith('.local') ||
         !GA_MEASUREMENT_ID;
};

const log = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA] ${message}`);
  }
};

// gtag() is the dataLayer shim defined by the inline init script. Calls made
// before the GTM library finishes loading are queued in dataLayer and replayed
// automatically, so there is no need to wait/poll for the library.
export const pageview = (url: string) => {
  if (isAnalyticsBlocked()) {
    return;
  }

  // GA4 tracks pages via the `page_view` event using `page_location`/`page_title`
  // (page_path is a legacy Universal Analytics param). Re-calling `config` per
  // navigation is a GA4 anti-pattern that can double-count, so send an event.
  window.gtag?.("event", "page_view", {
    page_location: window.location.origin + url,
    page_title: document.title,
  });

  log(`pageview sent: ${url}`);
};

export const event = ({ action, params = {} }: GtagEvent) => {
  if (isAnalyticsBlocked()) {
    return;
  }
  window.gtag?.("event", action, params);
  log(`event sent: ${action}`);
};

// Unified tool-usage event so tool popularity is comparable in one report.
// Callers fire this once per page session (on first real use of the tool) so
// counts reflect users-who-used-it rather than raw interactions.
export const toolUsed = (
  tool: "calculator" | "countdown" | "timezone" | "timesheet",
  params: Record<string, unknown> = {},
) => {
  event({ action: "tool_used", params: { tool, ...params } });
};
