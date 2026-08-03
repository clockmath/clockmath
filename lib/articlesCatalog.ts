export type ArticleCategory = 'timezone' | 'calculator' | 'productivity' | 'business';

export interface ArticleLink {
  title: string;
  description: string;
  href: string;
  category: ArticleCategory;
  priority?: number;
  /**
   * Hrefs of the most relevant TOOL_LINKS entries for this article, most
   * relevant first. RelatedArticles shows these instead of the generic
   * category default (e.g. the stock-market guide points at the live
   * market-hours tool, not just the timezone converter).
   */
  relatedTools?: string[];
}

export interface ToolLink {
  title: string;
  description: string;
  href: string;
  category: ArticleCategory;
  priority: number;
}

export const ARTICLE_LINKS: ArticleLink[] = [
  {
    title: 'Timezone Converter for Family Calls',
    description: 'Stay connected with loved ones abroad with perfect call timing',
    href: '/articles/timezone-converter-family-calls',
    category: 'timezone',
    priority: 5,
    relatedTools: ['/tools/timezone'],
  },
  {
    title: 'Remote Work Meeting Timezone Converter',
    description: 'Schedule global meetings without confusion',
    href: '/articles/timezone-converter-remote-work-meetings',
    category: 'timezone',
    priority: 5,
    relatedTools: ['/tools/timezone'],
  },
  {
    title: 'Gaming Events Timezone Converter',
    description: 'Never miss game releases or esports tournaments',
    href: '/articles/timezone-converter-gaming-events',
    category: 'timezone',
    priority: 4,
    relatedTools: ['/tools/timezone', '/tools/countdown'],
  },
  {
    title: 'Travel Timezone Converter',
    description: 'Plan international trips with timezone conversion',
    href: '/articles/travel-timezone-converter',
    category: 'timezone',
    priority: 4,
    relatedTools: ['/tools/timezone'],
  },
  {
    title: 'Stock Market Timezone Converter',
    description: 'Track global market opens and closes',
    href: '/articles/stock-market-timezone-converter',
    category: 'timezone',
    priority: 3,
    relatedTools: ['/tools/market-hours', '/tools/timezone'],
  },
  {
    title: 'Work Hours Calculator',
    description: 'Track employee hours and payroll calculations',
    href: '/articles/work-hours-calculator',
    category: 'calculator',
    priority: 5,
    relatedTools: ['/tools/timesheet', '/tools/decimal-hours'],
  },
  {
    title: 'Sleep Hours Calculator',
    description: 'Track your sleep duration and patterns',
    href: '/articles/sleep-hours-calculator',
    category: 'calculator',
    priority: 4,
    relatedTools: ['/'],
  },
  {
    title: 'Overtime Hours Calculator',
    description: 'Calculate overtime pay and hours worked',
    href: '/articles/overtime-hours-calculator',
    category: 'calculator',
    priority: 4,
    relatedTools: ['/tools/timesheet', '/tools/decimal-hours'],
  },
  {
    title: 'Study Time Calculator',
    description: 'Measure and optimize your study sessions',
    href: '/articles/study-time-calculator',
    category: 'calculator',
    priority: 3,
    relatedTools: ['/'],
  },
  {
    title: 'Time Between Dates Calculator',
    description: 'Calculate duration between any two dates',
    href: '/articles/time-between-dates-calculator',
    category: 'calculator',
    priority: 3,
    relatedTools: ['/'],
  },
  {
    title: 'Hours Calculator Online',
    description: 'Why online calculators beat manual calculations',
    href: '/articles/hours-calculator-online',
    category: 'calculator',
    priority: 2,
    relatedTools: ['/tools/timesheet'],
  },
  {
    title: 'Shift Work Hours Calculator',
    description: 'Track overnight shifts and rotating schedules accurately',
    href: '/articles/shift-work-hours-calculator',
    category: 'calculator',
    priority: 4,
    relatedTools: ['/tools/timesheet'],
  },
  {
    title: 'Freelancer Time Tracking',
    description: 'Calculate billable hours and manage client projects',
    href: '/articles/freelancer-time-tracking',
    category: 'calculator',
    priority: 4,
    relatedTools: ['/tools/timesheet', '/tools/decimal-hours'],
  },
  {
    title: 'Timesheet Calculator',
    description: 'Calculate weekly hours and decimal totals for payroll',
    href: '/articles/timesheet-calculator',
    category: 'calculator',
    priority: 4,
    relatedTools: ['/tools/timesheet', '/tools/decimal-hours'],
  },
];

export const TOOL_LINKS: ToolLink[] = [
  {
    title: 'Time Duration Calculator',
    description: 'Calculate time between two times instantly',
    href: '/',
    category: 'calculator',
    priority: 5,
  },
  {
    title: 'Timezone Converter Tool',
    description: 'Convert time between any timezone',
    href: '/tools/timezone',
    category: 'timezone',
    priority: 5,
  },
  {
    title: 'Work Hours & Timesheet Calculator',
    description: 'Add up shifts with breaks, decimal hours, and gross pay',
    href: '/tools/timesheet',
    category: 'calculator',
    priority: 5,
  },
  {
    title: 'Stock Market Hours',
    description: 'Live open/closed status for major exchanges in your timezone',
    href: '/tools/market-hours',
    category: 'timezone',
    priority: 4,
  },
  {
    title: 'Decimal Hours Converter',
    description: 'Minutes to decimal hours (and back) with the payroll chart',
    href: '/tools/decimal-hours',
    category: 'calculator',
    priority: 4,
  },
  {
    title: 'Countdown Timer',
    description: 'Count down to any date and share it',
    href: '/tools/countdown',
    category: 'productivity',
    priority: 3,
  },
];

export function getArticlesByCategory() {
  return ARTICLE_LINKS.reduce<Record<ArticleCategory, ArticleLink[]>>((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }

    acc[article.category].push(article);
    return acc;
  }, {
    timezone: [],
    calculator: [],
    productivity: [],
    business: [],
  });
}
