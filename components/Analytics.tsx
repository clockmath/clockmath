"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { GA_MEASUREMENT_ID, pageview } from "@/lib/gtag";
import { CONSENT_STORAGE_KEY, RESTRICTED_REGIONS } from "@/lib/consent";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire page_view on route changes
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      {/* GA base */}
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
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

          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false${
            process.env.NEXT_PUBLIC_GA_DEBUG === "true" ? ", debug_mode: true" : ""
          } });
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </>
  );
}
