'use client';

import { useEffect, useRef, useState } from 'react';
import { event as gaEvent } from '@/lib/gtag';
import { dismissInstall, recentlyDismissed, toolUses, USES_BEFORE_OFFER } from '@/lib/installPrompt';

/** Chrome and Edge's install event (not in the DOM types yet) */
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * "Install ClockMath": a small slip at the foot of the screen, offered only
 * to people who keep coming back to the tools (lib/installPrompt). Chrome and
 * Edge get their own install dialog from the button; iPhone and iPad Safari,
 * which have no install event, get the two taps to do it. Also registers the
 * service worker (public/sw.js) that makes the site installable at all.
 */
export default function InstallPrompt() {
  const [mode, setMode] = useState<'prompt' | 'ios' | null>(null);
  const deferred = useRef<InstallEvent | null>(null);

  useEffect(() => {
    // Not on the dev server: a service worker there would cache its pages
    const host = window.location.hostname;
    const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if ('serviceWorker' in navigator && !local) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const eligible = () => !installed && toolUses() >= USES_BEFORE_OFFER && !recentlyDismissed();

    // Holding the event also keeps Chrome's own install bar off first visits
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallEvent;
      if (eligible()) {
        setMode('prompt');
        gaEvent({ action: 'install_offer_shown', params: { kind: 'prompt' } });
      }
    };
    const onInstalled = () => {
      setMode(null);
      gaEvent({ action: 'app_installed', params: {} });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (ios && safari && eligible()) {
      setMode('ios');
      gaEvent({ action: 'install_offer_shown', params: { kind: 'ios' } });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!mode) return null;

  const notNow = () => {
    dismissInstall();
    setMode(null);
    gaEvent({ action: 'install_offer_dismissed', params: { kind: mode } });
  };

  const install = async () => {
    const e = deferred.current;
    if (!e) return;
    deferred.current = null;
    await e.prompt();
    const { outcome } = await e.userChoice;
    gaEvent({ action: 'install_offer_choice', params: { outcome } });
    if (outcome === 'dismissed') dismissInstall();
    setMode(null);
  };

  return (
    <section className="st-install" aria-labelledby="st-install-title">
      <p id="st-install-title" className="st-install-title">
        Install ClockMath
      </p>
      {mode === 'prompt' ? (
        <>
          <p>Open the calculators like an app, from your home screen or dock. Pages you&apos;ve used open offline too.</p>
          <div className="st-install-actions">
            <button type="button" className="st-install-go" onClick={install}>
              Install
            </button>
            <button type="button" className="st-install-later" onClick={notNow}>
              Not now
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Keep it on your home screen: tap the Share button, then <strong>Add to Home Screen</strong>.
          </p>
          <div className="st-install-actions">
            <button type="button" className="st-install-later" onClick={notNow}>
              Got it
            </button>
          </div>
        </>
      )}
    </section>
  );
}
