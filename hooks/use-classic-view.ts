'use client';

import { useCallback, useEffect, useState } from 'react';
import { storageSet } from '@/lib/safeStorage';
import { event as gaEvent } from '@/lib/gtag';

/**
 * Classic view: the pre-October-2026 look (green palette, Geist, rounded
 * cards) on the current layouts, for visitors who prefer it. Like dark mode,
 * the inline script in app/layout.tsx applies the saved choice to <html>
 * before paint; this hook only mirrors and flips that class.
 */
export function useClassicView(): [boolean, () => void] {
  const [isClassic, setIsClassic] = useState(false);

  useEffect(() => {
    setIsClassic(document.documentElement.classList.contains('classic'));
  }, []);

  const toggleClassic = useCallback(() => {
    setIsClassic((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('classic', next);
      storageSet('clockmath-classic', String(next));
      gaEvent({ action: 'view_style_changed', params: { style: next ? 'classic' : 'new' } });
      return next;
    });
  }, []);

  return [isClassic, toggleClassic];
}
