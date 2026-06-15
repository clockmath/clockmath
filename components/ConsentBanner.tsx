"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GA_MEASUREMENT_ID } from "@/lib/gtag";
import {
  type ConsentChoice,
  detectCountry,
  getStoredConsent,
  isLikelyRestrictedByTimezone,
  isRestrictedRegion,
  storeConsent,
  updateConsent,
} from "@/lib/consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Nothing to consent to if analytics isn't configured.
    if (!GA_MEASUREMENT_ID) return;
    // Respect a prior choice — banner only shows until the user decides.
    if (getStoredConsent()) return;

    let cancelled = false;

    (async () => {
      const country = await detectCountry();
      // If geo lookup succeeds, gate strictly on region. If it fails (null),
      // fall back to the timezone heuristic so EU visitors still get prompted.
      const restricted =
        country !== null
          ? isRestrictedRegion(country)
          : isLikelyRestrictedByTimezone();

      if (!cancelled && restricted) setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const choose = (choice: ConsentChoice) => {
    storeConsent(choice);
    updateConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-muted-foreground">
          We use Google Analytics to understand how the site is used. We only set
          analytics cookies with your consent. See our{" "}
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("denied")}>
            Reject
          </Button>
          <Button size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
