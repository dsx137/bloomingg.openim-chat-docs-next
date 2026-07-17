import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSearchIndexes } from '../build-search-index.mjs';

function route(path, contextKey = 'chat/sdk/android') {
  return {
    path,
    title: path.split('/').at(-1),
    description: `Description for ${path}`,
    contextTitle: contextKey,
    contextKey,
    product: 'sdk',
    platform: contextKey.split('/').at(-1),
    version: 'v4',
    relativePath: path.slice('/docs/'.length),
  };
}

function auditPage(path, zh, en) {
  return {
    currentPath: path,
    locales: {
      zh: { reviewStatus: zh },
      en: { reviewStatus: en },
    },
  };
}

test('omits unpublished WASM pages and indexes published manual Chinese content', () => {
  const nonWasm = route('/sdk/android/overview');
  const pending = route(
    '/sdk/wasm/pending',
    'chat/sdk/wasm',
  );
  const published = route(
    '/sdk/wasm/published',
    'chat/sdk/wasm',
  );

  const result = buildSearchIndexes({
    routes: [nonWasm, pending, published],
    sourcePages: new Map([
      [nonWasm.path, { body: 'Android source body' }],
      [pending.path, { body: 'Pending source body' }],
      [published.path, { body: 'Published source body' }],
    ]),
    manualZhPages: new Map([
      [pending.path, { body: '待审核正文', description: '待审核', title: '待审核' }],
      [published.path, { body: '已发布中文正文', description: '中文描述', title: '中文标题' }],
    ]),
    auditPages: new Map([
      [pending.path, auditPage(pending.path, 'written', 'deferred')],
      [published.path, auditPage(published.path, 'published', 'published')],
    ]),
  });

  assert.deepEqual(result.en.map((record) => record.path), [nonWasm.path, published.path]);
  assert.deepEqual(result.zh.map((record) => record.path), [nonWasm.path, published.path]);
  assert.equal(result.zh.at(-1).title, '中文标题');
  assert.equal(result.zh.at(-1).description, '中文描述');
  assert.match(result.zh.at(-1).content, /已发布中文正文/);
  assert.ok(!result.zh.some((record) => record.path === pending.path));
});

test('fails when a route source page is missing', () => {
  const nonWasm = route('/sdk/android/overview');

  assert.throws(
    () =>
      buildSearchIndexes({
        routes: [nonWasm],
        sourcePages: new Map(),
        manualZhPages: new Map(),
        auditPages: new Map(),
      }),
    /missing source page/,
  );
});

test('fails when published Chinese WASM content has no manual MDX', () => {
  const published = route(
    '/sdk/wasm/published-without-manual',
    'chat/sdk/wasm',
  );

  assert.throws(
    () =>
      buildSearchIndexes({
        routes: [published],
        sourcePages: new Map([[published.path, { body: 'English source' }]]),
        manualZhPages: new Map(),
        auditPages: new Map([
          [published.path, auditPage(published.path, 'published', 'deferred')],
        ]),
      }),
    /published zh search page requires manual MDX/,
  );
});

test('fails closed when an active WASM route has no audit record', () => {
  const wasm = route('/sdk/wasm/missing-audit', 'chat/sdk/wasm');

  assert.throws(
    () =>
      buildSearchIndexes({
        routes: [wasm],
        sourcePages: new Map([[wasm.path, { body: 'Source' }]]),
        manualZhPages: new Map(),
        auditPages: new Map(),
      }),
    /missing audit record/,
  );
});
