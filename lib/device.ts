/**
 * "mobile" | "desktop" for analytics events, by input type (a touch screen
 * is "mobile"). One definition: until Oct 2026 nine files had their own, and
 * four of them used window width instead, so the same visit could count as
 * mobile in one tool and desktop in another.
 */
export const getDevice = (): 'mobile' | 'desktop' =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches ? 'mobile' : 'desktop';
