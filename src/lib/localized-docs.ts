import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import localizedSdkData from '@/src/generated/wasm-sdk-zh-content.json';
import localizedPlatformApiData from '@/src/generated/platform-api-zh-content.json';
import { extractMarkdownHeadings } from '@/src/lib/heading-ids';
import type { Locale } from '@/src/lib/i18n';
import { getRouteRecord } from '@/src/lib/routes';
import { createWasmPendingReviewContent } from '@/src/lib/wasm-publication';
import type { NavNode, RouteRecord, TocItem } from '@/src/types/docs';

type LocalizedDocPage = {
  body: string;
  description: string;
  headings: TocItem[];
  sourcePath: string;
  title: string;
};

type LocalizedSdkData = {
  navigationLabels: Record<string, string>;
  pages: Record<string, LocalizedDocPage>;
};

const sdkZh = localizedSdkData as LocalizedSdkData;
const platformApiZh = localizedPlatformApiData as { navigationLabels: Record<string, string> };
const localizedPageCache = new Map<string, LocalizedDocPage | undefined>();

const zhLabelOverrides: Record<string, string> = {
  Chat: '聊天',
  Home: '首页',
  'OpenIM Platform API': 'OpenIM 平台 API',
  'Platform API': '平台 API',
  'Server API': '服务端 API',
};

export function getLocalizedDocPage(
  path: string | undefined,
  locale: Locale,
): LocalizedDocPage | undefined {
  if (locale !== 'zh' || !path) return undefined;
  const normalized = normalizePath(path);
  const localized = getManualLocalizedPage(normalized, locale) ?? sdkZh.pages[normalized];
  if (localized) return localized;

  const route = getRouteRecord(normalized);
  if (route?.contextKey !== 'chat/sdk/wasm') return undefined;
  const pending = createWasmPendingReviewContent({
    description: '该 OpenIM WASM SDK 页面的中文技术内容仍在逐页核对中。',
    path: normalized,
    title: localizeDocLabel(route.title, locale),
  });
  return pending
    ? {
        ...pending,
        headings: extractMarkdownHeadings(pending.body),
      }
    : undefined;
}

export function getLocalizedDocTitle(path: string | undefined, locale: Locale): string | undefined {
  const title = getLocalizedDocPage(path, locale)?.title;
  return title || undefined;
}

export function localizeRouteRecord(route: RouteRecord, locale: Locale): RouteRecord {
  const localized = getLocalizedDocPage(route.path, locale);
  if (!localized) return route;
  return {
    ...route,
    description: localized.description,
    title: localized.title,
  };
}

export function localizeNavNodeTitle(node: NavNode, locale: Locale): string {
  if (node.navigationTitle) return localizeDocLabel(node.navigationTitle, locale);
  if (locale !== 'zh') return node.title;
  if (node.href) return getLocalizedDocTitle(node.href, locale) ?? localizeDocLabel(node.title, locale);
  const label =
    platformApiZh.navigationLabels[node.segment] ??
    sdkZh.navigationLabels[node.segment] ??
    node.title;
  return localizeDocLabel(label, locale);
}

export function localizeDocLabel(label: string, locale: Locale): string {
  if (locale !== 'zh') return label;
  const exact = zhLabelOverrides[label];
  if (exact) return normalizeOpenImZhTerminology(exact);

  const fromPlatformSegment = localizeHumanizedNavigationLabel(
    label,
    platformApiZh.navigationLabels,
  );
  if (fromPlatformSegment) return normalizeOpenImZhTerminology(fromPlatformSegment);

  const fromSdkSegment = localizeHumanizedNavigationLabel(label, sdkZh.navigationLabels);
  return normalizeOpenImZhTerminology(fromSdkSegment ?? label);
}

export function localizeNavContextTitle(title: string, locale: Locale): string {
  return localizeDocLabel(title.replace(/\s*·\s*v\d+\b/i, ''), locale);
}

function normalizePath(path: string): string {
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

function localizeHumanizedNavigationLabel(
  label: string,
  labels: Record<string, string>,
): string | undefined {
  const normalized = label.toLowerCase();
  for (const [segment, translated] of Object.entries(labels)) {
    if (humanizeSegment(segment).toLowerCase() === normalized) return translated;
  }
  return undefined;
}

function humanizeSegment(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bIos\b/g, 'iOS')
    .replace(/\bSdk\b/g, 'SDK')
    .replace(/\bApi\b/g, 'API');
}

function getManualLocalizedPage(path: string, locale: Locale): LocalizedDocPage | undefined {
  const cacheKey = `${locale}:${path}`;
  if (localizedPageCache.has(cacheKey)) return localizedPageCache.get(cacheKey);

  const route = getRouteRecord(path);
  const localizedRelativePath = route?.contentFile.replace(/^content\/docs\//, 'docs/');
  const filePath = resolve(
    process.cwd(),
    'content',
    locale,
    localizedRelativePath ?? `${path.slice(1)}.mdx`,
  );
  if (!existsSync(filePath)) {
    localizedPageCache.set(cacheKey, undefined);
    return undefined;
  }

  const source = readFileSync(filePath, 'utf8');
  const { body, frontmatter } = parseMdx(source);
  const normalizedBody = body.replace(/\r\n?/g, '\n').trim();
  const fallback = sdkZh.pages[path];
  const page = {
    body: normalizedBody,
    description: frontmatter.description ?? fallback?.description ?? '',
    headings: extractMarkdownHeadings(normalizedBody),
    sourcePath: frontmatter.sourcePath ?? path,
    title: frontmatter.title ?? fallback?.title ?? '',
  };

  localizedPageCache.set(cacheKey, page);
  return page;
}

function normalizeOpenImZhTerminology(value: string): string {
  return value
    .replaceAll('开放频道', '群组')
    .replaceAll('开放房间', '群组')
    .replaceAll('频道 URL', '群组 ID')
    .replaceAll('通过 URL 获取频道', '通过 ID 获取群组或会话')
    .replaceAll('按名称、URL 或', '按名称、ID 或')
    .replaceAll('URL 或其他筛选条件', 'ID 或其他筛选条件')
    .replaceAll('URL 或自定义类型', 'ID 或自定义类型')
    .replaceAll('URL 或多种过滤条件', 'ID 或多种过滤条件');
}

function parseMdx(source: string): {
  body: string;
  frontmatter: Partial<Pick<LocalizedDocPage, 'description' | 'sourcePath' | 'title'>>;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: source.trim(), frontmatter: {} };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!key || !raw) continue;
    frontmatter[key] = raw.replace(/^['"]|['"]$/g, '');
  }

  return {
    body: source.slice(match[0].length).trim(),
    frontmatter,
  };
}
