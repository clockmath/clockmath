import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  publishDate?: string;
  keywords?: string;
  noindex?: boolean;
  ogImage?: string;
}

/**
 * Generate standardized metadata for Next.js 13+ App Router
 * Ensures consistent SEO implementation across all pages
 */
export function generateSEOMetadata({
  title,
  description,
  path,
  type = 'website',
  publishDate,
  keywords,
  noindex = false,
  ogImage = '/og-v3.png',
}: SEOConfig): Metadata {
  // Ensure canonical URL is properly formatted (non-www, with trailing slash)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `https://clockmath.com${cleanPath}${cleanPath.endsWith('/') ? '' : '/'}`;

  const baseMetadata: Metadata = {
    metadataBase: new URL('https://clockmath.com'),
    title,
    description,
    keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Open Graph
    openGraph: {
      title,
      description,
      type,
      url: canonicalUrl,
      siteName: 'ClockMath',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `ClockMath - ${title}`,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    
    // Robots
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
      },
    },
    
    // Additional metadata
    generator: 'Next.js',
    applicationName: 'ClockMath',
    referrer: 'origin-when-cross-origin',
    authors: [{ name: 'ClockMath', url: 'https://clockmath.com' }],
    creator: 'ClockMath',
    publisher: 'ClockMath',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };

  // Add article-specific metadata
  if (type === 'article' && publishDate) {
    baseMetadata.openGraph = {
      ...baseMetadata.openGraph,
      type: 'article',
      publishedTime: publishDate,
      modifiedTime: publishDate,
      authors: ['ClockMath'],
      section: 'Time Calculation Guides',
    };
  }

  return baseMetadata;
}
