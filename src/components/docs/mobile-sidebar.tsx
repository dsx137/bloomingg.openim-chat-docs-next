import { MenuIcon } from '@/src/components/ui/icons';
import type { ReactNode } from 'react';
import { ContextPicker, type ContextOption } from '@/src/components/docs/context-picker';
import { SidebarNav } from '@/src/components/docs/sidebar-nav';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';
import { localizeNavContextTitle } from '@/src/lib/localized-docs';
import type { NavContext } from '@/src/types/docs';

export function MobileSidebar({
  context,
  options,
  currentPath,
  locale = 'en',
  sidebarIntro,
  showVersion,
}: {
  context: NavContext;
  options: ContextOption[];
  currentPath: string;
  locale?: Locale;
  sidebarIntro?: ReactNode;
  showVersion: boolean;
}) {
  const text = t(locale);
  const rawTitle = showVersion ? context.title : context.title.replace(/\s*·\s*v\d+\b/i, '');
  const title = localizeNavContextTitle(rawTitle, locale);

  return (
    <details className="mobile-sidebar">
      <summary>
        <MenuIcon />
        {text.docs.browse} {title}
      </summary>
      <div>
        {sidebarIntro}
        <ContextPicker currentKey={context.key} locale={locale} options={options} />
        <SidebarNav currentPath={currentPath} locale={locale} nodes={context.nodes} />
      </div>
    </details>
  );
}
