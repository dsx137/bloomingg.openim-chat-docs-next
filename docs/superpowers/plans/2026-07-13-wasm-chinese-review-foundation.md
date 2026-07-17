# WASM Chinese Review Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make manual Chinese MDX and a traceable per-page audit manifest the only path to publishing OpenIM WASM documentation.

**Architecture:** A checked-in audit manifest records structure decisions, immutable OpenIM sources, pinned SDK evidence, and locale-specific review states. A pinned local API snapshot validates method names offline. The Chinese builder becomes a packaging-only step that reads manual MDX, while shared publication helpers gate Metadata, search, and Sitemap without changing the current editable sidebar tree.

**Tech Stack:** Node.js 22 ESM scripts, Node built-in `node:test`, Next.js 16 App Router, TypeScript 5.9, JSON manifests, MDX.

---

## File map

### New source and data files

- `data/structure/wasm-content-audit.json`: checked-in page inventory, mapping decisions, sources, methods, and locale review states.
- `data/structure/wasm-sdk-api.json`: checked-in API/event/signature snapshot extracted from the pinned npm tarball.
- `data/structure/wasm-navigation-labels.json`: Chinese navigation labels moved out of the semantic content generator.
- `scripts/lib/wasm-content-audit.mjs`: pure audit schema and repository-contract validation.
- `scripts/check-wasm-content-audit.mjs`: repository-level audit command.
- `scripts/sync-wasm-content-audit.mjs`: additive structure synchronizer that never overwrites editorial decisions.
- `scripts/sync-wasm-sdk-api.mjs`: explicit network command for refreshing the pinned SDK declaration snapshot.
- `scripts/__tests__/wasm-content-audit.test.mjs`: audit schema and publication-gate tests.
- `scripts/__tests__/build-wasm-sdk-zh-content.test.mjs`: manual-only Chinese builder contract tests.
- `src/lib/wasm-publication.ts`: locale publication lookup used by rendering, Metadata, search, and Sitemap.
- `src/generated/search-index-zh.json`: generated Chinese search index containing published manual pages only.

### Modified files

- `scripts/build-wasm-sdk-zh-content.mjs`: replace automatic semantic generation with manual MDX packaging.
- `scripts/build-search-index.mjs`: build locale-aware indexes and gate WASM records by audit publication state.
- `scripts/check-localized-sdk-content.mjs`: validate manual/package output instead of generated prose templates.
- `src/lib/localized-docs.ts`: return a neutral pending-review page when an active Chinese route has no manual body.
- `src/lib/search.ts`: select English or Chinese index by locale.
- `app/api/search/route.ts`: accept a validated `locale` query parameter.
- `src/components/search/search-dialog.tsx`: send the current locale to the search endpoint.
- `src/components/docs/documentation-page.tsx`: apply locale-specific robots and alternate metadata.
- `app/sitemap.ts`: emit WASM locale URLs only when that locale is published.
- `package.json`: add audit tests/checks and explicit SDK/audit synchronization commands.

## Task 1: Audit schema and validation kernel

**Files:**

- Create: `scripts/lib/wasm-content-audit.mjs`
- Create: `scripts/__tests__/wasm-content-audit.test.mjs`

- [ ] **Step 1: Write failing unit tests for duplicate paths and enum validation**

Create fixtures in the test file with this minimal shape:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAuditManifest } from '../lib/wasm-content-audit.mjs';

const page = {
  currentPath: '/docs/chat/sdk/v4/wasm/overview',
  targetPath: '/docs/chat/sdk/v4/wasm/overview',
  sourceKind: 'sendbird',
  disposition: 'undecided',
  sendbirdSource: null,
  openimSources: [],
  sdkMethods: [],
  locales: {
    zh: {
      reviewStatus: 'structure-only',
      reviewer: null,
      reviewedAt: null,
      exampleVerification: { status: 'pending', evidence: [], reason: null },
    },
    en: {
      reviewStatus: 'deferred',
      reviewer: null,
      reviewedAt: null,
      exampleVerification: { status: 'pending', evidence: [], reason: null },
    },
  },
  redirectTo: null,
  notes: [],
};

test('rejects duplicate currentPath values', () => {
  const errors = validateAuditManifest({
    schemaVersion: 1,
    sources: validSources,
    pages: [page, page],
  });
  assert.ok(errors.some((error) => error.includes('duplicate currentPath')));
});
```

- [ ] **Step 2: Run the audit unit test and verify the import fails**

Run:

```bash
node --test scripts/__tests__/wasm-content-audit.test.mjs
```

Expected: FAIL because `scripts/lib/wasm-content-audit.mjs` does not exist.

- [ ] **Step 3: Implement manifest validation constants and pure functions**

Export these APIs:

```js
export const dispositions = ['undecided', 'retain', 'adapt', 'merge', 'remove', 'proposed'];
export const reviewStatuses = [
  'deferred',
  'structure-only',
  'mapped',
  'written',
  'api-verified',
  'example-verified',
  'published',
];

export function reviewRank(status) {
  return reviewStatuses.indexOf(status);
}

export function validateAuditManifest(manifest, context = {}) {
  // Return a deterministic string[]; do not throw for content errors.
}

export function isLocalePublished(page, locale) {
  return page?.locales?.[locale]?.reviewStatus === 'published';
}
```

Validation must reject invalid top-level sources, invalid enums, duplicate current paths, a self-redirect, `merge` without redirect, `remove + published`, and `undecided` at `mapped` or higher.

- [ ] **Step 4: Add status-prerequisite tests**

Cover these exact cases:

- `written` requires `manualPaths` to contain the page path.
- `mapped` requires at least one immutable OpenIM source URL.
- mapped Sendbird pages require `sendbirdSource`.
- `api-verified` methods must exist in `sdkMethodNames`.
- `published` requires reviewer, ISO date, and verified/not-applicable example evidence.
- `openim-specific + proposed` may be absent from active routes but requires a method or source.

- [ ] **Step 5: Run the unit tests**

Run:

```bash
node --test scripts/__tests__/wasm-content-audit.test.mjs
```

Expected: all audit unit tests pass.

## Task 2: Pinned WASM SDK declaration snapshot

**Files:**

- Create: `scripts/sync-wasm-sdk-api.mjs`
- Create: `data/structure/wasm-sdk-api.json`
- Modify: `package.json`

- [ ] **Step 1: Add a pure declaration extractor to the sync script**

The script must export and use:

```js
export function extractSdkApi(sdkDeclaration, eventDeclaration) {
  const deprecated = new Set(
    [
      ...sdkDeclaration.matchAll(/\/\*\*[\s\S]*?@deprecated[\s\S]*?\*\/\s*([A-Za-z_$][\w$]*):/g),
    ].map((match) => match[1]),
  );

  const methods = [...sdkDeclaration.matchAll(/^\s{4}([A-Za-z_$][\w$]*):\s*([\s\S]*?);$/gm)].map(
    (match) => ({
      name: match[1],
      signature: `${match[1]}: ${match[2]}`.replace(/\s+/g, ' ').trim(),
      deprecated: deprecated.has(match[1]),
    }),
  );

  const events = [
    ...eventDeclaration.matchAll(/^\s{2}([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/gm),
  ].map((match) => ({ name: match[1], value: match[2] }));

  return { methods, events };
}
```

- [ ] **Step 2: Implement explicit tarball download and integrity verification**

The command must:

1. Read package/version/integrity from the audit manifest.
2. Download only when invoked directly.
3. Verify the tarball with `ssri`-compatible SHA-512 logic using Node `crypto`.
4. Extract `package/lib/sdk/index.d.ts` and `package/lib/constant/index.d.ts` with `tar` in a temporary directory.
5. Write sorted deterministic JSON containing package, version, tarball, integrity, methods, and events.

Do not add the 38 MB SDK package as a dependency.

- [ ] **Step 3: Add the explicit package command**

Add:

```json
"wasm:api:sync": "node scripts/sync-wasm-sdk-api.mjs"
```

- [ ] **Step 4: Generate and inspect the snapshot**

Run:

```bash
pnpm wasm:api:sync
```

Expected: the JSON records `3.8.5-hotfix.0`, contains `sendMessage`, `transferGroupOwner`, `CbEvents`, and no duplicate method/event names.

## Task 3: Seed and validate the per-page audit manifest

**Files:**

- Create: `scripts/sync-wasm-content-audit.mjs`
- Create: `data/structure/wasm-content-audit.json`
- Create: `scripts/check-wasm-content-audit.mjs`
- Modify: `package.json`

- [ ] **Step 1: Implement an additive structure synchronizer**

The synchronizer must read routes, the existing audit file when present, and manual Chinese MDX paths. It may add missing active routes using this default record, but must preserve every existing editorial field byte-for-byte after JSON parsing:

```js
function createStructureOnlyRecord(route) {
  return {
    currentPath: route.path,
    targetPath: route.path,
    sourceKind: 'sendbird',
    disposition: 'undecided',
    sendbirdSource: sendbirdUrlFor(route.path),
    openimSources: [],
    sdkMethods: [],
    sdkEvents: [],
    locales: {
      zh: createLocaleState('structure-only'),
      en: createLocaleState('deferred'),
    },
    redirectTo: null,
    notes: [],
  };
}
```

The command must never delete audit records and must report non-route records as retained history/candidates.

- [ ] **Step 2: Initialize records for all active routes**

Run:

```bash
node scripts/sync-wasm-content-audit.mjs
```

Expected: exactly 127 active route records exist once each.

- [ ] **Step 3: Add explicit historical and OpenIM-specific records**

Add records for:

- removed `ban-and-unban-a-user`;
- removed `retrieve-a-list-of-banned-users`;
- proposed `transfer-group-owner` with method `transferGroupOwner` and the immutable official group API source;
- proposed group-member join-time filtering with `getGroupMemberListByJoinTimeFilter`;
- proposed owner/admin retrieval with `getGroupMemberOwnerAndAdmin`;
- proposed conversation message destruction with `setConversationIsMsgDestruct` and `setConversationMsgDestructTime`;
- proposed signaling capability group with the pinned signaling methods.

- [ ] **Step 4: Audit the 62 existing manual Chinese pages**

For each manual page:

1. Record the derived immutable Sendbird source.
2. Record one or more immutable OpenIM docs sources at commit `a177b296...`.
3. Extract the page's actual `OpenIM.<method>()` calls and reconcile them against the pinned API snapshot.
4. Extract the page's actual `CbEvents.<event>` references and reconcile them against the pinned event snapshot.
5. Set a human-reviewed `retain` or `adapt` disposition.
6. Set Chinese status to `written`, English to `deferred`.
7. Keep reviewer/date null until API and example verification occur.

Pages without a defensible official source remain `structure-only` even when a manual file exists.

- [ ] **Step 5: Implement repository-level checking**

`scripts/check-wasm-content-audit.mjs` must load:

- `src/generated/routes.json`;
- the audit manifest;
- the SDK API snapshot;
- all manual Chinese WASM MDX paths.

It must call `validateAuditManifest()` and fail with a bounded, sorted error report. Success output must include active routes, manual pages, pending pages, proposed pages, and locale status counts.

- [ ] **Step 6: Add audit commands**

Add:

```json
"wasm:audit:sync": "node scripts/sync-wasm-content-audit.mjs",
"wasm:audit:check": "node scripts/check-wasm-content-audit.mjs",
"test:audit": "node --test scripts/__tests__/*.test.mjs"
```

- [ ] **Step 7: Run the audit check**

Run:

```bash
pnpm wasm:audit:check
```

Expected: 127 active routes, 62 manual Chinese files, 65 pending active pages, two removed records, and OpenIM-specific proposed records are reported without validation errors.

## Task 4: Make the Chinese builder packaging-only

**Files:**

- Create: `data/structure/wasm-navigation-labels.json`
- Modify: `scripts/build-wasm-sdk-zh-content.mjs`
- Modify: `scripts/check-localized-sdk-content.mjs`
- Create: `scripts/__tests__/build-wasm-sdk-zh-content.test.mjs`

- [ ] **Step 1: Write a failing builder contract test**

Extract a pure builder API and test:

```js
test('only packages supplied manual pages', () => {
  const result = buildLocalizedSdkData({
    routes: [routeA, routeB],
    manualPages: new Map([[routeA.path, manualPageA]]),
    auditPages: new Map([
      [routeA.path, auditA],
      [routeB.path, auditB],
    ]),
    navigationLabels: {},
  });

  assert.deepEqual(Object.keys(result.pages), [routeA.path]);
  assert.deepEqual(result.pendingPaths, [routeB.path]);
  assert.equal(result.pages[routeB.path], undefined);
});
```

- [ ] **Step 2: Run the test and verify it fails against the current generator**

Run:

```bash
node --test scripts/__tests__/build-wasm-sdk-zh-content.test.mjs
```

Expected: FAIL because the current script has no pure builder and generates missing bodies.

- [ ] **Step 3: Move navigation labels to data**

Copy the current `navigationLabels` object into `data/structure/wasm-navigation-labels.json` with sorted keys. Keep terminology normalization in the parser only where it operates mechanically on manual text.

- [ ] **Step 4: Replace semantic generation with packaging**

The output shape must be:

```js
{
  sourceContext: 'chat/sdk/v4/wasm',
  sourceRoot: 'content/zh/docs/chat/sdk/v4/wasm',
  pageCount: routes.length,
  manualPageCount: Object.keys(pages).length,
  pendingPaths,
  reviewStates,
  navigationLabels,
  pages,
}
```

Delete automatic translation/template functions after the new tests pass. Manual body normalization may only normalize line endings and established OpenIM terminology; it must not add sections, examples, APIs, or implementation advice.

- [ ] **Step 5: Rewrite localized-content checks around provenance**

Replace formal-candidate/template checks with:

- generated page keys equal manual MDX route keys;
- pending paths equal active routes minus manual paths;
- generated body equals normalized manual body;
- every generated page has an audit record;
- no pending path has generated body content.

- [ ] **Step 6: Run builder and localized tests**

Run:

```bash
pnpm sdk:zh
pnpm sdk:zh:check
node --test scripts/__tests__/build-wasm-sdk-zh-content.test.mjs
```

Expected: 62 packaged manual pages and 65 pending paths.

## Task 5: Runtime pending state and publication lookup

**Files:**

- Create: `src/lib/wasm-publication.ts`
- Modify: `src/lib/localized-docs.ts`
- Modify: `src/components/docs/documentation-page.tsx`

- [ ] **Step 1: Implement typed publication lookup**

Import the audit JSON and export:

```ts
export type ReviewLocale = 'en' | 'zh';

export function getWasmAuditPage(path: string): WasmAuditPage | undefined;
export function isWasmRoute(path: string): boolean;
export function isWasmLocalePublished(path: string, locale: ReviewLocale): boolean;
export function getPublishedWasmLocales(path: string): ReviewLocale[];
```

Normalize paths once when building the lookup map.

- [ ] **Step 2: Return a neutral pending Chinese page**

When `locale === 'zh'`, the path is an active audited WASM route, and no manual page exists, return:

```md
## 中文内容审核中

该页面已经纳入 OpenIM WASM SDK 文档结构，中文技术内容仍在逐页核对中。

在审核完成前，请参考 OpenIM 官方 SDK 文档和当前项目使用的 SDK 版本。
```

Use the localized route title and description; do not include APIs or implementation alternatives.

- [ ] **Step 3: Gate Metadata by locale**

For WASM pages:

- set `robots: { index: false, follow: false }` when the current locale is not published;
- include only published language alternates;
- retain canonical for the current preview URL, but do not advertise unavailable translations.

Non-WASM metadata must remain byte-for-byte equivalent in behavior.

- [ ] **Step 4: Run TypeScript validation**

Run:

```bash
pnpm typecheck
```

Expected: PASS.

## Task 6: Locale-aware published search

**Files:**

- Modify: `scripts/build-search-index.mjs`
- Create: `src/generated/search-index-zh.json`
- Modify: `src/lib/search.ts`
- Modify: `app/api/search/route.ts`
- Modify: `src/components/search/search-dialog.tsx`

- [ ] **Step 1: Build deterministic English and Chinese indexes**

Rules:

- non-WASM records preserve existing behavior;
- WASM English records are omitted unless `locales.en.reviewStatus === 'published'`;
- WASM Chinese records are generated from manual Chinese MDX only when `locales.zh.reviewStatus === 'published'`;
- no pending page enters either index.

- [ ] **Step 2: Add locale selection in the search library**

Change the public signature to:

```ts
export function searchDocs(query: string, limit = 20, locale: Locale = 'en'): SearchResult[];
```

Select `search-index-zh.json` for `zh`, otherwise the default index.

- [ ] **Step 3: Pass locale through API and dialog**

Validate the query parameter with `isLocale()` and call:

```ts
searchDocs(query, limit, locale);
```

The client request must include:

```ts
`/api/search?q=${encodeURIComponent(query)}&limit=12&locale=${locale}`;
```

- [ ] **Step 4: Verify both search modes**

Run the production server and confirm a pending WASM title is absent from both locale indexes while a non-WASM record remains searchable.

## Task 7: Locale-aware Sitemap and shared publication semantics

**Files:**

- Modify: `app/sitemap.ts`

- [ ] **Step 1: Gate only WASM route entries**

For each WASM route, emit an `en` or `zh` URL only when `isWasmLocalePublished(route.path, locale)` is true. Preserve existing behavior for Chat, Platform API, other SDKs, and Guides.

- [ ] **Step 2: Add a deterministic sitemap assertion to the audit test suite**

Test the shared helper rather than importing the Next metadata route directly:

```js
assert.equal(isLocalePublished(publishedZhPage, 'zh'), true);
assert.equal(isLocalePublished(publishedZhPage, 'en'), false);
```

- [ ] **Step 3: Typecheck and build**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected: both commands pass; the generated Sitemap contains no deferred WASM URLs.

## Task 8: Integrate checks and regenerate derived files

**Files:**

- Modify: `package.json`
- Modify: `src/generated/wasm-sdk-zh-content.json`
- Modify: `src/generated/search-index.json`
- Create: `src/generated/search-index-zh.json`

- [ ] **Step 1: Extend the repository check command**

The final check chain must be:

```json
"check": "eslint . && tsc --noEmit && node --test scripts/__tests__/*.test.mjs && node scripts/check-content.mjs && node scripts/check-wasm-content-audit.mjs && node scripts/check-localized-sdk-content.mjs && node scripts/check-wasm-sdk-examples.mjs"
```

- [ ] **Step 2: Run synchronization**

Run:

```bash
pnpm content:sync
```

Expected: metadata has zero unexpected changes, Chinese output reports 62 manual/65 pending, and search indexes are regenerated deterministically.

- [ ] **Step 3: Run complete verification**

Run:

```bash
pnpm check
pnpm build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 4: Runtime smoke-test representative routes**

Start standalone on a non-default port and request:

- `/zh/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-a-list-of-users-in-an-application` — manual Chinese body.
- one of the 65 pending routes — neutral audit-pending body.
- `/docs/chat/sdk/v4/wasm/overview` — English deferred Metadata with noindex.
- `/api/search?q=OpenIM&locale=zh` — no unpublished WASM result.
- `/sitemap.xml` — no deferred WASM URLs.

Expected: all routes return 200, manual and pending bodies are distinguishable, and publication gates match the audit manifest.

- [ ] **Step 5: Review the final diff against the dirty-worktree baseline**

Confirm that the pre-existing 12 deleted MDX files and six related generated/script modifications remain intentional and are neither restored nor overwritten. Do not stage or commit unrelated user changes automatically.
