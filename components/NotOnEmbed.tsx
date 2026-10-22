'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Renders its children everywhere except /embed/. Wraps GA4, Clarity, Web
 * Vitals and the consent banner in the root layout: an embed runs on other
 * people's sites, where those would set cookies for their visitors (and a
 * consent banner inside a countdown widget makes no sense). Cloudflare's
 * cookieless Web Analytics still counts embed loads by path.
 */
export default function NotOnEmbed({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/embed')) return null;
  return <>{children}</>;
}
