import type { ReactNode } from 'react';
import { GlobalHeader } from '@/src/components/site/global-header';
import { siteConfig } from '@/src/config/site';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';

export function DocsLayoutShell({
  children,
  locale = 'en',
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const text = t(locale);

  return (
    <div className="site-shell">
      <GlobalHeader locale={locale} />
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div>
          <strong>{siteConfig.productName}</strong>
          <span>{text.chrome.footerLabel}</span>
        </div>
        <p>{text.chrome.footerText}</p>
      </footer>
    </div>
  );
}
