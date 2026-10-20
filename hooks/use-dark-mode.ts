'use client';

import { useCallback, useEffect, useState } from 'react';
import { storageSet } from '@/lib/safeStorage';

/**
 * The page's dark-mode switch. The inline script in app/layout.tsx applies
 * the saved choice (or the system preference) to <html> before paint, so
 * this only mirrors that class — it never re-reads storage on load. Until
 * Oct 2026 every page carried its own copy that started at `false` and then
 * removed the class the script had just set (a light flash for dark-mode
 * users), and read localStorage unguarded (a crash where storage is blocked).
 */
export function useDarkMode(): [boolean, () => void] {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      storageSet('clockmath-darkmode', String(next));
      return next;
    });
  }, []);

  return [isDarkMode, toggleDarkMode];
}
