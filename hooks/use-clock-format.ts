'use client';

import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/safeStorage';

const KEY = 'clockmath-hour12'; // "true" = 12-hour; the key the sleep and time zone tools already used
const EVENT = 'clockmath:clock-format';

/**
 * The site's one 12h/24h setting, as `is24h`. Until Oct 2026 each tool kept
 * its own: sleep and time zones shared a key and started in 12-hour time,
 * the homepage and countdown tool started in 24-hour time and forgot it, and
 * the work hours page kept it in its draft, so picking 12h on one tool gave
 * 24h on the next. Now every tool reads and writes this, and a change on one
 * reaches the others on the page and in other tabs.
 *
 * Without a saved choice it follows the browser's own clock (12-hour in the
 * US, 24-hour in most of Europe), as the time zone tool did. The server and
 * the first client render both use 12-hour time (most readers are in the
 * US); the saved or browser choice applies on mount.
 */
export function useClockFormat(): [boolean, (is24h: boolean) => void] {
  const [is24h, setIs24hState] = useState(false);

  useEffect(() => {
    const read = () => {
      const saved = storageGet(KEY);
      if (saved !== null) setIs24hState(saved === 'false');
      else setIs24hState(new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 === false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) read();
    };
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setIs24h = useCallback((next: boolean) => {
    setIs24hState(next);
    storageSet(KEY, String(!next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [is24h, setIs24h];
}
