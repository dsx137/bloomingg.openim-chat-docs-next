import 'server-only';

import rawNavigation from '@/src/generated/navigation.json';
import type { NavContext, NavigationData, NavNode } from '@/src/types/docs';

const navigation = rawNavigation as NavigationData;
const contexts = [...navigation.contexts].sort((a, b) => b.rootPath.length - a.rootPath.length);

export function getNavigationContext(path: string): NavContext | undefined {
  const normalized = path.replace(/\/$/, '');
  return contexts.find(
    (context) => normalized === context.rootPath || normalized.startsWith(`${context.rootPath}/`),
  );
}

export function getNavigationContexts(): readonly NavContext[] {
  return navigation.contexts;
}

export function nodeContainsPath(node: NavNode, path: string): boolean {
  if (node.href?.split(/[?#]/, 1)[0] === path) return true;
  return node.children.some((child) => nodeContainsPath(child, path));
}
