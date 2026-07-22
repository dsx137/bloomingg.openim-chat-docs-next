import Link from 'next/link';
import type { CSSProperties } from 'react';
import { SidebarGroup } from '@/src/components/docs/sidebar-group';
import type { NavNode } from '@/src/types/docs';
import { nodeContainsPath } from '@/src/lib/navigation';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import { localizeNavNodeTitle } from '@/src/lib/localized-docs';

export function SidebarNav({
  nodes,
  currentPath,
  locale = 'en',
  stateKey = 'default',
}: {
  nodes: NavNode[];
  currentPath: string;
  locale?: Locale;
  stateKey?: string;
}) {
  return (
    <nav aria-label="Documentation navigation" className="sidebar-tree">
      {nodes.map((node) => (
        <SidebarNode
          currentPath={currentPath}
          depth={0}
          key={`${stateKey}:${node.id}`}
          locale={locale}
          node={node}
          parentEdition={undefined}
          stateKey={stateKey}
        />
      ))}
    </nav>
  );
}

function hrefPath(href: string | null | undefined): string | undefined {
  return href?.split(/[?#]/, 1)[0];
}

function SidebarNode({
  node,
  currentPath,
  depth,
  locale,
  parentEdition,
  stateKey,
}: {
  node: NavNode;
  currentPath: string;
  depth: number;
  locale: Locale;
  parentEdition?: NavNode['edition'];
  stateKey: string;
}) {
  if (node.locales && !node.locales.includes(locale)) return null;
  const active = node.href === currentPath;
  const containsActive = nodeContainsPath(node, currentPath);
  const title = localizeNavNodeTitle(node, locale);
  const showEnterpriseBadge = node.edition === 'enterprise' && parentEdition !== 'enterprise';
  const renderedTitle = (
    <span className="sidebar-label-row">
      <span className="sidebar-label-text">{title}</span>
      {showEnterpriseBadge ? <span className="sidebar-enterprise-badge">商业版</span> : null}
    </span>
  );

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
        {renderedTitle}
      </Link>
    );
  }

  return (
    <SidebarGroup
      active={active}
      activeOpen={containsActive || hrefPath(node.href) === currentPath}
      depth={depth}
      href={node.href ? toLocalizedPath(node.href, locale) : undefined}
      initialOpen={containsActive || hrefPath(node.href) === currentPath}
      stateKey={`${stateKey}:${node.id}`}
      title={renderedTitle}
    >
      {node.children.map((child) => (
        <SidebarNode
          currentPath={currentPath}
          depth={depth + 1}
          key={`${stateKey}:${child.id}`}
          locale={locale}
          node={child}
          parentEdition={node.edition}
          stateKey={stateKey}
        />
      ))}
    </SidebarGroup>
  );
}
