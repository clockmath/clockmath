import Link from "next/link";
import StationChrome from "./station/StationChrome";
import RelatedArticles from "./RelatedArticles";
import ArticleAnalytics from "./ArticleAnalytics";
import ArticleCtaLink from "./ArticleCtaLink";
import SiteFooter from "./SiteFooter";
import JsonLd, { getArticleSchema } from "./JsonLd";
import { ARTICLE_LINKS, TOOL_LINKS } from "@/lib/articlesCatalog";

interface ArticleLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  publishDate?: string;
  category?: 'timezone' | 'calculator' | 'productivity' | 'business';
  currentPath?: string;
}

const CATEGORY_LABEL: Record<NonNullable<ArticleLayoutProps['category']>, string> = {
  timezone: 'Time zones',
  calculator: 'Calculators',
  productivity: 'Productivity',
  business: 'Business',
};

// "2025-01-15" → "January 15, 2025"; bare years pass through unchanged.
function formatPublishDate(publishDate: string): string {
  const m = publishDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return publishDate;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * The tool an article's closing call-to-action points at: the first entry of
 * its catalog `relatedTools`. This used to be hardcoded to the homepage
 * duration calculator, so a timezone guide's main button skipped the timezone
 * converter and a sleep guide's skipped the sleep calculator. Falls back to the
 * homepage for an article with no catalog entry.
 */
function primaryToolFor(currentPath: string) {
  const href = ARTICLE_LINKS.find((a) => a.href === currentPath)?.relatedTools?.[0] ?? "/";
  return TOOL_LINKS.find((t) => t.href === href) ?? TOOL_LINKS[0];
}

export default function ArticleLayout({
  children,
  title,
  description,
  publishDate = "2025",
  category = "calculator",
  currentPath = ""
}: ArticleLayoutProps) {
  const primaryTool = primaryToolFor(currentPath);
  return (
    // Articles share the site chrome (nav included) — they used to be
    // navigational dead ends with only a "Back to ClockMath" link.
    <StationChrome currentTool="articles">
      <JsonLd
        data={getArticleSchema({
          headline: title,
          description,
          url: `https://clockmath.com${currentPath}${currentPath.endsWith('/') ? '' : '/'}`,
          // publishDate may be a bare year ("2025") or a full ISO date
          // ("2025-01-15") — appending "-01-01" to the latter emitted invalid
          // dates like "2025-01-15-01-01" in the JSON-LD.
          datePublished: /^\d{4}$/.test(publishDate) ? `${publishDate}-01-01` : publishDate,
        })}
      />
      <ArticleAnalytics title={title} category={category} currentPath={currentPath} />

      <div className="st-intro">
        <nav className="st-crumbs" aria-label="Breadcrumb">
          <Link href="/articles/">Guides</Link> / {CATEGORY_LABEL[category]}
        </nav>
        <h1 className="st-h1">{title}</h1>
        <p className="st-lede">{description}</p>
        <p className="st-byline">Published {formatPublishDate(publishDate)}</p>
      </div>

      <article className="st-article article-prose">{children}</article>

      {/* Call to action: the tool this guide is about */}
      <section className="st-callout">
        <h2>{primaryTool.title}</h2>
        <p>{primaryTool.description}</p>
        <ArticleCtaLink href={primaryTool.href} title={title} />
      </section>

      <RelatedArticles currentPath={currentPath} category={category} maxArticles={3} />

      <div style={{ marginTop: 56 }}>
        <SiteFooter />
      </div>
    </StationChrome>
  );
}
