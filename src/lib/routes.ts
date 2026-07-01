import 'server-only';

import rawRoutes from '@/src/generated/routes.json';
import { humanizeSlug } from '@/src/config/docs';
import type { BreadcrumbItem, RouteRecord } from '@/src/types/docs';

const routes = rawRoutes as RouteRecord[];
const routeMap = new Map(routes.map((route) => [normalizePath(route.path), route]));
const routesByContext = new Map<string, RouteRecord[]>();

for (const route of routes) {
  const group = routesByContext.get(route.contextKey) ?? [];
  group.push(route);
  routesByContext.set(route.contextKey, group);
}

for (const group of routesByContext.values()) {
  group.sort((a, b) => a.navOrder - b.navOrder || a.sourceIndex - b.sourceIndex);
}

export function normalizePath(path: string): string {
  if (!path) return '/docs/chat';
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

export function pathFromSlug(slug?: string[]): string {
  return normalizePath(`/docs/${slug?.join('/') || 'chat'}`);
}

export function getRouteRecord(path: string): RouteRecord | undefined {
  return routeMap.get(normalizePath(path));
}

export function getAllRoutes(): readonly RouteRecord[] {
  return routes;
}

export function getRoutesForContext(contextKey: string): readonly RouteRecord[] {
  return routesByContext.get(contextKey) ?? [];
}

export function getNeighbors(route: RouteRecord): {
  previous?: RouteRecord;
  next?: RouteRecord;
} {
  const group = routesByContext.get(route.contextKey) ?? [];
  const index = group.findIndex((item) => item.path === route.path);
  return {
    previous: index > 0 ? group[index - 1] : undefined,
    next: index >= 0 && index < group.length - 1 ? group[index + 1] : undefined,
  };
}

export function getBreadcrumbs(
  route: RouteRecord,
  { showVersion = true }: { showVersion?: boolean } = {},
): BreadcrumbItem[] {
  const parts = route.relativePath.split('/');
  const crumbs: BreadcrumbItem[] = [{ title: 'Home', href: '/docs/chat' }];

  if (parts[0] === 'chat') {
    crumbs.push({ title: 'Chat', href: '/docs/chat' });
  }

  let current = '/docs/chat';
  for (let index = 1; index < parts.length; index += 1) {
    current += `/${parts[index]}`;
    if (!showVersion && route.version && parts[index] === route.version) continue;
    const record = routeMap.get(current);
    const isLast = index === parts.length - 1;
    crumbs.push({
      title: isLast ? route.title : (record?.title ?? humanizeSlug(parts[index])),
      href: isLast ? undefined : record?.path,
    });
  }

  return dedupeBreadcrumbs(crumbs);
}

function dedupeBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  const result: BreadcrumbItem[] = [];
  for (const item of items) {
    const previous = result.at(-1);
    if (previous?.title === item.title && previous.href === item.href) continue;
    result.push(item);
  }
  return result;
}

export function getEditUrl(route: RouteRecord): string | undefined {
  const base = process.env.NEXT_PUBLIC_EDIT_BASE_URL?.replace(/\/$/, '');
  if (!base) return undefined;
  return `${base}/${route.contentFile}`;
}
