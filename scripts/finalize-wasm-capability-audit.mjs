import { readFile, writeFile } from 'node:fs/promises';

const contextKey = 'chat/sdk/wasm';
const reviewDate = '2026-07-15';
const sdkCoreCommit = '9267a252faab02bbc8ffab6223e6ae2341a0f7c9';
const sdkDeclarationSource = `https://github.com/openimsdk/openim-sdk-core/blob/${sdkCoreCommit}/wasm/cmd/main.go`;
const wasmSdkCommit = 'd99f708a17808e0aab50b034dce51cfbb1e1e9d8';
const wasmSdkDeclarationSource = `https://github.com/OpenIMSDK/Open-IM-SDK-Web-Wasm/blob/${wasmSdkCommit}/src/sdk/index.ts`;

const aliases = new Map([
  alias(
    'application/authenticating-a-user/authentication',
    'getting-started/authenticate-and-manage-session',
  ),
  alias('application/overview-application', 'getting-started/authenticate-and-manage-session'),
  alias('event-handler/overview-event-handler', 'events/overview-events'),
  alias(
    'event-handler/managing-connection-event-handlers/add-or-remove-a-connection-event-handler',
    'getting-started/authenticate-and-manage-session',
  ),
  alias(
    'event-handler/managing-user-event-handlers/add-or-remove-a-user-event-handler',
    'events/overview-events',
  ),
  alias(
    'event-handler/managing-channel-event-handlers/add-or-remove-a-channel-event-handler',
    'events/overview-events',
  ),
  alias('channel/overview-channel', 'conversation/overview-conversation'),
  alias(
    'channel/creating-a-channel/create-a-channel',
    'group/creating-and-updating-groups/create-or-update-a-group',
  ),
  alias(
    'channel/inviting-users-to-a-group-channel/accept-or-decline-an-invitation',
    'group/managing-group-applications/manage-group-applications',
  ),
  alias(
    'channel/inviting-users-to-a-group-channel/invite-users-as-members',
    'group/managing-group-members/invite-or-remove-group-members',
  ),
  alias(
    'channel/joining-and-leaving-a-channel/join-and-leave-a-group-channel',
    'group/joining-and-leaving-groups/join-leave-or-dismiss-a-group',
  ),
  alias(
    'channel/managing-channels/delete-a-channel',
    'group/joining-and-leaving-groups/join-leave-or-dismiss-a-group',
  ),
  alias(
    'channel/managing-channels/hide-or-archive-a-group-channel-from-a-list-of-channels',
    'conversation/managing-conversations/hide-or-archive-conversation',
  ),
  alias(
    'channel/managing-channels/refresh-all-data-related-to-a-group-channel',
    'group/retrieving-groups/retrieve-and-search-groups',
  ),
  alias(
    'channel/managing-operators/register-and-remove-operators',
    'group/managing-group-members/update-group-member-info',
  ),
  alias(
    'channel/managing-operators/transfer-group-owner',
    'group/managing-group-members/transfer-group-owner',
  ),
  alias(
    'channel/moderating-a-channel/freeze-and-unfreeze-a-channel',
    'group/moderating-groups/mute-a-group-or-member',
  ),
  alias(
    'channel/retrieving-channels/retrieve-a-channel-by-url',
    'group/retrieving-groups/retrieve-and-search-groups',
  ),
  alias(
    'channel/retrieving-channels/retrieve-a-list-of-channels',
    'conversation/retrieving-conversations/retrieve-conversation-list',
  ),
  alias(
    'channel/retrieving-channels/retrieve-group-members',
    'group/retrieving-group-members/retrieve-group-members',
  ),
  alias(
    'channel/searching-channels/search-group-channels-by-name-url-or-other-filters',
    'group/retrieving-groups/retrieve-and-search-groups',
  ),
  alias(
    'conversations/configuring-message-destruction',
    'conversation/managing-conversations/set-conversation',
  ),
  alias(
    'groups/retrieving-members/filter-members-by-join-time',
    'group/retrieving-group-members/retrieve-group-members',
  ),
  alias(
    'groups/retrieving-members/retrieve-owner-and-administrators',
    'group/retrieving-group-members/retrieve-group-members',
  ),
  alias(
    'message/adding-extra-data-to-a-message/add-extra-data-to-a-message',
    'message/composing-messages/add-extra-data-to-a-message',
  ),
  alias(
    'message/managing-a-message/clear-the-chat-history-in-a-group-channel',
    'message/managing-messages/clear-message-history',
  ),
  alias(
    'message/managing-a-message/copy-a-message',
    'message/managing-messages/forward-or-merge-a-message',
  ),
  alias(
    'message/managing-a-message/delete-a-message',
    'message/managing-messages/delete-or-revoke-a-message',
  ),
  alias(
    'message/managing-a-message/insert-a-local-message',
    'message/managing-messages/insert-a-local-message',
  ),
  alias(
    'message/managing-a-message/send-typing-indicators-to-other-members',
    'message/composing-messages/manage-typing-status',
  ),
  alias(
    'message/managing-pinned-messages-in-group-channels/list-pinned-messages',
    'message/managing-messages/pin-conversation-messages',
  ),
  alias(
    'message/managing-pinned-messages-in-group-channels/pin-a-message',
    'message/managing-messages/pin-conversation-messages',
  ),
  alias(
    'message/managing-pinned-messages-in-group-channels/unpin-a-message',
    'message/managing-messages/pin-conversation-messages',
  ),
  alias(
    'message/managing-read-status-in-a-group-channel/get-read-status',
    'message/managing-read-status/manage-group-message-read-receipts',
  ),
  alias(
    'message/managing-read-status-in-a-group-channel/mark-messages-as-read',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/marking-messages-as-read-in-a-group-channel/mark-messages-as-read',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/mentioning-other-users-in-a-message/mention-other-users-in-a-message',
    'message/composing-messages/mention-users-in-a-message',
  ),
  alias(
    'message/receiving-messages-through-event-handler/receive-messages-in-a-group-channel',
    'message/receiving-messages/receive-messages',
  ),
  alias(
    'message/retrieving-messages/retrieve-a-list-of-messages',
    'message/retrieving-messages/retrieve-message-list',
  ),
  alias(
    'message/retrieving-messages/retrieve-a-message',
    'message/retrieving-messages/retrieve-messages',
  ),
  alias(
    'message/retrieving-unread-counts-in-a-group-channel/unread-channels',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/retrieving-unread-counts-in-a-group-channel/unread-items',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/retrieving-unread-counts-in-a-group-channel/unread-messages',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/retrieving-unread-counts-in-a-group-channel/unread-messages-in-all-channels',
    'conversation/managing-conversations/manage-read-status',
  ),
  alias(
    'message/searching-messages-in-a-group-channel/search-messages-by-a-keyword',
    'message/searching-messages/search-messages',
  ),
  alias(
    'message/sending-a-message/create-media-and-rich-messages',
    'message/sending-messages/create-media-and-rich-messages',
  ),
  alias('message/sending-a-message/send-a-message', 'message/sending-messages/send-a-message'),
  alias(
    'message/sending-a-message/track-file-upload-progress-using-a-handler',
    'message/sending-messages/upload-files-and-track-progress',
  ),
  alias('signaling/overview', 'calling/overview-calling'),
  alias(
    'conversation/synchronizing-conversations/synchronize-conversation-data',
    'conversation/overview-conversation',
  ),
  alias(
    'group/synchronizing-groups/synchronize-group-data',
    'group/overview-group',
  ),
  alias(
    'calling/synchronizing-calls/synchronize-call-events',
    'calling/managing-calls/start-or-handle-a-call',
  ),
  alias(
    'user/moderating-a-user/ban-and-unban-a-user',
    'user/moderating-a-user/block-and-unblock-other-members',
  ),
  alias(
    'user/moderating-a-user/retrieve-a-list-of-banned-users',
    'user/moderating-a-user/retrieve-a-list-of-blocked-users',
  ),
  alias(
    'user/moderating-a-user/mute-and-unmute-a-user',
    'group/moderating-groups/mute-a-group-or-member',
  ),
  alias(
    'user/moderating-a-user/retrieve-a-list-of-muted-users',
    'group/retrieving-group-members/retrieve-group-members',
  ),
  alias(
    'user/retrieving-users/retrieve-a-list-of-users-in-an-application',
    'user/retrieving-users/retrieve-users',
  ),
  alias(
    'user/retrieving-and-updating-user-information/retrieve-the-latest-information-on-participants',
    'user/retrieving-users/retrieve-users',
  ),
  alias(
    'user/managing-user-metadata/manage-user-metadata',
    'user/retrieving-and-updating-user-information/update-user-profile',
  ),
]);

const [allRoutes, audit, ownership] = await Promise.all([
  readJson('src/generated/routes.json'),
  readJson('data/structure/wasm-content-audit.json'),
  readJson('data/structure/wasm-api-ownership.json'),
]);

const routes = allRoutes.filter((route) => route.contextKey === contextKey);
const activePaths = new Set(routes.map((route) => route.path));
const existingByPath = new Map(audit.pages.map((page) => [page.currentPath, page]));
const methodsByPage = groupOwnership(ownership.methods);
const eventsByPage = groupOwnership(ownership.events);

for (const [source, destination] of aliases) {
  if (!activePaths.has(destination)) throw new Error(`${source}: inactive alias ${destination}`);
}

const activeRecords = routes.map((route) => {
  const existing = existingByPath.get(route.path);
  const inheritedSources = [
    ...(existing?.openimSources ?? []),
    ...audit.pages
      .filter((page) => aliases.get(page.currentPath) === route.path)
      .flatMap((page) => page.openimSources ?? []),
    sdkDeclarationSource,
    wasmSdkDeclarationSource,
  ];

  return {
    currentPath: route.path,
    targetPath: route.path,
    sourceKind: 'openim-specific',
    disposition: 'adapt',
    sendbirdSource: null,
    openimSources: [...new Set(inheritedSources)],
    sdkMethods: methodsByPage.get(route.path) ?? [],
    sdkEvents: eventsByPage.get(route.path) ?? [],
    locales: reviewedLocales(),
    redirectTo: null,
    notes: [
      '2026-07-15：中文正文已按 @openim/wasm-client-sdk@3.8.5-hotfix.0 的固定声明逐项核对；页面组织参考 Sendbird，能力与数据模型以 OpenIM 为准。',
      '2026-07-15：新增 API、事件、参数、类型以及概念与能力边界已人工复核，英文内容待中文全量完成后处理。',
    ],
  };
});

const inactiveRecords = audit.pages
  .filter((page) => !activePaths.has(page.currentPath))
  .map((page) => {
    const redirectTo = aliases.get(page.currentPath) ?? null;
    return {
      ...page,
      targetPath: redirectTo ?? page.currentPath,
      sourceKind: 'openim-specific',
      disposition: redirectTo ? 'merge' : 'remove',
      sendbirdSource: page.sendbirdSource ?? null,
      openimSources: [
        ...new Set([...(page.openimSources ?? []), sdkDeclarationSource, wasmSdkDeclarationSource]),
      ],
      sdkMethods: page.sdkMethods ?? [],
      sdkEvents: page.sdkEvents ?? [],
      locales: reviewedLocales(),
      redirectTo,
      notes: [
        ...(page.notes ?? []),
        '2026-07-15：已按 @openim/wasm-client-sdk@3.8.5-hotfix.0 复核该历史页面的能力边界。',
        redirectTo
          ? `2026-07-15：旧页面中的真实 OpenIM 能力已合并到 ${redirectTo}，保留永久重定向。`
          : '2026-07-15：固定 WASM 包没有与该 Sendbird 主题对应的公开能力，页面移除且不设置重定向。',
      ],
    };
  })
  .sort((left, right) => left.currentPath.localeCompare(right.currentPath));

const manifest = {
  schemaVersion: 1,
  sources: {
    ...audit.sources,
    sdkCore: {
      repository: 'https://github.com/openimsdk/openim-sdk-core',
      commit: sdkCoreCommit,
    },
  },
  pages: [...activeRecords, ...inactiveRecords],
};

const redirects = inactiveRecords
  .filter((page) => page.disposition === 'merge')
  .map((page) => ({ source: page.currentPath, destination: page.redirectTo }));

await Promise.all([
  writeFile('data/structure/wasm-content-audit.json', `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile('data/structure/wasm-legacy-redirects.json', `${JSON.stringify(redirects, null, 2)}\n`),
]);

console.log(
  `Finalized ${activeRecords.length} active records, ${redirects.length} merges, and ${inactiveRecords.length - redirects.length} removals.`,
);

function alias(source, destination) {
  return [`/sdk/wasm/${source}`, `/sdk/wasm/${destination}`];
}

function groupOwnership(items) {
  const grouped = new Map();
  for (const item of items) {
    if (item.status.startsWith('excluded')) continue;
    const values = grouped.get(item.page) ?? [];
    values.push(item.name);
    grouped.set(item.page, values);
  }
  return grouped;
}

function reviewedLocales() {
  return {
    zh: {
      reviewStatus: 'api-verified',
      reviewer: 'Codex',
      reviewedAt: reviewDate,
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

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
