import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  isChatDocumentationPath,
  localizedContentFile,
} from '../lib/chat-content-paths.mjs';

const routes = JSON.parse(readFileSync('src/generated/routes.json', 'utf8'));
const structure = JSON.parse(readFileSync('data/structure/chat-pages.json', 'utf8'));
const navigation = JSON.parse(readFileSync('src/generated/navigation.json', 'utf8'));
const redirects = JSON.parse(readFileSync('data/structure/wasm-legacy-redirects.json', 'utf8'));

test('publishes Chat documentation at root-level product routes', () => {
  assert.ok(routes.some((route) => route.path === '/sdk/wasm/overview'));
  assert.ok(routes.some((route) => route.path === '/platform-api/overview'));
  assert.equal(routes.some((route) => route.path.startsWith('/docs/chat/')), false);
  assert.equal(structure.some((page) => page.openimPath.startsWith('/docs/chat/')), false);
});

test('keeps navigation and redirects out of the removed public prefix', () => {
  for (const context of navigation.contexts) {
    assert.equal(context.rootPath.startsWith('/docs/chat/'), false);
    assert.equal(context.overviewPath.startsWith('/docs/chat/'), false);
  }
  for (const redirect of redirects) {
    assert.equal(redirect.source.startsWith('/docs/chat/'), false);
    assert.equal(redirect.destination.startsWith('/docs/chat/'), false);
  }
});

test('provides root-level route handlers for both products and locales', () => {
  for (const file of [
    'app/sdk/[[...slug]]/page.tsx',
    'app/platform-api/[[...slug]]/page.tsx',
    'app/[locale]/sdk/[[...slug]]/page.tsx',
    'app/[locale]/platform-api/[[...slug]]/page.tsx',
  ]) {
    assert.equal(existsSync(file), true, file);
  }
});

test('maps public Chat routes to their retained physical content directories', () => {
  assert.equal(
    localizedContentFile('content/docs/chat/sdk/wasm/overview.mdx'),
    'content/zh/docs/chat/sdk/wasm/overview.mdx',
  );
  assert.equal(isChatDocumentationPath('/sdk/wasm/overview'), true);
  assert.equal(isChatDocumentationPath('/platform-api/overview'), true);
  assert.equal(isChatDocumentationPath('/docs/guides'), false);
  assert.equal(isChatDocumentationPath('/docs/chat/sdk/wasm/overview'), false);
});
