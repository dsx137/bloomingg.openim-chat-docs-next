import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { NavContext, NavNode } from '@/src/types/docs';
import { nodeContainsPath } from '@/src/lib/navigation';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import { localizeNavNodeTitle } from '@/src/lib/localized-docs';
import { SidebarDisclosure } from '@/src/components/docs/sidebar-disclosure';

export function SidebarNav({
  nodes,
  currentPath,
  locale = 'en',
  sidebarExpansion = 'top-level',
  stateScope = 'docs',
}: {
  nodes: NavNode[];
  currentPath: string;
  locale?: Locale;
  sidebarExpansion?: NavContext['sidebarExpansion'];
  stateScope?: string;
}) {
  return (
    <nav aria-label="Documentation navigation" className="sidebar-tree">
      {nodes.map((node) => (
        <SidebarNode
          currentPath={currentPath}
          depth={0}
          inheritedEnterprise={false}
          key={node.id}
          locale={locale}
          node={node}
          sidebarExpansion={sidebarExpansion}
          stateScope={stateScope}
        />
      ))}
    </nav>
  );
}

function SidebarNode({
  node,
  currentPath,
  depth,
  inheritedEnterprise,
  locale,
  sidebarExpansion,
  stateScope,
}: {
  node: NavNode;
  currentPath: string;
  depth: number;
  inheritedEnterprise: boolean;
  locale: Locale;
  sidebarExpansion: NavContext['sidebarExpansion'];
  stateScope: string;
}) {
  const active = node.href === currentPath;
  const containsActive = nodeContainsPath(node, currentPath);
  const title = localizeNavNodeTitle(node, locale);

  if (node.children.length === 0) {
    if (!node.href) return null;
    return (
      <Link
        aria-current={active ? 'page' : undefined}
        className={`sidebar-link ${active ? 'is-active' : ''}`}
        href={toLocalizedPath(node.href, locale)}
        style={{ '--nav-depth': depth } as CSSProperties}
      >
        <SidebarNodeLabel
          inheritedEnterprise={inheritedEnterprise}
          locale={locale}
          node={node}
          title={title}
        />
      </Link>
    );
  }

  return (
    <SidebarDisclosure
      className="sidebar-group"
      initiallyOpen={containsActive || (sidebarExpansion === 'top-level' && depth === 0)}
      stateKey={`${stateScope}:${node.id}`}
    >
      <summary style={{ '--nav-depth': depth } as CSSProperties}>
        {node.href ? (
          <Link
            aria-current={active ? 'page' : undefined}
            href={toLocalizedPath(node.href, locale)}
          >
            <SidebarNodeLabel
              inheritedEnterprise={inheritedEnterprise}
              locale={locale}
              node={node}
              title={title}
            />
          </Link>
        ) : (
          <SidebarNodeLabel
            inheritedEnterprise={inheritedEnterprise}
            locale={locale}
            node={node}
            title={title}
          />
        )}
      </summary>
      <div>
        {node.children.map((child) => (
          <SidebarNode
            currentPath={currentPath}
            depth={depth + 1}
            inheritedEnterprise={inheritedEnterprise || node.edition === 'enterprise'}
            key={child.id}
            locale={locale}
            node={child}
            sidebarExpansion={sidebarExpansion}
            stateScope={stateScope}
          />
        ))}
      </div>
    </SidebarDisclosure>
  );
}

function SidebarNodeLabel({
  inheritedEnterprise,
  locale,
  node,
  title,
}: {
  inheritedEnterprise: boolean;
  locale: Locale;
  node: NavNode;
  title: string;
}) {
  return (
    <span className="sidebar-label-row">
      <span className="sidebar-label-text">{title}</span>
      {node.edition === 'enterprise' && !inheritedEnterprise ? (
        <span className="sidebar-enterprise-badge">
          {locale === 'zh' ? '商业版' : 'Enterprise'}
        </span>
      ) : null}
    </span>
  );
}
