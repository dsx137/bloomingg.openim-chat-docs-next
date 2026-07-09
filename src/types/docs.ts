import { z } from 'zod';

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
}

export interface NavNode {
  id: string;
  segment: string;
  title: string;
  href?: string | null;
  type: 'folder' | 'page';
  children: NavNode[];
  minIndex: number;
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
}

export interface NavigationData {
  generatedAt: string;
  contexts: NavContext[];
}

export const docsetRecordSchema = z.strictObject({
  key: z.string(),
  repoUrl: z.string(),
  packageName: z.string().optional(),
  sourceRef: z.string().nullable(),
  targetTagPattern: z.string(),
});

export const docsetsDataSchema = z.strictObject({
  docsets: z.array(docsetRecordSchema),
});

export type DocsetRecord = z.infer<typeof docsetRecordSchema>;
export type DocsetsData = z.infer<typeof docsetsDataSchema>;

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
}
