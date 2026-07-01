'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';
import type { TocItem } from '@/src/types/docs';

export function TableOfContents({ items, locale = 'en' }: { items: TocItem[]; locale?: Locale }) {
  const text = t(locale);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.url.replace(/^#/, '')))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-112px 0px -72% 0px' },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page" className="toc-nav">
      <p>{text.docs.onThisPage}</p>
      <ul>
        {items.map((item) => {
          const id = item.url.replace(/^#/, '');
          return (
            <li data-depth={item.depth} key={`${item.url}-${item.title}`}>
              <a aria-current={activeId === id ? 'location' : undefined} href={item.url}>
                {item.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
