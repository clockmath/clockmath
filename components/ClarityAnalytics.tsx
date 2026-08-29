'use client';

/**
 * Microsoft Clarity, gated by the same consent rules as GA4:
 *  - stored "granted"  → load
 *  - stored "denied"   → never load
 *  - no stored choice  → load only for visitors outside the EEA/UK/CH
 *    (restricted regions wait for the banner, mirroring Consent Mode's
 *    region-scoped defaults — but enforced client-side, since Clarity has
 *    no equivalent server-side region gate)
 *  - reacts live to banner choices via CONSENT_CHANGED_EVENT: grant injects
 *    the tag, deny stops an already-running session
 *
 * No project id (NEXT_PUBLIC_CLARITY_ID, set in .env.local) → renders
 * nothing, same as GA with no measurement id. Never loads on localhost.
 */

import { useEffect } from 'react';
import {
  CONSENT_CHANGED_EVENT,
  getStoredConsent,
  detectCountry,
  isRestrictedRegion,
  isLikelyRestrictedByTimezone,
} from '@/lib/consent';

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

function injectClarity() {
  if (document.getElementById('clarity-tag')) return;
  window.clarity =
    window.clarity ||
    function (...args: unknown[]) {
      // Standard Clarity queue shim — replays calls once the tag loads.
      ((window.clarity as unknown as { q?: unknown[] }).q =
        (window.clarity as unknown as { q?: unknown[] }).q || []).push(args);
    };
  const s = document.createElement('script');
  s.id = 'clarity-tag';
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
  // Explicit cookie-consent signal — we only inject after consent resolves.
  window.clarity('consent');
}

export default function ClarityAnalytics() {
  useEffect(() => {
    if (!CLARITY_ID) return;
    // NEXT_PUBLIC_CLARITY_DEBUG mirrors NEXT_PUBLIC_GA_DEBUG: lets local dev
    // exercise the injection/consent gating without deploying.
    const debug = process.env.NEXT_PUBLIC_CLARITY_DEBUG === 'true';
    if (!debug && (LOCAL_HOSTNAMES.has(window.location.hostname) || window.location.hostname.endsWith('.local'))) return;

    let cancelled = false;

    const gate = async () => {
      const stored = getStoredConsent();
      if (stored === 'granted') return injectClarity();
      if (stored === 'denied') return;
      // No choice yet: allowed unless the visitor is in an opt-in region.
      const country = await detectCountry();
      if (cancelled) return;
      const restricted = country ? isRestrictedRegion(country) : isLikelyRestrictedByTimezone();
      if (!restricted) injectClarity();
    };
    gate();

    const onChange = (e: Event) => {
      const choice = (e as CustomEvent).detail;
      if (choice === 'granted') injectClarity();
      else if (choice === 'denied') window.clarity?.('stop');
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
    };
  }, []);

  return null;
}
