import Link from 'next/link';
import type { BreadcrumbItem } from '@/src/types/docs';

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`}>
            {item.href ? <Link href={item.href}>{item.title}</Link> : <span>{item.title}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
