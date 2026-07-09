import 'server-only';

import rawDocsets from '@/data/structure/docsets.json';
import { docsetsDataSchema, type DocsetRecord, type RouteRecord } from '@/src/types/docs';

const data = docsetsDataSchema.parse(rawDocsets);
const docsets = [...data.docsets].sort(
  (a, b) => getDocsetRootPath(b).length - getDocsetRootPath(a).length,
);
const docsetByKey = new Map(docsets.map((docset) => [docset.key, docset]));

export function getDocsets(): readonly DocsetRecord[] {
  return docsets;
}

export function getDocset(key: string): DocsetRecord | undefined {
  return docsetByKey.get(key);
}

export function getDocsetForPath(path: string): DocsetRecord | undefined {
  const normalizedPath = normalizeDocsetPath(path);
  return docsets.find((docset) => {
    const rootPath = getDocsetRootPath(docset);
    return normalizedPath === rootPath || normalizedPath.startsWith(`${rootPath}/`);
  });
}

export function getDocsetForRoute(
  route: Pick<RouteRecord, 'contextKey' | 'path'>,
): DocsetRecord | undefined {
  return getDocset(route.contextKey) ?? getDocsetForPath(route.path);
}

function normalizeDocsetPath(path: string): string {
  if (!path) return '/docs/chat';
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

function getDocsetRootPath(docset: Pick<DocsetRecord, 'key'>): string {
  return normalizeDocsetPath(`/docs/${docset.key}`);
}
