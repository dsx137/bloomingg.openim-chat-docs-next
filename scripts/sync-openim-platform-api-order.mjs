import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = process.cwd();
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const localRoot = '/docs/chat/platform-api/v3';
const contextKey = 'chat/platform-api/v3';
const contentRoot = 'content/docs/chat/platform-api/v3';
const zhContentRoot = 'content/zh/docs/chat/platform-api/v3';

const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const platformApiZhPath = resolve(root, 'src/generated/platform-api-zh-content.json');
const structurePath = resolve(root, 'data/structure/chat-pages.json');

const desiredPlatformOrder = [
  'overview',
  'prepare-to-use-api',
  'user',
  'auth',
  'friend',
  'group',
  'conversation',
  'message',
  'third',
];

const linkReplacements = [
  [
    '/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel',
    '/docs/chat/platform-api/v3/group/create-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/inviting-a-user/invite-as-members-channel',
    '/docs/chat/platform-api/v3/group/invite-users-to-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/update-a-group-channel',
    '/docs/chat/platform-api/v3/group/set-group-info',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/delete-a-group-channel',
    '/docs/chat/platform-api/v3/group/dismiss-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/join-a-channel',
    '/docs/chat/platform-api/v3/group/join-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/leave-a-channel',
    '/docs/chat/platform-api/v3/group/quit-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/listing-users/list-members-of-a-group-channel',
    '/docs/chat/platform-api/v3/group/get-group-member-list',
  ],
  ['/docs/chat/platform-api/v3/channel/overview', '/docs/chat/platform-api/v3/group/create-group'],
];

const textReplacements = [
  ['### 群组频道', '### 群组'],
  [
    'OpenIM 使用群组能力承载群聊场景。文档中的“群组频道”概念在这里映射为 OpenIM 群组、群成员和入群申请。',
    'OpenIM 使用群组能力承载群聊场景。服务端可通过群组接口创建群组、邀请成员和处理入群流程。',
  ],
  [
    '[创建群组频道](/docs/chat/platform-api/v3/group/create-group)',
    '[创建群组](/docs/chat/platform-api/v3/group/create-group)',
  ],
  [
    '[频道概览](/docs/chat/platform-api/v3/group/create-group)',
    '[群组接口](/docs/chat/platform-api/v3/group/create-group)',
  ],
];

await Promise.all([
  rm(resolve(root, `${contentRoot}/channel`), { force: true, recursive: true }),
  rm(resolve(root, `${zhContentRoot}/channel`), { force: true, recursive: true }),
]);

const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
const platformApiZh = JSON.parse(await readFile(platformApiZhPath, 'utf8'));

const nextRoutes = routes
  .filter(
    (route) =>
      !route.path.startsWith(`${localRoot}/channel/`) && route.path !== `${localRoot}/channel`,
  )
  .map((route, index) => ({ ...route, id: index + 1 }));

const platformContext = navigation.contexts.find((context) => context.key === contextKey);
if (!platformContext) {
  throw new Error(`Missing navigation context: ${contextKey}`);
}

platformContext.nodes = reorderPlatformNodes(
  platformContext.nodes.filter((node) => node.id !== 'channel'),
);
platformContext.pageCount = nextRoutes.filter((route) => route.contextKey === contextKey).length;

platformApiZh.generatedAt = today;
delete platformApiZh.navigationLabels?.channel;

await Promise.all([
  writeFile(routesPath, `${JSON.stringify(nextRoutes, null, 2)}\n`, 'utf8'),
  writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8'),
  writeFile(platformApiZhPath, `${JSON.stringify(platformApiZh, null, 2)}\n`, 'utf8'),
  writeFile(
    structurePath,
    `${JSON.stringify(
      nextRoutes.map((route) => ({
        sourcePath: route.sourcePath,
        openimPath: route.path,
        title: route.title,
        context: route.contextKey,
        template: route.template,
        contentFile: route.contentFile,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  ),
]);

await rewritePlatformContent(resolve(root, contentRoot));
await rewritePlatformContent(resolve(root, zhContentRoot));

console.log('Removed OpenIM Platform API channel pages and reordered platform navigation.');

function reorderPlatformNodes(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered = desiredPlatformOrder.map((id) => byId.get(id)).filter(Boolean);
  const orderedIDs = new Set(desiredPlatformOrder);
  const remainder = nodes.filter((node) => !orderedIDs.has(node.id));
  return [...ordered, ...remainder];
}

async function rewritePlatformContent(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) {
        await rewritePlatformContent(file);
        return;
      }
      if (!entry.isFile() || !entry.name.endsWith('.mdx')) return;

      const original = await readFile(file, 'utf8');
      let next = original;
      for (const [from, to] of linkReplacements) {
        next = next.split(from).join(to);
      }
      for (const [from, to] of textReplacements) {
        next = next.split(from).join(to);
      }
      if (next !== original) {
        await writeFile(file, next, 'utf8');
      }
    }),
  );
}
