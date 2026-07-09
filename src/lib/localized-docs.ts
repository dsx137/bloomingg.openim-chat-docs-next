import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import localizedSdkData from '@/src/generated/wasm-sdk-zh-content.json';
import localizedPlatformApiData from '@/src/generated/platform-api-zh-content.json';
import { extractMarkdownHeadings } from '@/src/lib/heading-ids';
import type { Locale } from '@/src/lib/i18n';
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
  Blacklist: '黑名单',
  'Conversation state': '会话状态',
  'Conversations and messages': '会话与消息',
  'Creating messages': '创建消息',
  'Delete message': '删除消息',
  'Deleting messages': '删除消息',
  'Event handlers': '监听器',
  Friend: '好友',
  Friends: '好友',
  Group: '群组',
  'Group applications': '入群申请',
  'Group members': '群成员',
  'Group membership': '用户入群关系',
  'Group moderation': '群组禁言',
  Home: '首页',
  'Initialization and login': '初始化与登录',
  'Listing conversations': '查询会话',
  'Local messages': '本地消息',
  'Managing conversations': '管理会话',
  'Managing groups': '管理群组',
  'Managing messages': '管理消息',
  Methods: '方法',
  Models: '类型说明',
  'OpenIM Platform API': 'OpenIM 平台 API',
  Overview: '概述',
  'Platform API': '平台 API',
  'Push, logs, and files': '推送、日志与文件',
  'Read status': '已读状态',
  'Retrieving messages': '查询消息',
  'Send message': '发送消息',
  'Sending messages': '发送消息',
  'Server API': '服务端 API',
  'Unsupported or unexposed capabilities': '未支持或未暴露能力',
  User: '用户',
};

export function getLocalizedDocPage(
  path: string | undefined,
  locale: Locale,
): LocalizedDocPage | undefined {
  if (locale !== 'zh' || !path) return undefined;
  const normalized = normalizePath(path);
  return getManualLocalizedPage(normalized, locale) ?? sdkZh.pages[normalized];
}

export function getLocalizedDocTitle(path: string | undefined, locale: Locale): string | undefined {
  const title = getLocalizedDocPage(path, locale)?.title;
  return title ? localizeDocLabel(title, locale) : undefined;
}

export function localizeRouteRecord(route: RouteRecord, locale: Locale): RouteRecord {
  const localized = getLocalizedDocPage(route.path, locale);
  if (!localized) return route;
  return {
    ...route,
    description: localized.description,
    title: localizeDocLabel(localized.title, locale),
  };
}

export function localizeNavNodeTitle(node: NavNode, locale: Locale): string {
  const isOverviewNode = /^overview(?:-|$)/.test(node.segment);
  const isNestedOverview = node.segment === 'overview' && node.id.includes('/');
  const isAndroidSdkOverview =
    node.href?.startsWith('/docs/chat/sdk/v4/android/') && isOverviewNode;
  const isPlatformApiRootOverview = node.href === '/docs/chat/platform-api/v3/overview';
  const isPlatformApiNode = node.href?.startsWith('/docs/chat/platform-api/v3/');
  if (node.title === '概述') return '概述';
  if (isAndroidSdkOverview) return '概述';
  if (locale !== 'zh') return isOverviewNode ? 'Overview' : node.title;
  if (isPlatformApiRootOverview) return '概述';
  if (isNestedOverview && isPlatformApiNode) return node.title;
  if (isOverviewNode) return '概述';
  if (node.href)
    return getLocalizedDocTitle(node.href, locale) ?? localizeDocLabel(node.title, locale);
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

  const filePath = resolve(process.cwd(), 'content', locale, `${path.slice(1)}.mdx`);
  if (!existsSync(filePath)) {
    localizedPageCache.set(cacheKey, undefined);
    return undefined;
  }

  const source = readFileSync(filePath, 'utf8');
  const { body, frontmatter } = parseMdx(source);
  const normalizedBody = normalizeOpenImZhTerminology(body);
  const fallback = sdkZh.pages[path];
  const page = {
    body: normalizedBody,
    description: normalizeOpenImZhTerminology(
      frontmatter.description ?? fallback?.description ?? '',
    ),
    headings: extractMarkdownHeadings(normalizedBody),
    sourcePath: frontmatter.sourcePath ?? path,
    title: normalizeOpenImZhTerminology(frontmatter.title ?? fallback?.title ?? ''),
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
