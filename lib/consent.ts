// lib/consent.ts
// Google Consent Mode v2 helpers + region detection for EEA/UK traffic.

export const CONSENT_STORAGE_KEY = "cm_consent";

export type ConsentChoice = "granted" | "denied";

// EEA (EU 27 + Iceland, Liechtenstein, Norway) + UK + Switzerland.
// These are the regions where we require explicit opt-in before granting
// analytics/ads storage. Used both client-side (banner gating) and injected
// into the Consent Mode `region` default so Google enforces it by IP too.
export const RESTRICTED_REGIONS = [
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEA (non-EU)
  "IS", "LI", "NO",
  // UK + Switzerland
  "GB", "CH",
];

const RESTRICTED_SET = new Set(RESTRICTED_REGIONS);

export const isRestrictedRegion = (country: string | null | undefined): boolean =>
  !!country && RESTRICTED_SET.has(country.toUpperCase());

// The four Consent Mode v2 signals, set together for a given choice.
export const consentSignals = (choice: ConsentChoice) => ({
  ad_storage: choice,
  ad_user_data: choice,
  ad_personalization: choice,
  analytics_storage: choice,
});

export const getStoredConsent = (): ConsentChoice | null => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
};

export const storeConsent = (choice: ConsentChoice) => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* storage unavailable — choice simply won't persist */
  }
};

// Push a Consent Mode update to gtag after the user makes a choice.
export const updateConsent = (choice: ConsentChoice) => {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", consentSignals(choice));
};

// Detect the visitor's country. Prefers the Cloudflare Pages geo endpoint;
// falls back to a timezone heuristic when it's unavailable (e.g. local dev or
// static hosting without the function).
export const detectCountry = async (): Promise<string | null> => {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (res.ok) {
      const data: { country?: string } = await res.json();
      if (data.country && data.country !== "XX") return data.country;
    }
  } catch {
    /* fall through to heuristic */
  }
  return null;
};

// Timezone-based heuristic used only when geo lookup fails. Returns true if the
// resolved IANA timezone is in Europe (best-effort; biases toward showing the
// banner, which is the privacy-safe default).
export const isLikelyRestrictedByTimezone = (): boolean => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return tz.startsWith("Europe/");
  } catch {
    return false;
  }
};
