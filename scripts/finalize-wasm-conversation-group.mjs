import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const contextKey = 'chat/sdk/wasm';
const docsCommit = 'a177b296f1abe53ba2cf7d897acf86467a45e7c6';
const docsBase = `https://github.com/openimsdk/docs/blob/${docsCommit}/docs/sdks`;

const unsupportedPaths = new Set([
  '/sdk/wasm/channel/categorizing-channels/categorize-channels-by-custom-type',
  '/sdk/wasm/channel/joining-and-leaving-a-channel/enter-and-exit-an-open-channel',
  '/sdk/wasm/channel/managing-channel-metacounters/manage-channel-metacounters',
  '/sdk/wasm/channel/managing-channel-metadata/manage-channel-metadata',
  '/sdk/wasm/channel/searching-channels/filter-group-channels-by-user-ids',
  '/sdk/wasm/channel/searching-channels/search-open-channels-by-name-or-url-or-custom-types',
]);

const documentedMethods = new Set([
  'acceptGroupApplication',
  'changeGroupMemberMute',
  'changeGroupMute',
  'clearConversationAndDeleteAllMsg',
  'createGroup',
  'deleteConversationAndDeleteAllMsg',
  'dismissGroup',
  'getAllConversationList',
  'getConversationIDBySessionType',
  'getConversationListSplit',
  'getGroupApplicationListAsApplicant',
  'getGroupApplicationListAsRecipient',
  'getGroupMemberList',
  'getGroupMemberListByJoinTimeFilter',
  'getGroupMemberOwnerAndAdmin',
  'getJoinedGroupList',
  'getJoinedGroupListPage',
  'getMultipleConversation',
  'getOneConversation',
  'getSpecifiedGroupMembersInfo',
  'getSpecifiedGroupsInfo',
  'getTotalUnreadMsgCount',
  'getUsersInGroup',
  'hideConversation',
  'inviteUserToGroup',
  'isJoinGroup',
  'joinGroup',
  'kickGroupMember',
  'markConversationMessageAsRead',
  'quitGroup',
  'refuseGroupApplication',
  'searchGroupMembers',
  'searchGroups',
  'setConversation',
  'setConversationDraft',
  'setGroupInfo',
  'setGroupMemberInfo',
  'transferGroupOwner',
]);

const callbackDocumentNames = {
  OnConversationUserInputStatusChanged: 'onInputStatusChanged',
};

const [routes, audit, coverage, redirectEntries] = await Promise.all([
  readJson('src/generated/routes.json'),
  readJson('data/structure/wasm-content-audit.json'),
  readJson('data/structure/wasm-domain-api-coverage.json'),
  readJson('data/structure/wasm-legacy-redirects.json'),
]);

const domainRoutes = routes.filter(
  (route) =>
    route.contextKey === contextKey &&
    (route.path.includes('/conversation/') || route.path.includes('/group/')),
);
const redirectBySource = new Map(
  redirectEntries.map((entry) => [entry.source, entry.destination]),
);
const coverageByPage = buildCoverageByPage(coverage);
const existingByPath = new Map(audit.pages.map((page) => [page.currentPath, page]));

for (const [source, destination] of redirectBySource) {
  const page = existingByPath.get(source);
  if (!page) throw new Error(`Missing historical audit record: ${source}`);
  existingByPath.set(source, {
    ...page,
    targetPath: destination,
    disposition: 'merge',
    redirectTo: destination,
    openimSources:
      page.openimSources.length > 0
        ? page.openimSources
        : [`${docsBase}/api/${domainFor(destination)}/index.md`],
    locales: reviewedLocales(),
    notes: appendUnique(
      page.notes,
      `2026-07-14：该页面已合并到 ${destination}；保留本记录用于追溯原 Sendbird 路径、OpenIM 证据和永久重定向。`,
    ),
  });
}

for (const path of unsupportedPaths) {
  const page = existingByPath.get(path);
  if (!page) throw new Error(`Missing unsupported audit record: ${path}`);
  existingByPath.set(path, {
    ...page,
    targetPath: path,
    disposition: 'remove',
    openimSources: [`${docsBase}/api/group/index.md`],
    sdkMethods: [],
    sdkEvents: [],
    locales: reviewedLocales(),
    redirectTo: null,
    notes: appendUnique(
      page.notes,
      '2026-07-14：固定 WASM SDK 无对应能力；这是 OpenIM 与 Sendbird 模型边界记录，页面删除且不设置重定向。',
    ),
  });
}

for (const route of domainRoutes) {
  const pageCoverage = coverageByPage.get(route.path) ?? { domain: domainFor(route.path), methods: [], events: [] };
  const openimSources = sourceUrls(pageCoverage);
  const conceptNote =
    pageCoverage.methods.length === 0
      ? '2026-07-14：这是 OpenIM 专属概念与事件边界页，按固定 WASM 声明和回调文档逐项审核。'
      : '2026-07-14：中文正文已按固定 WASM 声明逐项核对参数、返回值、权限边界和替代入口。';

  existingByPath.set(route.path, {
    currentPath: route.path,
    targetPath: route.path,
    sourceKind: 'openim-specific',
    disposition: 'adapt',
    sendbirdSource: null,
    openimSources,
    sdkMethods: pageCoverage.methods,
    sdkEvents: pageCoverage.events,
    locales: reviewedLocales(),
    redirectTo: null,
    notes: [conceptNote],
  });
}

audit.pages = [
  ...routes
    .filter((route) => route.contextKey === contextKey)
    .map((route) => existingByPath.get(route.path))
    .filter(Boolean),
  ...[...existingByPath.values()]
    .filter((page) => !routes.some((route) => route.contextKey === contextKey && route.path === page.currentPath))
    .sort((left, right) => left.currentPath.localeCompare(right.currentPath)),
];

await Promise.all([
  writeJson('data/structure/wasm-content-audit.json', audit),
  ...domainRoutes.map(writeEnglishScaffold),
]);

console.log(
  `Finalized ${domainRoutes.length} Conversation/Group audit records, ${redirectEntries.length} redirects, and English scaffolds.`,
);

function buildCoverageByPage(manifest) {
  const result = new Map();
  for (const [domain, items] of Object.entries(manifest.domains)) {
    for (const item of items.methods) {
      const page = getPage(result, item.page, domain);
      page.methods.push(item.name);
    }
    for (const item of items.events) {
      const page = getPage(result, item.page, domain);
      page.events.push(item.name);
    }
  }
  return result;
}

function getPage(map, path, domain) {
  if (!map.has(path)) map.set(path, { domain, methods: [], events: [] });
  return map.get(path);
}

function sourceUrls(page) {
  const urls = [];
  for (const method of page.methods) {
    if (documentedMethods.has(method)) {
      urls.push(`${docsBase}/api/${page.domain}/${method}.md`);
    }
  }
  for (const event of page.events) {
    const documentName = callbackDocumentNames[event] ?? `on${event.slice(2)}`;
    urls.push(`${docsBase}/callback/${documentName}.md`);
  }
  if (urls.length === 0) urls.push(`${docsBase}/api/${page.domain}/index.md`);
  return [...new Set(urls)].sort();
}

function domainFor(path) {
  return path.includes('/conversation/') ? 'conversation' : 'group';
}

function reviewedLocales() {
  return {
    zh: {
      reviewStatus: 'api-verified',
      reviewer: 'Codex',
      reviewedAt: '2026-07-14',
      exampleVerification: { status: 'pending', evidence: [], reason: null },
    },
    en: {
      reviewStatus: 'deferred',
      reviewer: null,
      reviewedAt: null,
      exampleVerification: { status: 'pending', evidence: [], reason: null },
    },
  };
}

function appendUnique(notes = [], note) {
  return notes.includes(note) ? notes : [...notes, note];
}

async function writeEnglishScaffold(route) {
  const file = resolve(root, route.contentFile);
  try {
    await access(file);
    return;
  } catch {
    // The English body is intentionally deferred; only create the structural route file.
  }

  await mkdir(dirname(file), { recursive: true });
  const source = [
    '---',
    `title: '${route.title.replaceAll("'", "''")}'`,
    `description: '${route.description.replaceAll("'", "''")}'`,
    "product: 'sdk'",
    `context: '${contextKey}'`,
    "template: 'guide'",
    "status: 'draft'",
    "lastUpdated: '2026-07-14'",
    "version: 'v4'",
    "platform: 'wasm'",
    `sourcePath: '${route.path}'`,
    '---',
    '',
    '## Overview',
    '',
    'The English version of this OpenIM WASM SDK guide is deferred until the reviewed Chinese documentation is complete.',
    '',
  ].join('\n');
  await writeFile(file, source, 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function writeJson(relativePath, value) {
  await writeFile(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
