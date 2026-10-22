'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StationChrome from '@/components/station/StationChrome';
import SiteFooter from '@/components/SiteFooter';
import type { ArticleCategory, ArticleLink } from '@/lib/articlesCatalog';
import { Search } from 'lucide-react';
import { useDarkMode } from '@/hooks/use-dark-mode';

type GroupedArticles = Record<ArticleCategory, ArticleLink[]>;

type CategoryCopy = Record<string, { title: string; blurb: string }>;

interface ArticlesIndexContentProps {
  groupedArticles: GroupedArticles;
  categoryCopy: CategoryCopy;
}

export default function ArticlesIndexContent({ groupedArticles }: ArticlesIndexContentProps) {
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'category'>('priority');




  // Flatten all articles for search and filtering
  const allArticles = useMemo(() => {
    return Object.values(groupedArticles).flat();
  }, [groupedArticles]);

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let articles = allArticles;

    // Filter by category
    if (selectedCategory !== 'all') {
      articles = articles.filter(article => article.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query)
      );
    }

    // Sort articles
    return articles.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (b.priority ?? 0) - (a.priority ?? 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  }, [allArticles, selectedCategory, searchQuery, sortBy]);

  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<ArticleCategory | 'all', number> = {
      all: allArticles.length,
      timezone: 0,
      calculator: 0,
      productivity: 0,
      business: 0,
    };
    Object.entries(groupedArticles).forEach(([category, articles]) => {
      stats[category as ArticleCategory] = articles.length;
    });
    return stats;
  }, [allArticles, groupedArticles]);

  const CATEGORY_LABEL: Record<ArticleCategory, string> = {
    timezone: 'Time zones',
    calculator: 'Calculators',
    productivity: 'Productivity',
    business: 'Business',
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <StationChrome currentTool="articles" onToggleTheme={toggleDarkMode} isDarkMode={isDarkMode}>
      <div className="st-intro">
        <h1 className="st-h1">ClockMath Guides</h1>
        <p className="st-lede">Practical guides for work hours, payroll time math, and timezones</p>
      </div>

      {/* Search and filters */}
      <div className="st-filters">
        <label className="st-filter-search">
          <span className="sr-only">Search guides</span>
          <Search aria-hidden="true" />
          <input type="search" placeholder="Search guides" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as ArticleCategory | 'all')}>
            <option value="all">All categories ({categoryStats.all})</option>
            <option value="timezone">Time zones ({categoryStats.timezone})</option>
            <option value="calculator">Calculators ({categoryStats.calculator})</option>
            <option value="productivity">Productivity ({categoryStats.productivity})</option>
            <option value="business">Business ({categoryStats.business})</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'priority' | 'title' | 'category')}>
            <option value="priority">Recommended first</option>
            <option value="title">A to Z</option>
            <option value="category">By category</option>
          </select>
        </label>
      </div>
      <p className="st-filter-count" aria-live="polite">
        {filteredArticles.length} guide{filteredArticles.length !== 1 ? 's' : ''}
        {searchQuery && ` for “${searchQuery}”`}
        {selectedCategory !== 'all' && ` in ${CATEGORY_LABEL[selectedCategory]}`}
        {(searchQuery || selectedCategory !== 'all') && (
          <>
            {' '}
            <button type="button" className="st-link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          </>
        )}
      </p>

      {filteredArticles.length === 0 ? (
        <div className="st-empty">
          <p>No guide matches that. Try another word, or show every guide.</p>
          <button type="button" className="st-btn quiet" onClick={clearFilters}>
            Show all guides
          </button>
        </div>
      ) : (
        <ul className="st-hub">
          {filteredArticles.map((article) => (
            <li key={article.href}>
              <Link href={article.href}>
                <span className="st-hub-title">{article.title}</span>
                <span className="st-hub-desc">{article.description}</span>
                <span className="st-hub-live">{CATEGORY_LABEL[article.category]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="st-more">
        <h2>Can&apos;t find what you&apos;re looking for?</h2>
        <div>
          <p style={{ marginTop: 0 }}>Send your question and we&apos;ll answer it personally.</p>
          <Link href="/contact" className="st-btn quiet">
            Contact us
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 56 }}>
        <SiteFooter />
      </div>
    </StationChrome>
  );
}
