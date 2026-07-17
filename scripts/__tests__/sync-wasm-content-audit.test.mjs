import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStructureOnlyRecord,
  mergeActiveRoutes,
  sendbirdUrlFor,
} from '../sync-wasm-content-audit.mjs';

const route = {
  path: '/sdk/wasm/message/sending-a-message/send-a-message',
};

test('creates an undecided Chinese-first record for a Sendbird structure route', () => {
  const record = createStructureOnlyRecord(route);

  assert.equal(record.currentPath, route.path);
  assert.equal(record.disposition, 'undecided');
  assert.equal(record.locales.zh.reviewStatus, 'structure-only');
  assert.equal(record.locales.en.reviewStatus, 'deferred');
  assert.equal(
    record.sendbirdSource,
    'https://sendbird.com/docs/chat/sdk/v4/javascript/message/sending-a-message/send-a-message',
  );
});

test('adds missing routes without overwriting existing editorial decisions', () => {
  const existing = {
    ...createStructureOnlyRecord(route),
    disposition: 'adapt',
    notes: ['reviewed decision'],
  };
  const secondRoute = { path: '/sdk/wasm/overview' };

  const pages = mergeActiveRoutes([route, secondRoute], [existing]);

  assert.equal(pages.length, 2);
  assert.deepEqual(pages.find((page) => page.currentPath === route.path), existing);
  assert.equal(
    pages.find((page) => page.currentPath === secondRoute.path).disposition,
    'undecided',
  );
});

test('retains historical and proposed records that are not active routes', () => {
  const historical = {
    ...createStructureOnlyRecord({ path: '/sdk/wasm/removed' }),
    disposition: 'remove',
  };

  const pages = mergeActiveRoutes([route], [historical]);

  assert.ok(pages.some((page) => page.currentPath === historical.currentPath));
});

test('adds newly required empty evidence arrays without changing editorial decisions', () => {
  const legacy = {
    ...createStructureOnlyRecord(route),
    disposition: 'adapt',
    notes: ['preserve me'],
  };
  delete legacy.sdkEvents;

  const [page] = mergeActiveRoutes([route], [legacy]);

  assert.deepEqual(page.sdkEvents, []);
  assert.equal(page.disposition, 'adapt');
  assert.deepEqual(page.notes, ['preserve me']);
});

test('converts only the platform segment when deriving a Sendbird URL', () => {
  assert.equal(
    sendbirdUrlFor('/sdk/wasm/overview'),
    'https://sendbird.com/docs/chat/sdk/v4/javascript/overview',
  );
});
