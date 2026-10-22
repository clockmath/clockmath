'use client';

import Link from 'next/link';
import { event as gaEvent } from '@/lib/gtag';

interface ArticleCtaLinkProps {
  href: string;
  title: string;
}

export default function ArticleCtaLink({ href, title }: ArticleCtaLinkProps) {
  return (
    <Link
      href={href}
      className="st-btn on-board"
      onClick={() =>
        gaEvent({
          action: 'article_primary_cta_click',
          params: {
            from: title,
            target: href,
          },
        })
      }
    >
      Open the tool
    </Link>
  );
}
