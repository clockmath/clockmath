"use client";

import { openConsentBanner } from "@/lib/consent";

// Reopens the consent banner so visitors can review or change their choice.
export default function ManageConsentButton() {
  return (
    <button
      type="button"
      onClick={openConsentBanner}
      className="text-primary hover:text-primary/80 underline"
    >
      Manage cookie preferences
    </button>
  );
}
