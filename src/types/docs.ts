export type DocTemplate = 'landing' | 'overview' | 'guide' | 'api';
export type DocStatus = 'scaffold' | 'draft' | 'published' | 'deprecated';

export interface RouteRecord {
  id: number;
  path: string;
  relativePath: string;
  sourcePath: string;
  title: string;
  description: string;
  product: string;
  version?: string | null;
  platform?: string | null;
  contextKey: string;
  contextTitle: string;
  template: DocTemplate;
  status: DocStatus;
  sourceIndex: number;
  contentFile: string;
  navOrder: number;
  edition?: 'open-source' | 'enterprise';
  locales?: Array<'en' | 'zh'>;
}

export interface NavNode {
  id: string;
  segment: string;
  title: string;
  href?: string | null;
  type: 'folder' | 'page';
  children: NavNode[];
  minIndex: number;
  navigationTitle?: string;
  edition?: 'open-source' | 'enterprise';
  locales?: Array<'en' | 'zh'>;
}

export interface NavContext {
  key: string;
  title: string;
  rootPath: string;
  overviewPath: string;
  product: string;
  version?: string | null;
  platform?: string | null;
  nodes: NavNode[];
  pageCount: number;
  sidebarExpansion?: 'top-level' | 'active-path';
}

export interface NavigationData {
  generatedAt: string;
  contexts: NavContext[];
}

export interface TocItem {
  title: string;
  url: string;
  depth: number;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export interface SearchRecord {
  path: string;
  title: string;
  description: string;
  context: string;
  keywords: string;
  content?: string;
  locales?: Array<'en' | 'zh'>;
}
