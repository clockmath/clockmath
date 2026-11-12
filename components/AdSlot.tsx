'use client';

import { useEffect, useRef } from 'react';
import { ADS_ENABLED, ADSENSE_CLIENT, ADSENSE_SLOT, isAdHost } from '@/lib/ads';
import { urlHasVisitorData } from '@/lib/analyticsUrl';
import { CONSENT_CHANGED_EVENT, getStoredConsent } from '@/lib/consent';

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: 0 | 1 };
  }
}

/**
 * Loads adsbygoogle.js the first time a slot needs it. From the bundle, like
 * gtag.js in Analytics.tsx: the CSP blocks inline scripts that aren't in the
 * built page. It gets the page's CSP nonce (read from a script the worker
 * nonced) so Google can pass it on to the scripts and styles it adds.
 *
 * Not held back by our consent banner: in the EEA, UK and Switzerland,
 * adsbygoogle.js shows Google's own certified consent message (AdSense →
 * Privacy & messaging) and serves no personalised ads without consent.
 * Elsewhere, a visitor who turned tracking off with "Manage cookie
 * preferences" gets non-personalised ads from then on.
 */
function loadAdSense() {
  const queue = (window.adsbygoogle = window.adsbygoogle || []);
  if (document.getElementById('adsense-src')) return queue;
  const applyChoice = () => {
    queue.requestNonPersonalizedAds = getStoredConsent() === 'denied' ? 1 : 0;
  };
  applyChoice();
  window.addEventListener(CONSENT_CHANGED_EVENT, applyChoice);
  const s = document.createElement('script');
  s.id = 'adsense-src';
  s.async = true;
  s.crossOrigin = 'anonymous';
  const nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce;
  if (nonce) s.nonce = nonce;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
  return queue;
}

/**
 * One display ad (Nov 2026; renders nothing until lib/ads.ts has both IDs).
 * Placed by hand, never AdSense "Auto ads", which would drop ads between a
 * tool and its answer board. Each page has one, straight after the tool and
 * before the tinted explainer sections (an ad inside the closed StationFold
 * would never be seen, and Google doesn't fill hidden slots). Never on
 * /embed/ pages, which don't render it.
 *
 * The box reserves its height before the ad arrives, so the page doesn't
 * jump, and collapses if Google has no ad for it (station.css, .st-ad).
 * Off the live host it stays an empty labelled box (lib/ads isAdHost).
 * On a page whose address carries what a visitor typed (a shared timesheet
 * or countdown; lib/analyticsUrl), there's no ad and AdSense isn't loaded:
 * Google reads the page URL with every ad request.
 */
export default function AdSlot() {
  const box = useRef<HTMLElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (!ADS_ENABLED || pushed.current || !el) return;
    if (urlHasVisitorData()) {
      el.hidden = true;
      return;
    }
    if (!isAdHost(window.location.hostname)) {
      el.dataset.preview = '';
      return;
    }
    pushed.current = true;
    try {
      // Fills this slot's <ins> once adsbygoogle.js has loaded
      loadAdSense().push({});
    } catch {
      /* AdSense throws if it finds no empty slot; the box then collapses */
    }
  }, []);

  if (!ADS_ENABLED) return null;
  return (
    <aside ref={box} className="st-ad" aria-label="Advertisement">
      <p className="st-ad-label" aria-hidden="true">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
