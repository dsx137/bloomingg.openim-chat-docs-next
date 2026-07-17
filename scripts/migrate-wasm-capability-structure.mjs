import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const contextKey = 'chat/sdk/wasm';
const rootPath = '/sdk/wasm';

const sections = [
  section('getting-started', 'Getting started', '快速开始'),
  section('user', 'User', '用户'),
  section('conversation', 'Conversation', '会话'),
  section('group', 'Group', '群组'),
  section('message', 'Message', '消息'),
  section('calling', 'Calling', '音视频通话'),
  section('events', 'Events', '事件'),
  section('local-data', 'Local data', '本地数据'),
];

const pages = [
  p(
    'getting-started/environment-specific-implementation',
    'Environment-specific implementation',
    '按运行环境接入',
    'getting-started',
  ),
  p(
    'getting-started/authenticate-and-manage-session',
    'Authenticate and manage a session',
    '认证与管理登录会话',
    'getting-started',
    null,
    'application/authenticating-a-user/authentication',
  ),
  p(
    'getting-started/send-first-message',
    'Send your first message',
    '发送第一条消息',
    'getting-started',
  ),

  p('user/overview-user', 'User overview', '用户概览', 'user'),
  p(
    'user/retrieving-users/retrieve-users',
    'Retrieve users',
    '获取指定用户资料',
    'user',
    folder('retrieving-users', 'Retrieving users', '查询用户'),
    'user/retrieving-users/retrieve-a-list-of-users-in-an-application',
  ),
  p(
    'user/retrieving-users/retrieve-a-list-of-friends',
    'Retrieve a list of friends',
    '获取好友列表',
    'user',
    folder('retrieving-users', 'Retrieving users', '查询用户'),
  ),
  p(
    'user/retrieving-users/retrieve-friend-information',
    'Retrieve specified friend information',
    '获取指定好友信息',
    'user',
    folder('retrieving-users', 'Retrieving users', '查询用户'),
  ),
  p(
    'user/managing-friends/manage-friend-requests',
    'Manage friend requests',
    '处理好友申请',
    'user',
    folder('managing-friends', 'Managing friends', '管理好友'),
  ),
  p(
    'user/managing-friends/update-or-delete-friends',
    'Update or delete friends',
    '更新或删除好友',
    'user',
    folder('managing-friends', 'Managing friends', '管理好友'),
  ),
  p(
    'user/moderating-a-user/retrieve-a-list-of-blocked-users',
    'Retrieve a list of blocked users',
    '获取黑名单列表',
    'user',
    folder('moderating-a-user', 'Moderating users', '用户黑名单'),
  ),
  p(
    'user/moderating-a-user/block-and-unblock-other-members',
    'Block or unblock users',
    '加入或移出黑名单',
    'user',
    folder('moderating-a-user', 'Moderating users', '用户黑名单'),
  ),
  p(
    'user/retrieving-and-updating-user-information/retrieve-the-online-status-of-a-user',
    'Retrieve user online status',
    '获取用户在线状态',
    'user',
    folder(
      'retrieving-and-updating-user-information',
      'Retrieving and updating user information',
      '获取和更新用户资料',
    ),
  ),
  p(
    'user/retrieving-and-updating-user-information/update-user-profile',
    'Update the user profile',
    '更新用户资料',
    'user',
    folder(
      'retrieving-and-updating-user-information',
      'Retrieving and updating user information',
      '获取和更新用户资料',
    ),
  ),
  p('conversation/overview-conversation', 'Conversation overview', '会话概览', 'conversation'),
  p(
    'conversation/retrieving-conversations/retrieve-conversations',
    'Retrieve conversations',
    '获取会话',
    'conversation',
    folder('retrieving-conversations', 'Retrieving conversations', '获取会话'),
  ),
  p(
    'conversation/retrieving-conversations/retrieve-conversation-list',
    'Retrieve a conversation list',
    '获取会话列表',
    'conversation',
    folder('retrieving-conversations', 'Retrieving conversations', '获取会话'),
  ),
  p(
    'conversation/managing-conversations/set-conversation',
    'Set a conversation',
    '设置会话',
    'conversation',
    folder('managing-conversations', 'Managing conversations', '管理会话'),
  ),
  p(
    'conversation/managing-conversations/set-conversation-draft',
    'Set a conversation draft',
    '设置会话草稿',
    'conversation',
    folder('managing-conversations', 'Managing conversations', '管理会话'),
  ),
  p(
    'conversation/managing-conversations/manage-read-status',
    'Manage conversation read status',
    '管理会话已读状态',
    'conversation',
    folder('managing-conversations', 'Managing conversations', '管理会话'),
  ),
  p(
    'conversation/managing-conversations/hide-or-archive-conversation',
    'Hide a conversation',
    '隐藏会话',
    'conversation',
    folder('managing-conversations', 'Managing conversations', '管理会话'),
  ),
  p(
    'conversation/managing-conversations/delete-or-clear-conversation',
    'Delete or clear a conversation',
    '删除或清空会话',
    'conversation',
    folder('managing-conversations', 'Managing conversations', '管理会话'),
  ),
  p(
    'conversation/managing-conversation-groups/manage-conversation-groups',
    'Manage conversation groups',
    '管理会话分组',
    'conversation',
    folder('managing-conversation-groups', 'Managing conversation groups', '管理会话分组'),
    null,
    'conversation/managing-conversations/set-conversation',
  ),
  p('group/overview-group', 'Group overview', '群组概览', 'group'),
  p(
    'group/creating-and-updating-groups/create-or-update-a-group',
    'Create or update a group',
    '创建或更新群组',
    'group',
    folder('creating-and-updating-groups', 'Creating and updating groups', '创建和更新群组'),
  ),
  p(
    'group/retrieving-groups/retrieve-and-search-groups',
    'Retrieve and search groups',
    '获取和搜索群组',
    'group',
    folder('retrieving-groups', 'Retrieving groups', '获取群组'),
  ),
  p(
    'group/joining-and-leaving-groups/join-leave-or-dismiss-a-group',
    'Join, leave, or dismiss a group',
    '加入、退出或解散群组',
    'group',
    folder('joining-and-leaving-groups', 'Joining and leaving groups', '加入和退出群组'),
  ),
  p(
    'group/managing-group-applications/manage-group-applications',
    'Manage group applications',
    '处理入群申请',
    'group',
    folder('managing-group-applications', 'Managing group applications', '管理入群申请'),
  ),
  p(
    'group/retrieving-group-members/retrieve-group-members',
    'Retrieve group members',
    '获取群成员',
    'group',
    folder('retrieving-group-members', 'Retrieving group members', '获取群成员'),
  ),
  p(
    'group/managing-group-members/invite-or-remove-group-members',
    'Invite or remove group members',
    '邀请或移除群成员',
    'group',
    folder('managing-group-members', 'Managing group members', '管理群成员'),
  ),
  p(
    'group/managing-group-members/update-group-member-info',
    'Update group member information',
    '更新群成员资料和角色',
    'group',
    folder('managing-group-members', 'Managing group members', '管理群成员'),
  ),
  p(
    'group/managing-group-members/transfer-group-owner',
    'Transfer group owner',
    '转让群主',
    'group',
    folder('managing-group-members', 'Managing group members', '管理群成员'),
  ),
  p(
    'group/moderating-groups/mute-a-group-or-member',
    'Mute a group or member',
    '禁言群组或群成员',
    'group',
    folder('moderating-groups', 'Moderating groups', '群组管控'),
  ),
  p('message/overview-message', 'Message overview', '消息概览', 'message'),
  p(
    'message/sending-messages/send-a-message',
    'Send a message',
    '发送消息',
    'message',
    folder('sending-messages', 'Sending messages', '发送消息'),
    'message/sending-a-message/send-a-message',
  ),
  p(
    'message/sending-messages/create-media-and-rich-messages',
    'Create media and rich messages',
    '创建媒体与富消息',
    'message',
    folder('sending-messages', 'Sending messages', '发送消息'),
    'message/sending-a-message/create-media-and-rich-messages',
  ),
  p(
    'message/sending-messages/upload-files-and-track-progress',
    'Upload files and track progress',
    '上传文件并跟踪进度',
    'message',
    folder('sending-messages', 'Sending messages', '发送消息'),
    'message/sending-a-message/track-file-upload-progress-using-a-handler',
  ),
  p(
    'message/receiving-messages/receive-messages',
    'Receive messages',
    '接收消息',
    'message',
    folder('receiving-messages', 'Receiving messages', '接收消息'),
    'message/receiving-messages-through-event-handler/receive-messages-in-a-group-channel',
  ),
  p(
    'message/retrieving-messages/retrieve-message-list',
    'Retrieve a message list',
    '获取消息列表',
    'message',
    folder('retrieving-messages', 'Retrieving messages', '获取消息'),
    'message/retrieving-messages/retrieve-a-list-of-messages',
  ),
  p(
    'message/retrieving-messages/retrieve-messages',
    'Retrieve messages',
    '获取指定消息',
    'message',
    folder('retrieving-messages', 'Retrieving messages', '获取消息'),
    'message/retrieving-messages/retrieve-a-message',
  ),
  p(
    'message/searching-messages/search-messages',
    'Search messages',
    '搜索消息',
    'message',
    folder('searching-messages', 'Searching messages', '搜索消息'),
    'message/searching-messages-in-a-group-channel/search-messages-by-a-keyword',
  ),
  p(
    'message/composing-messages/add-extra-data-to-a-message',
    'Add extra data to a message',
    '为消息添加扩展数据',
    'message',
    folder('composing-messages', 'Composing messages', '构建消息'),
    'message/adding-extra-data-to-a-message/add-extra-data-to-a-message',
  ),
  p(
    'message/composing-messages/mention-users-in-a-message',
    'Mention users in a message',
    '在消息中提及用户',
    'message',
    folder('composing-messages', 'Composing messages', '构建消息'),
    'message/mentioning-other-users-in-a-message/mention-other-users-in-a-message',
  ),
  p(
    'message/composing-messages/manage-typing-status',
    'Manage typing status',
    '管理输入状态',
    'message',
    folder('composing-messages', 'Composing messages', '构建消息'),
    'message/managing-a-message/send-typing-indicators-to-other-members',
  ),
  p(
    'message/composing-messages/transcribe-audio',
    'Transcribe audio',
    '将音频转为文字',
    'message',
    folder('composing-messages', 'Composing messages', '构建消息'),
    null,
    'message/sending-messages/create-media-and-rich-messages',
  ),
  p(
    'message/managing-messages/forward-or-merge-a-message',
    'Forward or merge a message',
    '转发或合并消息',
    'message',
    folder('managing-messages', 'Managing messages', '管理消息'),
    'message/managing-a-message/copy-a-message',
  ),
  p(
    'message/managing-messages/delete-or-revoke-a-message',
    'Delete or revoke a message',
    '删除或撤回消息',
    'message',
    folder('managing-messages', 'Managing messages', '管理消息'),
    'message/managing-a-message/delete-a-message',
  ),
  p(
    'message/managing-messages/pin-conversation-messages',
    'Pin conversation messages',
    '置顶会话消息',
    'message',
    folder('managing-messages', 'Managing messages', '管理消息'),
    null,
    'message/managing-messages/delete-or-revoke-a-message',
  ),
  p(
    'message/managing-messages/insert-a-local-message',
    'Insert a local message',
    '插入本地消息',
    'message',
    folder('managing-messages', 'Managing messages', '管理消息'),
    'message/managing-a-message/insert-a-local-message',
  ),
  p(
    'message/managing-messages/clear-message-history',
    'Clear message history',
    '清理消息历史',
    'message',
    folder('managing-messages', 'Managing messages', '管理消息'),
    'message/managing-a-message/clear-the-chat-history-in-a-group-channel',
  ),
  p(
    'message/managing-read-status/manage-group-message-read-receipts',
    'Manage group message read receipts',
    '管理群消息已读回执',
    'message',
    folder('managing-read-status', 'Managing read status', '管理已读状态'),
    'message/managing-read-status-in-a-group-channel/get-read-status',
  ),

  p(
    'calling/overview-calling',
    'Calling overview',
    '音视频通话概览',
    'calling',
    null,
    null,
    'report/overview-report',
  ),
  p(
    'calling/managing-calls/start-or-handle-a-call',
    'Start or handle a call',
    '发起或处理通话',
    'calling',
    folder('managing-calls', 'Managing calls', '管理通话'),
    null,
    'report/creating-a-report/report-a-message-user-or-channel',
  ),
  p(
    'calling/retrieving-call-information/retrieve-call-information',
    'Retrieve call information',
    '获取通话信息',
    'calling',
    folder('retrieving-call-information', 'Retrieving call information', '获取通话信息'),
    null,
    'push-notifications/overview-push-notifications',
  ),
  p(
    'calling/sending-custom-signals/send-a-custom-signal',
    'Send a custom signal',
    '发送自定义信令',
    'calling',
    folder('sending-custom-signals', 'Sending custom signals', '发送自定义信令'),
    null,
    'push-notifications/configuring-preferences/push-notification-preferences',
  ),
  p(
    'events/overview-events',
    'Events overview',
    '事件概览',
    'events',
    null,
    'event-handler/overview-event-handler',
  ),
  p(
    'local-data/export-local-database',
    'Export the local database',
    '导出本地数据库',
    'local-data',
    null,
    null,
    'local-caching/overview-local-caching',
  ),

  p('error-codes', 'Error codes', '错误码'),
  p('logger', 'Logger', '日志'),
  p('overview', 'OpenIM SDK for WASM', 'OpenIM WASM SDK 概览'),
];

const [chatPages, routes, navigation] = await Promise.all([
  readJson('data/structure/chat-pages.json'),
  readJson('src/generated/routes.json'),
  readJson('src/generated/navigation.json'),
]);

const oldRoutes = routes.filter((route) => route.contextKey === contextKey);
const oldByPath = new Map(oldRoutes.map((route) => [route.path, route]));
const baseOrder = Math.min(...oldRoutes.map((route) => route.navOrder).filter(Number.isFinite));

const nextWasmRoutes = pages.map((definition, index) => {
  const path = `${rootPath}/${definition.relativePath}`;
  const donorPath = `${rootPath}/${definition.donor ?? definition.source ?? definition.relativePath}`;
  const donor = oldByPath.get(donorPath) ?? oldByPath.get(path);
  if (!donor) throw new Error(`${path}: missing donor route ${donorPath}`);
  return {
    ...donor,
    path,
    relativePath: path.slice('/docs/'.length),
    sourcePath: path,
    title: definition.title,
    description: `OpenIM WASM SDK guide for ${definition.title}.`,
    contentFile: `content${path}.mdx`,
    navOrder: baseOrder + index,
  };
});

const nextRoutes = routes
  .filter((route) => route.contextKey !== contextKey)
  .concat(nextWasmRoutes)
  .sort((left, right) => left.id - right.id);

const nextChatPages = chatPages
  .filter((item) => item.context !== contextKey)
  .concat(
    nextWasmRoutes.map((route) => ({
      sourcePath: route.path,
      openimPath: route.path,
      title: route.title,
      context: contextKey,
      template: route.template,
      contentFile: route.contentFile,
    })),
  );

const context = navigation.contexts.find((item) => item.key === contextKey);
if (!context) throw new Error(`Missing navigation context ${contextKey}`);
context.nodes = buildNavigation(nextWasmRoutes);

const activeLabels = {};
for (const item of sections) {
  activeLabels[item.title] = item.label;
  activeLabels[item.segment] = item.label;
}
for (const item of pages) {
  activeLabels[item.title] = item.zhTitle;
  if (item.folder) {
    activeLabels[item.folder.title] = item.folder.label;
    activeLabels[item.folder.segment] = item.folder.label;
  }
}

await Promise.all([
  writeJson('data/structure/chat-pages.json', nextChatPages),
  writeJson('src/generated/routes.json', nextRoutes),
  writeJson('src/generated/navigation.json', navigation),
  writeJson(
    'data/structure/wasm-navigation-labels.json',
    Object.fromEntries(
      Object.entries(activeLabels).sort(([left], [right]) => left.localeCompare(right)),
    ),
  ),
  ...pages.map(migrateContent),
]);

console.log(`Migrated WASM structure from ${oldRoutes.length} to ${nextWasmRoutes.length} routes.`);

function buildNavigation(routeList) {
  const nodes = [];
  for (const item of sections) {
    const sectionPages = pages.filter((page) => page.section === item.segment);
    const children = [];
    const folders = new Map();
    for (const page of sectionPages) {
      const route = routeList.find(
        (candidate) => candidate.path === `${rootPath}/${page.relativePath}`,
      );
      const pageNode = nodeFor(page, route);
      if (!page.folder) {
        children.push(pageNode);
        continue;
      }
      let parent = folders.get(page.folder.segment);
      if (!parent) {
        parent = {
          id: `${item.segment}/${page.folder.segment}`,
          segment: page.folder.segment,
          title: page.folder.title,
          href: null,
          type: 'folder',
          children: [],
          minIndex: route.navOrder,
        };
        folders.set(page.folder.segment, parent);
        children.push(parent);
      }
      parent.children.push(pageNode);
      parent.minIndex = Math.min(parent.minIndex, route.navOrder);
    }
    nodes.push({
      id: item.segment,
      segment: item.segment,
      title: item.title,
      href: null,
      type: 'folder',
      children,
      minIndex: Math.min(...children.map((child) => child.minIndex)),
    });
  }

  for (const page of pages.filter((item) => !item.section)) {
    const route = routeList.find(
      (candidate) => candidate.path === `${rootPath}/${page.relativePath}`,
    );
    nodes.push(nodeFor(page, route));
  }
  return nodes;
}

function nodeFor(page, route) {
  return {
    id: page.relativePath,
    segment: page.relativePath.split('/').at(-1),
    title: page.title,
    href: route.path,
    type: 'page',
    children: [],
    minIndex: route.navOrder,
  };
}

async function migrateContent(page) {
  const targetPath = `${rootPath}/${page.relativePath}`;
  const sourcePath = `${rootPath}/${page.source ?? page.relativePath}`;
  const targetZh = resolve(root, 'content/zh', `${targetPath.slice(1)}.mdx`);
  const sourceZh = resolve(root, 'content/zh', `${sourcePath.slice(1)}.mdx`);

  if (!(await exists(targetZh)) && (await exists(sourceZh))) {
    await mkdir(dirname(targetZh), { recursive: true });
    const source = await readFile(sourceZh, 'utf8');
    await writeFile(
      targetZh,
      updateFrontmatter(source, {
        title: page.zhTitle,
        description: `使用 OpenIM WASM SDK ${page.zhTitle}。`,
        sourcePath: targetPath,
      }),
      'utf8',
    );
  }

  const targetEn = resolve(root, 'content', `${targetPath.slice(1)}.mdx`);
  await mkdir(dirname(targetEn), { recursive: true });
  await writeFile(targetEn, englishScaffold(page, targetPath), 'utf8');
}

function updateFrontmatter(source, values) {
  let next = source;
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}: '${String(value).replaceAll("'", "''")}'`;
    const pattern = new RegExp(`^${key}: .+$`, 'm');
    next = pattern.test(next)
      ? next.replace(pattern, line)
      : next.replace(/^---$/m, `---\n${line}`);
  }
  return next;
}

function englishScaffold(page, path) {
  return [
    '---',
    `title: '${page.title.replaceAll("'", "''")}'`,
    `description: 'OpenIM WASM SDK guide for ${page.title.replaceAll("'", "''")}.'`,
    "product: 'sdk'",
    `context: '${contextKey}'`,
    `template: '${page.relativePath === 'overview' ? 'overview' : 'guide'}'`,
    "status: 'draft'",
    "lastUpdated: '2026-07-14'",
    "version: 'v4'",
    "platform: 'wasm'",
    `sourcePath: '${path}'`,
    '---',
    '',
    '## Overview',
    '',
    'The English version of this OpenIM WASM SDK guide is deferred until the reviewed Chinese documentation is complete.',
    '',
  ].join('\n');
}

function p(relativePath, title, zhTitle, sectionName, folderValue, source, donor) {
  return {
    relativePath,
    title,
    zhTitle,
    section: sectionName ?? null,
    folder: folderValue ?? null,
    source: source ?? relativePath,
    donor: donor ?? source ?? relativePath,
  };
}

function section(segment, title, label) {
  return { segment, title, label };
}

function folder(segment, title, label) {
  return { segment, title, label };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function writeJson(relativePath, value) {
  await writeFile(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
