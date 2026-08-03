import PageChrome from "./PageChrome";
import RelatedArticles from "./RelatedArticles";
import ArticleAnalytics from "./ArticleAnalytics";
import ArticleCtaLink from "./ArticleCtaLink";
import SiteFooter from "./SiteFooter";
import JsonLd, { getArticleSchema } from "./JsonLd";

interface ArticleLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  publishDate?: string;
  category?: 'timezone' | 'calculator' | 'productivity' | 'business';
  currentPath?: string;
}

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

export default function ArticleLayout({
  children,
  title,
  description,
  publishDate = "2025",
  category = "calculator",
  currentPath = ""
}: ArticleLayoutProps) {
  return (
    // Articles share the site chrome (nav included) — they used to be
    // navigational dead ends with only a "Back to ClockMath" link.
    <PageChrome currentTool="articles">
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

      <div className="max-w-4xl mx-auto">
        {/* Article content */}
        <article className="bg-card dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-border/50 dark:border-slate-700/50">
          <header className="mb-8 border-b border-border/50 dark:border-slate-700/50 pb-6">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
              ClockMath Guides
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-slate-100 mb-3">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-400 mb-3">
              {description}
            </p>
            <time className="text-sm text-muted-foreground">
              Published {formatPublishDate(publishDate)}
            </time>
          </header>

          <div className="article-prose max-w-none">
            {children}
          </div>

          {/* Call to action */}
          <div className="mt-section p-5 sm:p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="text-center">
              <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
                Try Our Free Time Calculator
              </h3>
              <p className="text-emerald-700 dark:text-emerald-300 mb-4">
                Calculate time duration instantly with our easy-to-use tool
              </p>
              <ArticleCtaLink href="/" title={title} />
            </div>
          </div>
        </article>

        {/* Smart related articles */}
        <div className="mt-8">
          <RelatedArticles
            currentPath={currentPath}
            category={category}
            maxArticles={3}
          />
        </div>

        <SiteFooter />
      </div>
    </PageChrome>
  );
}
