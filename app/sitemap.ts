import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

// Define the base URL for the site
const baseUrl = 'https://clockmath.com';

/**
 * Recursively find all page.tsx files in the app directory
 * to automatically generate sitemap entries
 */
function getAllPages(dir: string, basePath: string = ''): string[] {
  const pages: string[] = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      const urlPath = path.posix.join(basePath, item.name);
      
      if (item.isDirectory()) {
        // Recursively search subdirectories
        pages.push(...getAllPages(fullPath, urlPath));
      } else if (item.isFile() && item.name === 'page.tsx') {
        // Found a page, add its path to the list
        const routePath = formatRoutePath(basePath);
        pages.push(routePath);
      }
    }
  } catch {
    // Directory not readable, return empty pages
  }
  
  return pages;
}

function formatRoutePath(basePath: string): string {
  if (!basePath) {
    return '/';
  }

  const normalized = basePath
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');

  return `/${normalized}`;
}

/**
 * Get article metadata for better lastmod dates
 */
function getArticleMetadata(articlePath: string) {
  try {
    const filePath = path.join(process.cwd(), 'app', articlePath, 'page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract publish date if available (rough regex match)
    const publishDateMatch = content.match(/publishDate['":\s]*['"]([^'"]+)['"]/);
    const publishDate = publishDateMatch ? publishDateMatch[1] : null;
    
    return { lastmod: publishDate };
  } catch {
    return { lastmod: null };
  }
}

/**
 * Last commit date (YYYY-MM-DD) of a page's own folder and the tool
 * component it renders, or null without git. Oct 2026 review: every tool
 * page said 2025-01-15 after a month of changes, and the homepage said
 * "today" on every build; Bing (most of the traffic) reads lastmod. Shared
 * chrome (header, footer) is left out so one footer edit doesn't touch
 * every page.
 */
function gitLastmod(page: string): string | null {
  const dir = path.join('app', page.substring(1));
  const files = [page === '/' ? 'app/page.tsx' : dir];
  try {
    const src = fs.readFileSync(path.join(process.cwd(), dir, 'page.tsx'), 'utf-8');
    for (const m of src.matchAll(/@\/components\/(\w+(?:Tool|Converter|Hub))['"]/g)) files.push(`components/${m[1]}.tsx`);
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = path.join(process.cwd(), 'app');
  // Embeds (/embed/…) are noindex widget frames, not pages to list.
  const pages = Array.from(new Set(getAllPages(appDir))).filter((p) => !p.startsWith('/embed'));
  
  // Define custom priorities and change frequencies for different page types
  const sitemapEntries: MetadataRoute.Sitemap = pages.map((page) => {
    let priority = 0.5;
    let changeFreq: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
    let lastmod = gitLastmod(page) ?? '2025-01-15';
    
    // Determine priority and change frequency based on page type
    if (page === '/') {
      priority = 1.0;
      changeFreq = 'weekly';
    } else if (page === '/tools' || page.startsWith('/tools/')) {
      priority = 0.9;
      changeFreq = 'monthly';
    } else if (page.startsWith('/countdown/')) {
      // Event countdown landing pages — deliberate traffic-capture pages.
      priority = 0.8;
      changeFreq = 'weekly';
      // Honest lastmod: the lastUpdated stamp each page carries (falls back
      // to the generic date if a page hasn't been stamped).
      try {
        const content = fs.readFileSync(path.join(process.cwd(), 'app', page.substring(1), 'page.tsx'), 'utf-8');
        const m = content.match(/lastUpdated="(\d{4}-\d{2}-\d{2})"/);
        if (m) lastmod = m[1];
      } catch {
        // keep default
      }
    } else if (page === '/articles') {
      priority = 0.85;
      changeFreq = 'weekly';
    } else if (page.startsWith('/articles/')) {
      priority = 0.8;
      changeFreq = 'monthly';
      // Get specific article metadata
      const articleMetadata = getArticleMetadata(page.substring(1)); // Remove leading slash
      // Edited after publishing: the later date is the modification
      if (articleMetadata.lastmod && articleMetadata.lastmod > lastmod) lastmod = articleMetadata.lastmod;
    } else if (page === '/contact') {
      priority = 0.7;
      changeFreq = 'monthly';
    } else if (page === '/privacy' || page === '/terms') {
      priority = 0.3;
      changeFreq = 'yearly';
    }
    
    return {
      url: `${baseUrl}${page === '/' ? '/' : `${page.replace(/\/+$/, '')}/`}`,
      lastModified: lastmod,
      changeFrequency: changeFreq,
      priority: priority,
    };
  });
  
  // Add any additional static pages that might not be auto-discovered
  const additionalPages: MetadataRoute.Sitemap = [
    // Add any API routes or special pages here if needed
  ];
  
  return [...sitemapEntries, ...additionalPages];
}

// Export the sitemap function as the default export
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate once per day
