"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, Suspense } from "react";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, RESTRICTED_REGIONS, analyticsAllowedNow } from "@/lib/consent";
import { analyticsSafeUrl } from "@/lib/analyticsUrl";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire page_view on route changes (pageview strips visitor data from the URL).
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

/**
 * The gtag() queue, Consent Mode defaults and config. Until Oct 2026 this was
 * an inline <Script>, which the CSP had to allow with 'unsafe-inline' (the
 * page is built ahead of time, so the script couldn't carry the nonce). As a
 * layout effect it still runs before any component's ordinary effects, so
 * the first page_view (AnalyticsTracker) finds gtag defined.
 */
function initGtag() {
  if (window.gtag) return;
  const w = window as unknown as { dataLayer: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // gtag.js reads each entry as an `arguments` object, not an array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  const gtag = window.gtag;
  gtag("js", new Date());

  // Consent Mode v2: set defaults BEFORE config so gtag.js honors them.
  const denied = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" };
  const granted = { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" };
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {}

  if (stored === "granted") {
    gtag("consent", "default", granted);
  } else if (stored === "denied") {
    gtag("consent", "default", denied);
  } else {
    // No stored choice: granted by default, but denied in EEA/UK/CH
    // (region-scoped defaults take precedence for those visitors) until
    // they accept via the banner. Google resolves the region by IP.
    gtag("consent", "default", granted);
    gtag("consent", "default", { ...denied, region: RESTRICTED_REGIONS, wait_for_update: 500 });
  }

  // Every event inherits page_location/page_referrer from config; give it
  // the cleaned URLs so visitor data never reaches GA (other sites'
  // referrers are left as they are).
  const ref = document.referrer;
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    page_location: analyticsSafeUrl(location.href),
    page_referrer: ref && ref.indexOf(location.origin) === 0 ? analyticsSafeUrl(ref) : ref,
    ...(process.env.NEXT_PUBLIC_GA_DEBUG === "true" ? { debug_mode: true } : {}),
  });
}

function GtagInit() {
  useLayoutEffect(initGtag, []);
  return null;
}

/**
 * Loads the gtag.js library only once analytics is allowed (lib/consent's
 * analyticsAllowedNow, the same gate as Clarity): outside the EEA/UK/CH by
 * default, inside them only after "Accept". Calls made before then wait in
 * dataLayer and are sent once it loads; if it never loads, nothing is sent.
 * Injected by hand rather than with <Script src>, which also preloaded the
 * 180 KB library at high priority on every page (and in Early Hints).
 */
function GtagLoader() {
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (cancelled || document.getElementById("ga4-src")) return;
      const s = document.createElement("script");
      s.id = "ga4-src";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(s);
    };
    analyticsAllowedNow().then((ok) => {
      if (ok) load();
    });
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail === "granted") load();
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    };
  }, []);
  return null;
}

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <GtagInit />
      <GtagLoader />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
