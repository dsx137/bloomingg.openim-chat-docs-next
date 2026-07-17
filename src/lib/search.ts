import 'server-only';

import rawIndex from '@/src/generated/search-index.json';
import rawZhIndex from '@/src/generated/search-index-zh.json';
import type { Locale } from '@/src/lib/i18n';
import { searchLocalizedRecords } from '@/src/lib/search-core';
import type { SearchRecord } from '@/src/types/docs';

const indexes = {
  en: rawIndex as SearchRecord[],
  zh: rawZhIndex as SearchRecord[],
};

export interface SearchResult extends SearchRecord {
  score: number;
}

export function searchDocs(query: string, limit = 20, locale: Locale = 'en'): SearchResult[] {
  return searchLocalizedRecords(indexes, query, limit, locale);
}
