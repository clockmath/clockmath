'use client';

import { useEffect, useState } from 'react';

/**
 * Printing a sheet that isn't the page: while `printing` is true, render the
 * sheet into a portal with id="print-chart"; html.printing-chart (globals.css)
 * hides everything else for the print. The sheet is in the DOM only while
 * printing, so the static HTML carries each table once. Moved out of
 * PrintChartButton (Nov 2026) for the daylight saving dates sheet.
 */
export function usePrintSheet(): [boolean, () => void] {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!printing) return;
    const root = document.documentElement;
    root.classList.add('printing-chart');
    const done = () => {
      root.classList.remove('printing-chart');
      setPrinting(false);
    };
    window.addEventListener('afterprint', done, { once: true });
    // Wait a frame so the portal is in the DOM before the print dialog opens.
    const id = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', done);
      root.classList.remove('printing-chart');
    };
  }, [printing]);

  return [printing, () => setPrinting(true)];
}
