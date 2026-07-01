import { ExternalLinkIcon } from '@/src/components/ui/icons';
import { Breadcrumbs } from '@/src/components/docs/breadcrumbs';
import { CopyPageLink } from '@/src/components/docs/copy-page-link';
import { getPlatformLabel, getProductLabel } from '@/src/config/docs';
import { hasGuideMarkdownPage } from '@/src/lib/guide-markdown';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';
import type { BreadcrumbItem, RouteRecord } from '@/src/types/docs';

export function ArticleHeader({
  route,
  breadcrumbs,
  editUrl,
  locale = 'en',
  showVersion = true,
}: {
  route: RouteRecord;
  breadcrumbs: BreadcrumbItem[];
  editUrl?: string;
  locale?: Locale;
  showVersion?: boolean;
}) {
  const text = t(locale);
  const badges = [
    getProductLabel(route.product, locale),
    getPlatformLabel(route.platform),
    showVersion ? route.version : undefined,
    route.status === 'scaffold' ? text.article.scaffold : undefined,
  ].filter(Boolean);
  const showDescription = route.product !== 'platform-api' && route.description;
  const supportsMarkdown = route.contentFile !== 'guides' || hasGuideMarkdownPage(route.path);

  return (
    <header className="article-header">
      <Breadcrumbs items={breadcrumbs} />
      <div className="article-badges">
        {badges.map((badge) => (
          <span key={badge}>{badge}</span>
        ))}
      </div>
      <div className="article-title-row">
        <div>
          <h1>{route.title}</h1>
          {showDescription ? <p>{route.description}</p> : null}
        </div>
        <div className="article-actions">
          <CopyPageLink locale={locale} supportsMarkdown={supportsMarkdown} />
          {editUrl ? (
            <a href={editUrl} rel="noreferrer" target="_blank">
              {text.article.editPage}
              <ExternalLinkIcon />
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
