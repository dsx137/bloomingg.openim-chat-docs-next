import type { ReactNode } from 'react';
import { ContextPicker, type ContextOption } from '@/src/components/docs/context-picker';
import { MobileSidebar } from '@/src/components/docs/mobile-sidebar';
import { SidebarNav } from '@/src/components/docs/sidebar-nav';
import { SidebarPane } from '@/src/components/docs/sidebar-pane';
import { TableOfContents } from '@/src/components/docs/table-of-contents';
import type { Locale } from '@/src/lib/i18n';
import type { NavContext, TocItem } from '@/src/types/docs';

export function DocsShell({
  children,
  context,
  contextOptions,
  currentPath,
  locale = 'en',
  overview = false,
  sidebarIntro,
  showVersion,
  toc,
}: {
  children: ReactNode;
  context: NavContext;
  contextOptions: ContextOption[];
  currentPath: string;
  locale?: Locale;
  overview?: boolean;
  sidebarIntro?: ReactNode;
  showVersion: boolean;
  toc: TocItem[];
}) {
  return (
    <>
      <MobileSidebar
        context={context}
        currentPath={currentPath}
        locale={locale}
        options={contextOptions}
        sidebarIntro={sidebarIntro}
        showVersion={showVersion}
      />
      <div className={`docs-grid ${overview ? 'is-overview' : ''}`}>
        <SidebarPane stateScope={context.key}>
          {sidebarIntro}
          <ContextPicker currentKey={context.key} locale={locale} options={contextOptions} />
          <SidebarNav
            currentPath={currentPath}
            locale={locale}
            nodes={context.nodes}
            sidebarExpansion={context.sidebarExpansion}
            stateScope={context.key}
          />
        </SidebarPane>
        <article className="docs-article">{children}</article>
        <aside className="docs-toc">
          <TableOfContents items={toc} locale={locale} />
        </aside>
      </div>
    </>
  );
}
