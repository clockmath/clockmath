"use client";

import { useReportWebVitals } from "next/web-vitals";
import { event } from "@/lib/gtag";

// Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to GA4 as a single
// `web_vitals` event. Respects the same consent/blocking rules as other
// analytics via the shared event() helper.
export default function WebVitals() {
  useReportWebVitals((metric) => {
    event({
      action: "web_vitals",
      params: {
        metric_name: metric.name,
        // CLS is unitless and small; scale to an integer for readable reports.
        // Others are milliseconds — round to whole numbers.
        metric_value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value
        ),
        metric_rating: metric.rating, // "good" | "needs-improvement" | "poor"
        metric_id: metric.id, // unique per page load, for de-duping
      },
    });
  });

  return null;
}
