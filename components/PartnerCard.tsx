'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { detectCountry } from '@/lib/consent';
import { event as gaEvent } from '@/lib/gtag';
import { partnerShows, type Partner } from '@/lib/affiliates';

/**
 * A partner (affiliate) link after a work-hours tool's answer (Nov 2026; see
 * lib/affiliates.ts). Labelled "Partner" with the commission said in plain
 * words next to the link (FTC: clear and close to the link). Rendered only
 * after mount, for the partner's countries, so the static HTML never has it
 * and server and client match. On localhost /api/geo doesn't exist, so dev
 * counts as the US to show it.
 */
export default function PartnerCard({ partner, tool }: { partner: Partner; tool: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!partner.url) return;
    let live = true;
    detectCountry().then((country) => {
      const c = country ?? (process.env.NODE_ENV === 'development' ? 'US' : null);
      if (live) setShow(partnerShows(partner, c));
    });
    return () => {
      live = false;
    };
  }, [partner]);
  if (!show) return null;
  return (
    <aside className="st-partner max-w-3xl mx-auto mb-section" aria-label={`Partner: ${partner.name}`}>
      <span className="st-partner-tag">Partner</span>
      <p className="st-partner-head">{partner.heading}</p>
      <p className="st-partner-body">{partner.body}</p>
      <a
        href={partner.url}
        target="_blank"
        rel="sponsored noopener"
        className="st-partner-link"
        onClick={() => gaEvent({ action: 'partner_click', params: { partner: partner.id, tool } })}
      >
        {partner.cta}
        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
      </a>
      <p className="st-partner-note">ClockMath earns a commission if you sign up through this link. It doesn’t change your price.</p>
    </aside>
  );
}
