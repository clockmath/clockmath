"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, RESTRICTED_REGIONS, analyticsAllowedNow } from "@/lib/consent";
import { ANALYTICS_URL_SNIPPET } from "@/lib/analyticsUrl";

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
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // Consent Mode v2 — set defaults BEFORE config so gtag.js honors them.
          var denied = { ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied' };
          var granted = { ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted', analytics_storage:'granted' };
          var stored = null;
          try { stored = localStorage.getItem('${CONSENT_STORAGE_KEY}'); } catch (e) {}

          if (stored === 'granted') {
            gtag('consent', 'default', granted);
          } else if (stored === 'denied') {
            gtag('consent', 'default', denied);
          } else {
            // No stored choice: granted by default, but denied in EEA/UK/CH
            // (region-scoped defaults take precedence for those visitors) until
            // they accept via the banner. Google resolves the region by IP.
            gtag('consent', 'default', granted);
            gtag('consent', 'default', Object.assign({}, denied, {
              region: ${JSON.stringify(RESTRICTED_REGIONS)},
              wait_for_update: 500
            }));
          }

          // Every event inherits page_location/page_referrer from config;
          // give it the cleaned URLs so visitor data never reaches GA.
          ${ANALYTICS_URL_SNIPPET}
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false, page_location: cmLoc, page_referrer: cmRef${
            process.env.NEXT_PUBLIC_GA_DEBUG === "true" ? ", debug_mode: true" : ""
          } });
        `}
      </Script>
      <GtagLoader />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
