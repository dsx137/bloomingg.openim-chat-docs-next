import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const contextKey = 'chat/sdk/wasm';
const rootPath = '/sdk/wasm';

const sections = [
  {
    segment: 'conversation',
    title: 'Conversation',
    label: '会话',
    pages: [
      page('overview-conversation', 'Conversation overview', '会话概览'),
      page(
        'retrieving-conversations/retrieve-conversations',
        'Retrieve conversations',
        '获取会话',
        'retrieving-conversations',
        'Retrieving conversations',
        '获取会话',
      ),
      page(
        'retrieving-conversations/retrieve-conversation-list',
        'Retrieve a conversation list',
        '获取会话列表',
        'retrieving-conversations',
        'Retrieving conversations',
        '获取会话',
      ),
      page(
        'managing-conversations/set-conversation',
        'Set a conversation',
        '设置会话',
        'managing-conversations',
        'Managing conversations',
        '管理会话',
      ),
      page(
        'managing-conversations/set-conversation-draft',
        'Set a conversation draft',
        '设置会话草稿',
        'managing-conversations',
        'Managing conversations',
        '管理会话',
      ),
      page(
        'managing-conversations/manage-read-status',
        'Manage conversation read status',
        '管理会话已读状态',
        'managing-conversations',
        'Managing conversations',
        '管理会话',
      ),
      page(
        'managing-conversations/hide-or-archive-conversation',
        'Hide a conversation',
        '隐藏会话',
        'managing-conversations',
        'Managing conversations',
        '管理会话',
      ),
      page(
        'managing-conversations/delete-or-clear-conversation',
        'Delete or clear a conversation',
        '删除或清空会话',
        'managing-conversations',
        'Managing conversations',
        '管理会话',
      ),
    ],
  },
  {
    segment: 'group',
    title: 'Group',
    label: '群组',
    pages: [
      page('overview-group', 'Group overview', '群组概览'),
      page(
        'creating-and-updating-groups/create-or-update-a-group',
        'Create or update a group',
        '创建或更新群组',
        'creating-and-updating-groups',
        'Creating and updating groups',
        '创建和更新群组',
      ),
      page(
        'retrieving-groups/retrieve-and-search-groups',
        'Retrieve and search groups',
        '获取和搜索群组',
        'retrieving-groups',
        'Retrieving groups',
        '获取群组',
      ),
      page(
        'joining-and-leaving-groups/join-leave-or-dismiss-a-group',
        'Join, leave, or dismiss a group',
        '加入、退出或解散群组',
        'joining-and-leaving-groups',
        'Joining and leaving groups',
        '加入和退出群组',
      ),
      page(
        'managing-group-applications/manage-group-applications',
        'Manage group applications',
        '处理入群申请',
        'managing-group-applications',
        'Managing group applications',
        '管理入群申请',
      ),
      page(
        'retrieving-group-members/retrieve-group-members',
        'Retrieve group members',
        '获取群成员',
        'retrieving-group-members',
        'Retrieving group members',
        '获取群成员',
      ),
      page(
        'managing-group-members/invite-or-remove-group-members',
        'Invite or remove group members',
        '邀请或移除群成员',
        'managing-group-members',
        'Managing group members',
        '管理群成员',
      ),
      page(
        'managing-group-members/update-group-member-info',
        'Update group member information',
        '更新群成员资料和角色',
        'managing-group-members',
        'Managing group members',
        '管理群成员',
      ),
      page(
        'managing-group-members/transfer-group-owner',
        'Transfer group owner',
        '转让群主',
        'managing-group-members',
        'Managing group members',
        '管理群成员',
      ),
      page(
        'moderating-groups/mute-a-group-or-member',
        'Mute a group or member',
        '禁言群组或群成员',
        'moderating-groups',
        'Moderating groups',
        '群组管控',
      ),
    ],
  },
];

const [chatPages, routes, navigation, labels] = await Promise.all([
  readJson('data/structure/chat-pages.json'),
  readJson('src/generated/routes.json'),
  readJson('src/generated/navigation.json'),
  readJson('data/structure/wasm-navigation-labels.json'),
]);

const oldRoutes = routes.filter(
  (route) =>
    route.contextKey === contextKey &&
    (route.path.includes('/channel/') ||
      route.path.includes('/conversation/') ||
      route.path.includes('/group/')),
);
const oldByPath = new Map(oldRoutes.map((route) => [route.path, route]));
const ids = oldRoutes.map((route) => route.id).sort((a, b) => a - b);
const orders = oldRoutes
  .map((route) => route.navOrder)
  .filter(Number.isFinite)
  .sort((a, b) => a - b);
const definitions = sections.flatMap((section) =>
  section.pages.map((item) => ({ ...item, section: section.segment })),
);

if (ids.length < definitions.length || orders.length < definitions.length) {
  throw new Error('Not enough existing WASM domain route slots for migration');
}

const newRoutes = definitions.map((definition, index) => {
  const path = `${rootPath}/${definition.section}/${definition.relativePath}`;
  const existing = oldByPath.get(path);
  return {
    id: existing?.id ?? ids[index],
    path,
    relativePath: path.slice('/docs/'.length),
    sourcePath: path,
    title: definition.title,
    description: `OpenIM WASM SDK guide for ${definition.title}.`,
    product: 'sdk',
    version: 'v4',
    platform: 'wasm',
    contextKey,
    contextTitle: 'SDKs · WASM · v4',
    template: 'guide',
    status: 'draft',
    sourceIndex: orders[index],
    contentFile: `content${path}.mdx`,
    navOrder: orders[index],
  };
});

const nextRoutes = routes
  .filter(
    (route) =>
      route.contextKey !== contextKey ||
      (!route.path.includes('/channel/') &&
        !route.path.includes('/conversation/') &&
        !route.path.includes('/group/')),
  )
  .concat(newRoutes)
  .sort((a, b) => a.id - b.id);

const nextChatPages = chatPages
  .filter(
    (item) =>
      item.context !== contextKey ||
      (!item.openimPath.includes('/channel/') &&
        !item.openimPath.includes('/conversation/') &&
        !item.openimPath.includes('/group/')),
  )
  .concat(
    newRoutes.map((route) => ({
      sourcePath: route.path,
      openimPath: route.path,
      title: route.title,
      context: contextKey,
      template: 'guide',
      contentFile: route.contentFile,
    })),
  );

const context = navigation.contexts.find((item) => item.key === contextKey);
if (!context) throw new Error(`Missing navigation context ${contextKey}`);
const insertionIndex = Math.max(
  0,
  context.nodes.findIndex((node) => ['channel', 'conversation', 'group'].includes(node.segment)),
);
context.nodes = context.nodes.filter(
  (node) => !['channel', 'conversation', 'group'].includes(node.segment),
);
context.nodes.splice(
  insertionIndex,
  0,
  ...sections.map((section) => buildSectionNode(section, newRoutes)),
);

for (const section of sections) {
  labels[section.title] = section.label;
  for (const item of section.pages) {
    labels[item.title] = item.label;
    if (item.folderTitle) labels[item.folderTitle] = item.folderLabel;
  }
}

await Promise.all([
  writeJson('data/structure/chat-pages.json', nextChatPages),
  writeJson('src/generated/routes.json', nextRoutes),
  writeJson('src/generated/navigation.json', navigation),
  writeJson(
    'data/structure/wasm-navigation-labels.json',
    Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))),
  ),
]);

console.log(`Migrated WASM domains to ${newRoutes.length} Conversation/Group routes.`);

function page(relativePath, title, label, folderSegment, folderTitle, folderLabel) {
  return { relativePath, title, label, folderSegment, folderTitle, folderLabel };
}

function buildSectionNode(section, routeList) {
  const children = [];
  const folders = new Map();

  for (const item of section.pages) {
    const path = `${rootPath}/${section.segment}/${item.relativePath}`;
    const route = routeList.find((candidate) => candidate.path === path);
    const pageNode = {
      id: `${section.segment}/${item.relativePath}`,
      segment: item.relativePath.split('/').at(-1),
      title: item.title,
      href: path,
      type: 'page',
      children: [],
      minIndex: route.navOrder,
    };

    if (!item.folderSegment) {
      children.push(pageNode);
      continue;
    }

    let folder = folders.get(item.folderSegment);
    if (!folder) {
      folder = {
        id: `${section.segment}/${item.folderSegment}`,
        segment: item.folderSegment,
        title: item.folderTitle,
        href: null,
        type: 'folder',
        children: [],
        minIndex: route.navOrder,
      };
      folders.set(item.folderSegment, folder);
      children.push(folder);
    }
    folder.children.push(pageNode);
    folder.minIndex = Math.min(folder.minIndex, route.navOrder);
  }

  return {
    id: section.segment,
    segment: section.segment,
    title: section.title,
    href: null,
    type: 'folder',
    children,
    minIndex: Math.min(...children.map((child) => child.minIndex)),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function writeJson(relativePath, value) {
  await writeFile(resolve(root, relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
