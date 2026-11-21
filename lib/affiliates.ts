/**
 * Partner (affiliate) links (Nov 2026): the first revenue step from the Nov
 * 20 review. One clearly labelled, link-only card after the answer on the
 * work-hours tools. No scripts, pixels or images from the partner, so the
 * CSP doesn't change. A card shows only when its `url` is set: paste the
 * affiliate link from the partner's dashboard here, nothing else to change.
 *
 * Gusto: chosen Nov 20 2026 from Gusto, Homebase, Connecteam and Time Doctor
 * (gusto.com/affiliates: $200+ per new business customer, 120-day cookie).
 * Payroll is the step after "hours × rate", and Gusto serves US businesses
 * only, so the card shows to US visitors only (lib/consent.ts detectCountry).
 */
export interface Partner {
  id: string;
  name: string;
  /** The affiliate link. Empty: the card doesn't show anywhere. */
  url: string;
  /** Countries (ISO 3166-1 alpha-2) whose visitors see the card. */
  countries: string[];
  heading: string;
  body: string;
  cta: string;
}

export const GUSTO: Partner = {
  id: 'gusto',
  name: 'Gusto',
  url: '',
  countries: ['US'],
  heading: 'Paying hourly staff?',
  body: 'Gusto runs payroll from your team’s hours: paychecks, payroll taxes and filings, for US businesses.',
  cta: 'See Gusto’s plans',
};

/** Whether a visitor from `country` (null: unknown) should see the card. */
export const partnerShows = (p: Partner, country: string | null): boolean => Boolean(p.url) && country !== null && p.countries.includes(country);
