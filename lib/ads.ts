// lib/ads.ts
// Google AdSense, prepared Nov 2026 and OFF until both IDs below are filled
// in. Everything ad-related keys off ADS_ENABLED: the ad slots and the
// AdSense script they load (components/AdSlot.tsx), the ad hosts in the
// worker's CSP and out/ads.txt (scripts/build-worker.js compiles this file),
// and the advertising text on /privacy. With either ID empty the built site
// is exactly as before.
//
// Before filling them in (see NOTES.md, "Ads"): the site must be approved in
// AdSense, and a GDPR message published in AdSense → Privacy & messaging.
// That message is Google's certified consent tool (TCF), which Google
// requires for ads in the EEA, UK and Switzerland; adsbygoogle.js shows it.
// Our own banner (components/ConsentBanner.tsx) isn't certified.

/** Publisher ID, AdSense → Account → Account information: "ca-pub-" and 16 digits */
export const ADSENSE_CLIENT: string = "";

/** One display ad unit, reused in every slot: AdSense → Ads → By ad unit → Display ads → its data-ad-slot number */
export const ADSENSE_SLOT: string = "";

export const adsConfigValid = (client: string, slot: string): boolean =>
  /^ca-pub-\d{16}$/.test(client) && /^\d{6,}$/.test(slot);

export const ADS_ENABLED = adsConfigValid(ADSENSE_CLIENT, ADSENSE_SLOT);

/** The ads.txt line for a publisher ID (f08c47fec0942fa0 is Google's fixed certification ID) */
export const adsTxt = (client: string): string =>
  `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;

/**
 * Real ads only on the live site. Anywhere else (dev server, *.pages.dev
 * previews) a slot shows an empty labelled box at its reserved size, so the
 * layout can be checked without asking Google for ads on an unapproved host.
 */
export const isAdHost = (hostname: string): boolean => hostname === "clockmath.com";
