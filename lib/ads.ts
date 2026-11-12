// lib/ads.ts
// Google AdSense, prepared Nov 2026 and OFF. Two stages (see NOTES.md, "Ads"):
//
// 1. Publisher ID only (ADSENSE_CLIENT, given at sign-up): the site proves
//    it's yours for AdSense's review. Every page gets the
//    google-adsense-account meta tag (app/layout.tsx) and
//    scripts/build-worker.js writes out/ads.txt. No ads, no ad script, CSP
//    unchanged. An ad unit can't be made until the site is approved, which
//    is why this stage needs only the one ID.
// 2. Plus an ad unit (ADSENSE_SLOT, after approval) = ADS_ENABLED: the ad
//    slots and the AdSense script they load (components/AdSlot.tsx), Google's
//    ad hosts in the worker's CSP (build-worker.js compiles this file), and
//    the advertising text on /privacy.
// With both empty the built site is exactly as before.
//
// Before stage 2, publish a GDPR message in AdSense → Privacy & messaging.
// That message is Google's certified consent tool (TCF), which Google
// requires for ads in the EEA, UK and Switzerland; adsbygoogle.js shows it.
// Our own banner (components/ConsentBanner.tsx) isn't certified.

/** Publisher ID, AdSense → Account → Account information: "ca-pub-" and 16 digits */
export const ADSENSE_CLIENT: string = "";

/** One display ad unit, reused in every slot: AdSense → Ads → By ad unit → Display ads → its data-ad-slot number */
export const ADSENSE_SLOT: string = "";

export const publisherIdValid = (client: string): boolean => /^ca-pub-\d{16}$/.test(client);

export const adsConfigValid = (client: string, slot: string): boolean =>
  publisherIdValid(client) && /^\d{6,}$/.test(slot);

/** Stage 1: the site is claimed for AdSense (meta tag and ads.txt) */
export const ADSENSE_CLAIMED = publisherIdValid(ADSENSE_CLIENT);

/** Stage 2: ads show */
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
