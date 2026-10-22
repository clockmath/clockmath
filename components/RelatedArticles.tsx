"use client";

import Link from 'next/link';
import { event as gaEvent } from '@/lib/gtag';
import {
  ARTICLE_LINKS,
  TOOL_LINKS,
  type ArticleLink,
  type ToolLink,
  type ArticleCategory,
} from '@/lib/articlesCatalog';

interface RelatedArticlesProps {
  currentPath: string;
  category?: ArticleCategory;
  maxArticles?: number;
  showAllCategories?: boolean;
}

/**
 * Intelligent related articles component that creates semantic content clusters
 * for improved internal linking and SEO
 */
export default function RelatedArticles({
  currentPath,
  category,
  maxArticles = 3,
  showAllCategories = false,
}: RelatedArticlesProps) {
  // Get related articles based on category and current page
  const getRelatedArticles = (): ArticleLink[] => {
    // Filter out current article when the page path is known
    let related = [...ARTICLE_LINKS];

    if (currentPath) {
      related = related.filter(article => article.href !== currentPath);
    }

    // Deterministic per-page rotation: without it every article in a category
    // shows the identical top-priority 3 links, concentrating internal links
    // on the same few pages and leaving the rest under-linked.
    const seed = currentPath
      .split('')
      .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 997, 0);
    const byPriority = (a: ArticleLink, b: ArticleLink) => (b.priority || 0) - (a.priority || 0);
    const rotate = (arr: ArticleLink[]): ArticleLink[] => {
      if (arr.length < 2) return arr;
      const offset = seed % arr.length;
      return [...arr.slice(offset), ...arr.slice(0, offset)];
    };

    if (!showAllCategories && category) {
      // Prioritize same category
      const sameCategory = rotate(related.filter(article => article.category === category).sort(byPriority));
      const otherCategories = rotate(related.filter(article => article.category !== category).sort(byPriority));

      // Mix same category (80%) with other categories (20%) for diversity
      const sameCategoryCount = Math.min(Math.ceil(maxArticles * 0.8), sameCategory.length);
      const otherCategoryCount = maxArticles - sameCategoryCount;

      related = [
        ...sameCategory.slice(0, sameCategoryCount),
        ...otherCategories.slice(0, otherCategoryCount),
      ];
      return related.slice(0, maxArticles);
    }

    return rotate(related.sort(byPriority)).slice(0, maxArticles);
  };

  // Get cross-links to tools: the article's curated relatedTools first,
  // falling back to a generic per-category default.
  const getRelatedTools = (): ToolLink[] => {
    const current = ARTICLE_LINKS.find(article => article.href === currentPath);
    if (current?.relatedTools?.length) {
      return current.relatedTools
        .map(href => TOOL_LINKS.find(link => link.href === href))
        .filter((link): link is ToolLink => Boolean(link));
    }
    if (category === 'timezone') {
      const tool = TOOL_LINKS.find(link => link.href === '/tools/timezone');
      return tool ? [tool] : TOOL_LINKS.slice(0, 1);
    } else if (category === 'calculator') {
      const tool = TOOL_LINKS.find(link => link.href === '/');
      return tool ? [tool] : TOOL_LINKS.slice(0, 1);
    }
    return TOOL_LINKS.slice(0, 1);
  };

  const relatedArticles = getRelatedArticles();
  const relatedTools = getRelatedTools();

  if (relatedArticles.length === 0 && relatedTools.length === 0) {
    return null;
  }

  // Category colors for visual distinction
  return (
    <>
      {relatedTools.length > 0 && (
        <section className="st-more">
          <h2>Helpful tools</h2>
          <div>
            <ul className="st-links">
              {relatedTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    onClick={() =>
                      gaEvent({ action: 'related_tool_click', params: { from: currentPath, target: tool.href, category } })
                    }
                  >
                    {tool.title}
                  </Link>
                  <span>{tool.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {relatedArticles.length > 0 && (
        <section className="st-more">
          <h2>More guides</h2>
          <div>
            <ul className="st-links">
              {relatedArticles.map((article) => (
                <li key={article.href}>
                  <Link
                    href={article.href}
                    onClick={() =>
                      gaEvent({ action: 'related_article_click', params: { from: currentPath, target: article.href, category } })
                    }
                  >
                    {article.title}
                  </Link>
                  <span>{article.description}</span>
                </li>
              ))}
            </ul>
            {category === 'timezone' && (
              <p style={{ marginTop: 14 }}>
                <Link href="/articles/timezone-converters">View all timezone guides</Link>
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
