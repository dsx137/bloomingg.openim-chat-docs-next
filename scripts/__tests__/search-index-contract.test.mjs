import assert from 'node:assert/strict';
import test from 'node:test';

import { validateSearchIndexPaths } from '../lib/search-index-contract.mjs';

function page(path, en, zh) {
  return {
    currentPath: path,
    locales: {
      en: { reviewStatus: en },
      zh: { reviewStatus: zh },
    },
  };
}

test('expects all non-WASM routes and only locale-published WASM routes', () => {
  const nonWasm = { path: '/sdk/android/overview', contextKey: 'chat/sdk/android' };
  const pending = { path: '/sdk/wasm/pending', contextKey: 'chat/sdk/wasm' };
  const enOnly = { path: '/sdk/wasm/en', contextKey: 'chat/sdk/wasm' };
  const zhOnly = { path: '/sdk/wasm/zh', contextKey: 'chat/sdk/wasm' };
  const auditPages = new Map([
    [pending.path, page(pending.path, 'deferred', 'written')],
    [enOnly.path, page(enOnly.path, 'published', 'deferred')],
    [zhOnly.path, page(zhOnly.path, 'deferred', 'published')],
  ]);

  assert.deepEqual(
    validateSearchIndexPaths({
      routes: [nonWasm, pending, enOnly, zhOnly],
      auditPages,
      indexes: {
        en: [{ path: nonWasm.path }, { path: enOnly.path }],
        zh: [{ path: nonWasm.path }, { path: zhOnly.path }],
      },
    }),
    [],
  );
});

test('reports missing, unexpected, and duplicate locale records', () => {
  const route = { path: '', contextKey: 'chat' };
  const errors = validateSearchIndexPaths({
    routes: [route],
    auditPages: new Map(),
    indexes: {
      en: [],
      zh: [{ path: route.path }, { path: route.path }, { path: '/docs/unexpected' }],
    },
  });

  assert.ok(errors.some((error) => error.includes('en search index is missing')));
  assert.ok(errors.some((error) => error.includes('zh search index has duplicate')));
  assert.ok(errors.some((error) => error.includes('zh search index has unexpected')));
});
