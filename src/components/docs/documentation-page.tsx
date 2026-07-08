import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleHeader } from '@/src/components/docs/article-header';
import { DocsShell } from '@/src/components/docs/docs-shell';
import { Feedback } from '@/src/components/docs/feedback';
import { MarkdownContent } from '@/src/components/docs/markdown-content';
import { Pagination } from '@/src/components/docs/pagination';
import { PlatformApiOverviewPage } from '@/src/components/docs/platform-api-overview-page';
import { SdkOverviewPage } from '@/src/components/docs/sdk-overview-page';
import { TocGithubLink } from '@/src/components/docs/toc-github-link';
import { getMDXComponents } from '@/src/components/mdx-components';
import type { ContextOption } from '@/src/components/docs/context-picker';
import { getNavigationContext, getNavigationContexts } from '@/src/lib/navigation';
import {
  getBreadcrumbs,
  getEditUrl,
  getNeighbors,
  getRouteRecord,
  pathFromSlug,
} from '@/src/lib/routes';
import { source } from '@/src/lib/source';
import { shouldShowVersion } from '@/src/lib/version-visibility';
import { siteConfig } from '@/src/config/site';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import {
  localizeDocLabel,
  getLocalizedDocPage,
  getLocalizedDocTitle,
  localizeRouteRecord,
} from '@/src/lib/localized-docs';
import { getOpenIMServerVersionLink } from '@/src/lib/openim-server-version';
import { getSourceDocPage } from '@/src/lib/source-docs';
import type { BreadcrumbItem, TocItem } from '@/src/types/docs';

export type DocumentationPageParams = {
  slug?: string[];
};

export async function generateDocumentationMetadata(
  { slug }: DocumentationPageParams,
  locale: Locale = 'en',
): Promise<Metadata> {
  const pageSlugs = slug?.length ? slug : ['chat'];
  const path = pathFromSlug(slug);
  const route = getRouteRecord(path);
  const page = source.getPage(pageSlugs);

  if (!route) return {};
  const localized = getLocalizedDocPage(route.path, locale);
  const routeFilePage =
    !page && route.contentFile.startsWith('content/zh/')
      ? getSourceDocPage(route.contentFile)
      : undefined;
  if (!page && !localized && !routeFilePage) return {};

  const title = localizeDocLabel(
    localized?.title ?? routeFilePage?.title ?? page?.data.title ?? route.title,
    locale,
  );
  const description =
    localized?.description ??
    routeFilePage?.description ??
    page?.data.description ??
    route.description;
  const url = toLocalizedPath(route.path, locale);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: route.path,
        zh: toLocalizedPath(route.path, 'zh'),
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: 'article',
    },
  };
}

export async function renderDocumentationPage(
  { slug }: DocumentationPageParams,
  locale: Locale = 'en',
) {
  const pageSlugs = slug?.length ? slug : ['chat'];
  const path = pathFromSlug(slug);
  const route = getRouteRecord(path);
  const page = source.getPage(pageSlugs);

  if (!route) notFound();

  const localizedPage = getLocalizedDocPage(route.path, locale);
  const routeFilePage =
    !page && route.contentFile.startsWith('content/zh/')
      ? getSourceDocPage(route.contentFile)
      : undefined;
  if (!page && !localizedPage && !routeFilePage) notFound();

  const effectiveRoute = {
    ...route,
    title: localizeDocLabel(
      localizedPage?.title ?? routeFilePage?.title ?? page?.data.title ?? route.title,
      locale,
    ),
    description:
      localizedPage?.description ??
      routeFilePage?.description ??
      page?.data.description ??
      route.description,
    product: page?.data.product ?? route.product,
    template: page?.data.template ?? route.template,
    status: page?.data.status ?? route.status,
    version: page?.data.version ?? route.version,
    platform: page?.data.platform ?? route.platform,
  };

  const loaded = page ? await page.data.load() : undefined;
  const MdxContent = loaded?.body;
  const sourceMarkdownPage =
    !localizedPage && effectiveRoute.product === 'platform-api'
      ? getSourceDocPage(effectiveRoute.contentFile)
      : undefined;
  const markdownPage = localizedPage ?? routeFilePage ?? sourceMarkdownPage;
  const toc = markdownPage?.headings ?? ((loaded?.toc ?? []) as TocItem[]);

  if (effectiveRoute.template === 'landing') {
    if (!MdxContent) notFound();
    const LandingContent = MdxContent;
    return (
      <div className="chat-landing">
        <LandingContent components={getMDXComponents(locale)} />
      </div>
    );
  }

  const context = getNavigationContext(effectiveRoute.path);
  if (!context) notFound();

  const contextOptions: ContextOption[] = getNavigationContexts().map((item) => ({
    key: item.key,
    product: item.product,
    platform: item.platform,
    version: item.version,
    href: toLocalizedPath(item.overviewPath, locale),
    pageCount: item.pageCount,
  }));
  const rawNeighbors = getNeighbors(effectiveRoute);
  const neighbors = {
    previous: rawNeighbors.previous
      ? localizeRouteRecord(rawNeighbors.previous, locale)
      : undefined,
    next: rawNeighbors.next ? localizeRouteRecord(rawNeighbors.next, locale) : undefined,
  };
  const routeVersions = contextOptions
    .filter(
      (item) =>
        item.product === effectiveRoute.product &&
        (effectiveRoute.platform ? item.platform === effectiveRoute.platform : !item.platform),
    )
    .map((item) => item.version);
  const showVersion = shouldShowVersion(effectiveRoute.version, routeVersions);
  const breadcrumbs = localizeBreadcrumbs(getBreadcrumbs(effectiveRoute, { showVersion }), locale);
  const platformApiServerVersion =
    effectiveRoute.path === '/docs/chat/platform-api/v3/overview'
      ? await getOpenIMServerVersionLink()
      : undefined;
  const tocFooter = platformApiServerVersion ? (
    <TocGithubLink version={platformApiServerVersion} />
  ) : undefined;

  if (effectiveRoute.path === '/docs/chat/sdk/v4/wasm/overview') {
    return (
      <DocsShell
        context={context}
        contextOptions={contextOptions}
        currentPath={effectiveRoute.path}
        locale={locale}
        overview
        showVersion={showVersion}
        toc={getSdkOverviewToc(locale)}
      >
        <SdkOverviewPage
          breadcrumbs={breadcrumbs}
          locale={locale}
          route={effectiveRoute}
          showVersion={showVersion}
        />
      </DocsShell>
    );
  }

  if (effectiveRoute.path === '/docs/chat/platform-api/v3/overview') {
    return (
      <DocsShell
        context={context}
        contextOptions={contextOptions}
        currentPath={effectiveRoute.path}
        locale={locale}
        overview
        showVersion={showVersion}
        tocFooter={tocFooter}
        toc={getPlatformApiOverviewToc(locale)}
      >
        <PlatformApiOverviewPage breadcrumbs={breadcrumbs} locale={locale} route={effectiveRoute} />
      </DocsShell>
    );
  }

  return (
    <DocsShell
      context={context}
      contextOptions={contextOptions}
      currentPath={effectiveRoute.path}
      locale={locale}
      showVersion={showVersion}
      toc={toc}
    >
      <ArticleHeader
        breadcrumbs={breadcrumbs}
        editUrl={getEditUrl(effectiveRoute)}
        locale={locale}
        route={effectiveRoute}
        showVersion={showVersion}
      />
      <div className="prose-docs">
        {markdownPage ? (
          <MarkdownContent body={markdownPage.body} locale={locale} />
        ) : MdxContent ? (
          <MdxContent components={getMDXComponents(locale)} />
        ) : null}
      </div>
      <Feedback locale={locale} path={toLocalizedPath(effectiveRoute.path, locale)} />
      <Pagination locale={locale} next={neighbors.next} previous={neighbors.previous} />
    </DocsShell>
  );
}

function localizeBreadcrumbs(items: BreadcrumbItem[], locale: Locale): BreadcrumbItem[] {
  return items.map((item, index) => ({
    ...item,
    title:
      locale === 'zh' && index === 0
        ? '首页'
        : (getLocalizedDocTitle(item.href, locale) ?? localizeDocLabel(item.title, locale)),
    href: item.href ? toLocalizedPath(item.href, locale) : undefined,
  }));
}

function getSdkOverviewToc(locale: Locale): TocItem[] {
  return [
    {
      depth: 2,
      title: locale === 'zh' ? '热门主题' : 'Most popular',
      url: '#sdk-overview-popular',
    },
    {
      depth: 2,
      title: locale === 'zh' ? '推荐功能' : 'Recommended features',
      url: '#sdk-overview-recommended',
    },
    {
      depth: 2,
      title: locale === 'zh' ? '资源' : 'Resources',
      url: '#sdk-overview-resources',
    },
  ];
}

function getPlatformApiOverviewToc(locale: Locale): TocItem[] {
  return [
    {
      depth: 2,
      title: locale === 'zh' ? '最常用' : 'Most popular',
      url: '#platform-api-overview-popular',
    },
    {
      depth: 2,
      title: locale === 'zh' ? '推荐功能' : 'Recommended features',
      url: '#platform-api-overview-recommended',
    },
    {
      depth: 2,
      title: locale === 'zh' ? '资源' : 'Resources',
      url: '#platform-api-overview-resources',
    },
  ];
}
