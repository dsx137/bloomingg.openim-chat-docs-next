import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { NavNode } from '@/src/types/docs';
import { nodeContainsPath } from '@/src/lib/navigation';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import { localizeNavNodeTitle } from '@/src/lib/localized-docs';

export function SidebarNav({
  nodes,
  currentPath,
  locale = 'en',
}: {
  nodes: NavNode[];
  currentPath: string;
  locale?: Locale;
}) {
  return (
    <nav aria-label="Documentation navigation" className="sidebar-tree">
      {nodes.map((node) => (
        <SidebarNode
          currentPath={currentPath}
          depth={0}
          key={node.id}
          locale={locale}
          node={node}
        />
      ))}
    </nav>
  );
}

function SidebarNode({
  node,
  currentPath,
  depth,
  locale,
}: {
  node: NavNode;
  currentPath: string;
  depth: number;
  locale: Locale;
}) {
  const active = node.href === currentPath;
  const containsActive = nodeContainsPath(node, currentPath);
  const title = localizeNavNodeTitle(node, locale);

  if (node.children.length === 0) {
    if (!node.href) return null;
    const isNestedOverview = node.segment === 'overview' && node.id.includes('/');
    return (
      <Link
        aria-current={active ? 'page' : undefined}
        className={`sidebar-link ${isNestedOverview ? 'is-nested-overview' : ''} ${active ? 'is-active' : ''}`}
        href={toLocalizedPath(node.href, locale)}
        style={{ '--nav-depth': depth } as CSSProperties}
      >
        {title}
      </Link>
    );
  }

  return (
    <details className="sidebar-group" open={containsActive || depth === 0}>
      <summary style={{ '--nav-depth': depth } as CSSProperties}>
        {node.href ? (
          <Link
            aria-current={active ? 'page' : undefined}
            href={toLocalizedPath(node.href, locale)}
          >
            {title}
          </Link>
        ) : (
          <span>{title}</span>
        )}
      </summary>
      <div>
        {node.children.map((child) => (
          <SidebarNode
            currentPath={currentPath}
            depth={depth + 1}
            key={child.id}
            locale={locale}
            node={child}
          />
        ))}
      </div>
    </details>
  );
}
