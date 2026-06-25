/**
 * JsonLd component for adding schema.org structured data to pages.
 * Renders a script tag with JSON-LD markup for SEO.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Pre-built schema generators for common types

// Stable @ids so entities can reference each other across JSON-LD blocks.
const ORG_ID = 'https://clockmath.com/#organization';
const WEBSITE_ID = 'https://clockmath.com/#website';

// Brand/entity schema. Helps Google associate the logo + (later) social
// profiles with the "ClockMath" brand. Add profile URLs to `sameAs` when ready.
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'ClockMath',
    url: 'https://clockmath.com',
    logo: 'https://clockmath.com/icon-512.png',
    description:
      'Free online time, timezone, countdown, and work-hours/timesheet calculators.',
    // Add official profile URLs here to link them to the brand, e.g.:
    // sameAs: ['https://www.reddit.com/...', 'https://x.com/...'],
  };
}

// The website entity, published by the Organization above (linked via @id).
// Mainly signals the site name ("ClockMath") to Google.
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'ClockMath',
    url: 'https://clockmath.com',
    publisher: { '@id': ORG_ID },
  };
}

export function getSoftwareApplicationSchema({
  name,
  description,
  url,
  applicationCategory = 'UtilitiesApplication',
}: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: 'ClockMath',
      url: 'https://clockmath.com',
    },
  };
}

export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: 'ClockMath',
      url: 'https://clockmath.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ClockMath',
      url: 'https://clockmath.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://clockmath.com/og.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
