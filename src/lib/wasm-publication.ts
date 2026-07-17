import auditData from '../../data/structure/wasm-content-audit.json' with { type: 'json' };
import routeData from '../generated/routes.json' with { type: 'json' };

export type ReviewLocale = 'en' | 'zh';

type ReviewStatus =
  | 'deferred'
  | 'structure-only'
  | 'mapped'
  | 'written'
  | 'api-verified'
  | 'example-verified'
  | 'published';

type WasmLocaleState = {
  reviewStatus: ReviewStatus;
};

export type WasmAuditPage = {
  currentPath: string;
  targetPath: string;
  disposition: string;
  locales: Record<ReviewLocale, WasmLocaleState>;
};

export function createWasmPublicationLookup(pages: WasmAuditPage[], activePaths: string[]) {
  const pageByPath = new Map(
    pages.map((page) => [normalizePath(page.currentPath), page] as const),
  );
  const activePathSet = new Set(activePaths.map(normalizePath));

  function getPage(path: string): WasmAuditPage | undefined {
    return pageByPath.get(normalizePath(path));
  }

  function isRoute(path: string): boolean {
    return activePathSet.has(normalizePath(path));
  }

  function isPublished(path: string, locale: ReviewLocale): boolean {
    return getPage(path)?.locales[locale]?.reviewStatus === 'published';
  }

  return {
    getWasmAuditPage: getPage,
    isWasmRoute: isRoute,
    isWasmLocalePublished: isPublished,
    getPublishedWasmLocales(path: string): ReviewLocale[] {
      return (['en', 'zh'] as const).filter((locale) => isPublished(path, locale));
    },
  };
}

const publicationLookup = createWasmPublicationLookup(
  auditData.pages as WasmAuditPage[],
  routeData
    .filter((route) => route.contextKey === 'chat/sdk/wasm')
    .map((route) => route.path),
);

export const wasmPendingReviewBody = [
  '## 中文内容审核中',
  '',
  '该页面已经纳入 OpenIM WASM SDK 文档结构，中文技术内容仍在逐页核对中。',
  '',
  '在审核完成前，请参考 OpenIM 官方 SDK 文档和当前项目使用的 SDK 版本。',
].join('\n');

export function createWasmPendingReviewContent({
  description,
  path,
  title,
}: {
  description: string;
  path: string;
  title: string;
}): { body: string; description: string; sourcePath: string; title: string } | undefined {
  const normalizedPath = normalizePath(path);
  if (!isWasmRoute(normalizedPath)) return undefined;
  return {
    body: wasmPendingReviewBody,
    description,
    sourcePath: normalizedPath,
    title,
  };
}

export function getWasmAuditPage(path: string): WasmAuditPage | undefined {
  return publicationLookup.getWasmAuditPage(path);
}

export function isWasmRoute(path: string): boolean {
  return publicationLookup.isWasmRoute(path);
}

export function isWasmLocalePublished(path: string, locale: ReviewLocale): boolean {
  return publicationLookup.isWasmLocalePublished(path, locale);
}

export function getPublishedWasmLocales(path: string): ReviewLocale[] {
  return publicationLookup.getPublishedWasmLocales(path);
}

function normalizePath(path: string): string {
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return normalized || '/';
}
