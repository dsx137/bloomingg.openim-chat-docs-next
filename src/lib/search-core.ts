export type SearchRecordInput = {
  path: string;
  title: string;
  description: string;
  context: string;
  keywords: string;
  content?: string;
};

export type ScoredSearchRecord<T extends SearchRecordInput = SearchRecordInput> = T & {
  score: number;
};

export function buildSearchRequestUrl(
  query: string,
  limit = 12,
  locale: 'en' | 'zh' = 'en',
): string {
  return `/api/search?q=${encodeURIComponent(query)}&limit=${limit}&locale=${locale}`;
}

export function searchLocalizedRecords<T extends SearchRecordInput>(
  indexes: Record<'en' | 'zh', T[]>,
  query: string,
  limit = 20,
  locale: 'en' | 'zh' = 'en',
): ScoredSearchRecord<T>[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const tokens = tokenize(normalizedQuery);

  return indexes[locale]
    .map((record) => ({ ...record, score: scoreRecord(record, normalizedQuery, tokens) }))
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, Math.max(1, Math.min(limit, 50)));
}

function scoreRecord(record: SearchRecordInput, query: string, tokens: string[]): number {
  const title = normalize(record.title);
  const description = normalize(record.description);
  const path = normalize(record.path.replaceAll('/', ' '));
  const context = normalize(record.context);
  const keywords = normalize(record.keywords);
  const content = normalize(record.content ?? '');
  let score = 0;

  if (title === query) score += 180;
  if (title.startsWith(query)) score += 110;
  if (title.includes(query)) score += 80;
  if (path.includes(query)) score += 35;
  if (context.includes(query)) score += 30;
  if (description.includes(query)) score += 20;
  if (keywords.includes(query)) score += 20;
  if (content.includes(query)) score += 12;

  for (const token of tokens) {
    if (title.includes(token)) score += 25;
    if (path.includes(token)) score += 12;
    if (context.includes(token)) score += 10;
    if (description.includes(token)) score += 6;
    if (keywords.includes(token)) score += 6;
    if (content.includes(token)) score += 3;
  }

  return score;
}

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}.+#]+/gu, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const cjk = [...value].filter((character) => /[\p{Script=Han}]/u.test(character));
  return [...new Set([...words, ...cjk])];
}
