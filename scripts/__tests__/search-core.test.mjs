import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSearchRequestUrl, searchLocalizedRecords } from '../../src/lib/search-core.ts';

function record(path, title) {
  return {
    path,
    title,
    description: title,
    context: 'SDK',
    keywords: title,
    content: title,
  };
}

test('searches only the selected locale index', () => {
  const indexes = {
    en: [record('/docs/en-only', 'English marker')],
    zh: [record('/docs/zh-only', '中文标记')],
  };

  assert.deepEqual(
    searchLocalizedRecords(indexes, '标记', 20, 'zh').map((item) => item.path),
    ['/docs/zh-only'],
  );
  assert.deepEqual(
    searchLocalizedRecords(indexes, 'marker', 20, 'en').map((item) => item.path),
    ['/docs/en-only'],
  );
});

test('includes the selected locale in search requests', () => {
  assert.equal(
    buildSearchRequestUrl('OpenIM 中文', 12, 'zh'),
    '/api/search?q=OpenIM%20%E4%B8%AD%E6%96%87&limit=12&locale=zh',
  );
});
