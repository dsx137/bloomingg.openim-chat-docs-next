import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routesPath = resolve(root, 'src/generated/routes.json');
const localizedPath = resolve(root, 'src/generated/wasm-sdk-zh-content.json');
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const wasmRoutes = routes.filter((route) => route.contextKey === 'chat/sdk/v4/wasm');

const errors = [];
const formalCandidateRoutes = [];
let localized;

const formalGuideHeadings = [
  '## 能力边界',
  '## 接入准备',
  '## 使用方式',
  '## 实现流程',
  '## 状态同步',
  '## 验证与排查',
  '## 下一步',
];

const formalBannedPatterns = [
  /This draft/i,
  /Support status/i,
  /Sendbird/i,
  /占位/,
  /草稿/,
  /本段说明/,
  /building blocks/i,
  /不提供.*等价/,
  /没有.*公开 API/,
];

const localizedBannedPatterns = [
  /@openim\/wasm-client-sdk@\d/,
  /\/openim\/(?:openIM\.wasm|sql-wasm\.wasm|wasm_exec\.js)/,
  /public\/openim/,
  /No public OpenIM WASM SDK method in `@openim\/wasm-client-sdk@/i,
  /This draft uses public signatures/i,
  /开放频道/,
  /频道 URL/,
  /按名称、URL/,
];

try {
  localized = JSON.parse(await readFile(localizedPath, 'utf8'));
} catch {
  errors.push('Missing generated Chinese WASM SDK content file.');
}

const pages = localized?.pages ?? {};
if (Object.keys(pages).length !== wasmRoutes.length) {
  errors.push(
    `Chinese WASM SDK pages: expected ${wasmRoutes.length}, found ${Object.keys(pages).length}.`,
  );
}

for (const route of wasmRoutes) {
  const page = pages[route.path];
  const source = await readFile(resolve(root, route.contentFile), 'utf8');
  const formalCandidate = isFormalCandidate(source);
  const manualPageExists = await hasManualWasmPage(route.path);
  if (formalCandidate) formalCandidateRoutes.push(route);

  if (!page) {
    errors.push(`Missing Chinese WASM SDK page: ${route.path}`);
    continue;
  }
  if (!containsCjk(page.title)) errors.push(`${route.path}: title is not localized.`);
  if (!containsCjk(page.description)) errors.push(`${route.path}: description is not localized.`);
  if (!containsCjk(page.body)) errors.push(`${route.path}: body is not localized.`);
  if (!manualPageExists && hasTypeScriptFence(source) && !hasTypeScriptFence(page.body))
    errors.push(`${route.path}: TypeScript code fences were not kept.`);

  for (const pattern of localizedBannedPatterns) {
    if (pattern.test(page.body)) {
      errors.push(`${route.path}: localized SDK page contains stale path or version copy.`);
      break;
    }
  }

  if (formalCandidate && !manualPageExists && !isSpecialSdkGuide(route)) {
    for (const heading of formalGuideHeadings) {
      if (!page.body.includes(heading)) {
        errors.push(`${route.path}: formal SDK guide is missing heading ${heading}.`);
      }
    }
    for (const pattern of formalBannedPatterns) {
      if (pattern.test(page.body)) {
        errors.push(`${route.path}: formal SDK guide still contains draft or migration copy.`);
        break;
      }
    }
  }

  if (
    page &&
    (route.path.includes('/user/retrieving-users/') ||
      route.path.includes('/user/managing-friends/') ||
      route.path.endsWith('/channel/retrieving-channels/retrieve-group-members')) &&
    /^##\s+OpenIM\./m.test(page.body)
  ) {
    errors.push(`${route.path}: Chinese page should not use OpenIM.<method> as a section heading.`);
  }
}

const overview = pages['/docs/chat/sdk/v4/wasm/overview'];
if (overview) {
  if (!overview.title.includes('WASM SDK')) {
    errors.push('Overview title should still identify WASM SDK.');
  }
  if (!overview.body.includes('## 接入准备') && !overview.body.includes('## 接入模型'))
    errors.push('Overview body should contain a Chinese setup heading.');
  if (!overview.body.includes('## 使用方式') && !overview.body.includes('## 当前能力页'))
    errors.push('Overview body should contain a Chinese usage heading.');
}

const firstMessage = pages['/docs/chat/sdk/v4/wasm/getting-started/send-first-message'];
if (firstMessage) {
  if (!firstMessage.title.includes('发送第一条消息') && !firstMessage.title.includes('接入流程')) {
    errors.push('Send first message title should be localized.');
  }
  if (!firstMessage.body.includes('创建消息对象') && !firstMessage.body.includes('创建消息')) {
    errors.push('Send first message body should localize the implementation guidance.');
  }
  if (
    /接收方可以是.*群组中的成员/.test(firstMessage.body) ||
    /群聊场景下当前用户是目标群成员/.test(firstMessage.body)
  ) {
    errors.push('Send first message should not describe group chat as targeting a receiver user.');
  }
}

try {
  const firstMessageMdx = await readFile(
    resolve(root, 'content/zh/docs/chat/sdk/v4/wasm/getting-started/send-first-message.mdx'),
    'utf8',
  );
  if (
    /接收方可以是.*群组中的成员/.test(firstMessageMdx) ||
    /群聊场景下当前用户是目标群成员/.test(firstMessageMdx) ||
    /memberUserIDs:\s*\[\s*['"]user_b['"]\s*]/.test(firstMessageMdx)
  ) {
    errors.push('Chinese send-first-message MDX still implies group messages target a receiver user.');
  }
} catch {
  errors.push('Missing Chinese send-first-message MDX file.');
}

const applicationUsers =
  pages['/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-a-list-of-users-in-an-application'];
if (applicationUsers) {
  if (!applicationUsers.body.includes('## 查询公开资料')) {
    errors.push('Application users page should use the formal public-profile lookup section.');
  }
  if (/^##\s+OpenIM\./m.test(applicationUsers.body)) {
    errors.push('Application users page should not use OpenIM.<method> as a section heading.');
  }
  if (
    !applicationUsers.body.includes('#### 请求参数') ||
    !applicationUsers.body.includes('#### 返回值')
  ) {
    errors.push('Application users page should include OpenIM request and response sections.');
  }
  for (const required of [
    '`WsResponse<PublicUserItem[]>`',
    '`userID`',
    '`nickname`',
    '`faceURL`',
    '`ex`',
  ]) {
    if (!applicationUsers.body.includes(required)) {
      errors.push(`Application users page is missing real getUsersInfo return field ${required}.`);
      break;
    }
  }
  if (
    /`userIdsFilter`|`nicknameStartsWithFilter`|`metaDataKeyFilter`|`metaDataValuesFilter`/.test(
      applicationUsers.body,
    )
  ) {
    errors.push('Application users page should not document Sendbird query filters as OpenIM fields.');
  }
  if (!applicationUsers.body.includes('搜索添加好友')) {
    errors.push('Application users page should describe search-to-add-friend usage.');
  }
  if (!applicationUsers.body.includes('showName')) {
    errors.push('Application users page should explain that conversation titles use showName.');
  }
  if (
    /const\s+\{\s*data(?::\s*\w+)?[^}]*\}\s*=\s*await\s+OpenIM\.getUsersInfo/.test(
      applicationUsers.body,
    )
  ) {
    errors.push('Application users page should not destructure getUsersInfo directly at await.');
  }
  if (/会话标题补全|补齐单聊会话标题等场景/.test(applicationUsers.body)) {
    errors.push('Application users page should not present getUsersInfo as conversation-title fill.');
  }
  if (
    /Provide a 可信后端|Use Platform API|When the page describes|Confirm the 后端/.test(
      applicationUsers.body,
    )
  ) {
    errors.push('Application users page still contains mixed English/Chinese fallback copy.');
  }
}

const friendList =
  pages['/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-a-list-of-friends'];
if (friendList) {
  if (!friendList.body.includes('## 分页读取好友列表')) {
    errors.push('Friend list page should use the formal paginated friend-list section.');
  }
  if (/^##\s+OpenIM\./m.test(friendList.body)) {
    errors.push('Friend list page should not use OpenIM.<method> as a section heading.');
  }
  if (!friendList.body.includes('#### 请求参数') || !friendList.body.includes('#### 返回值')) {
    errors.push('Friend list page should include OpenIM request and response sections.');
  }
  for (const required of [
    '`WsResponse<FriendUserItem[]>`',
    'FriendUserItem',
    '`offset`',
    '`count`',
    '`remark`',
    '`isPinned`',
    '`attachedInfo`',
    '## 搜索好友',
    'searchFriends()',
    '`isSearchUserID`',
    '`isSearchNickname`',
    '`isSearchRemark`',
    'CbEvents.OnFriendInfoChanged',
  ]) {
    if (!friendList.body.includes(required)) {
      errors.push(`Friend list page is missing real getFriendListPage detail ${required}.`);
      break;
    }
  }
  if (/getFriendList\(/.test(friendList.body)) {
    errors.push('Friend list page should use getFriendListPage instead of getFriendList.');
  }
  if (/OnBlackAdded|OnBlackDeleted/.test(friendList.body)) {
    errors.push('Friend list page should not refresh from blacklist events.');
  }
  if (/不是应用级用户搜索|不会返回非好友用户|不适合作为.*应用级用户搜索/.test(friendList.body)) {
    errors.push('Friend list page should describe scope through use cases, not negative search phrasing.');
  }
  if (
    friendList.body.includes('## OpenIM 模型') ||
    friendList.body.includes('## 前置条件') ||
    friendList.body.includes('## 故障排查')
  ) {
    errors.push('Friend list page should not use the generic SDK guide structure.');
  }
}

const friendRequests =
  pages['/docs/chat/sdk/v4/wasm/user/managing-friends/manage-friend-requests'];
if (friendRequests) {
  for (const required of [
    '## 发送好友申请',
    '#### 请求参数',
    '#### 返回值',
    '`WsResponse<unknown>`',
    '## 查询申请列表',
    '`WsResponse<FriendApplicationItem[]>`',
    '## 未处理申请数量',
    '## 处理好友申请',
    'CbEvents.OnFriendApplicationAdded',
    'CbEvents.OnFriendApplicationAccepted',
    'CbEvents.OnFriendApplicationRejected',
    'CbEvents.OnFriendApplicationDeleted',
    'CbEvents.OnFriendAdded',
  ]) {
    if (!friendRequests.body.includes(required)) {
      errors.push(`Friend request page is missing required formal detail ${required}.`);
      break;
    }
  }
  if (!/catch\s*\(error\)/.test(friendRequests.body)) {
    errors.push('Friend request page should show SDK rejection handling.');
  }
}

const updateOrDeleteFriends =
  pages['/docs/chat/sdk/v4/wasm/user/managing-friends/update-or-delete-friends'];
if (updateOrDeleteFriends) {
  for (const required of [
    '## 更新好友关系资料',
    '#### 请求参数',
    '#### 返回值',
    '`WsResponse<unknown>`',
    '`friendUserIDs`',
    '## 删除好友关系',
    'CbEvents.OnFriendInfoChanged',
    'CbEvents.OnFriendDeleted',
  ]) {
    if (!updateOrDeleteFriends.body.includes(required)) {
      errors.push(`Update/delete friends page is missing required formal detail ${required}.`);
      break;
    }
  }
  if (!/catch\s*\(error\)/.test(updateOrDeleteFriends.body)) {
    errors.push('Update/delete friends page should show SDK rejection handling.');
  }
}

const retrievingUsersExpectations = {
  '/docs/chat/sdk/v4/wasm/user/methods/get-users-info': {
    title: '批量获取用户资料',
    required: ['## 功能介绍', '## 输入参数', '## 返回结果'],
  },
  '/docs/chat/sdk/v4/wasm/user/friend/methods/get-friend-list-page': {
    title: '分页获取好友列表',
    required: ['## 功能介绍', '## 输入参数', '## 返回结果'],
  },
  '/docs/chat/sdk/v4/wasm/user/friend/methods/get-specified-friends-info': {
    title: '获取指定好友资料',
    required: ['## 功能介绍', '## 输入参数', '## 返回结果'],
  },
};

const userOverview = pages['/docs/chat/sdk/v4/wasm/user/overview-user'];
if (userOverview && !userOverview.body.includes('ConversationItem.showName')) {
  errors.push('User overview should explain that conversation titles use ConversationItem.showName.');
}

const latestParticipants =
  pages[
    '/docs/chat/sdk/v4/wasm/user/retrieving-and-updating-user-information/retrieve-the-latest-information-on-participants'
  ];
if (latestParticipants && !latestParticipants.body.includes('showName')) {
  errors.push('Latest participant information page should explain that conversation titles use showName.');
}

const retrievingUsersBannedPatterns = [
  /频道用户/,
  /频道中的用户/,
  /运营者/,
  /获取应用中的用户列表/,
  /应用中的用户列表/,
  /ApplicationUserListQuery/,
  /本段说明/,
  /Sendbird/i,
  /getGroupMemberOwnerAndAdmin/,
  /会话标题补全/,
];

const userManualCopyBannedPatterns = [
  [/补齐 OpenIM 公开资料/, 'use “读取/展示公开资料” instead of “补齐” for getUsersInfo.'],
  [
    /返回的是应用用户资料，不是好友关系资料，也不是群成员资料/,
    'describe getUsersInfo data sources through positive scope wording.',
  ],
  [/没有用于修改任意用户资料/, 'describe profile management through backend/admin scope.'],
  [
    /不会改变该用户在其他群组或单聊中的状态/,
    'describe group mute boundaries without negative carry-over wording.',
  ],
  [
    /不要用账号级公开资料覆盖群内展示信息/,
    'describe group-member display data as the preferred source.',
  ],
  [
    /removeBlack\(\) 的第一个参数是目标用户 ID 字符串，不是对象/,
    'state removeBlack arguments directly without object-vs-string correction copy.',
  ],
  [/获取被禁言用户列表/, 'use 获取被禁言成员列表 for group-member mute lists.'],
  [/拉黑和取消拉黑其他成员/, 'use 拉黑和取消拉黑其他用户 for account blacklist actions.'],
  [/获取频道成员在线状态|群聊频道成员|按频道配置/, 'avoid channel terminology in OpenIM user docs.'],
];

for (const [path, expectation] of Object.entries(retrievingUsersExpectations)) {
  const page = pages[path];
  if (!page) {
    errors.push(`Missing retrieving-users Chinese page: ${path}`);
    continue;
  }
  if (page.title !== expectation.title) {
    errors.push(`${path}: expected title ${expectation.title}, found ${page.title}.`);
  }
  for (const heading of expectation.required) {
    if (!page.body.includes(heading)) {
      errors.push(`${path}: missing required section ${heading}.`);
    }
  }
  for (const pattern of retrievingUsersBannedPatterns) {
    if (pattern.test(`${page.title}\n${page.description}\n${page.body}`)) {
      errors.push(`${path}: retrieving-users page contains stale terminology (${pattern}).`);
      break;
    }
  }

  try {
    const manual = await readFile(
      resolve(root, 'content/zh', `${path.slice(1)}.mdx`),
      'utf8',
    );
    for (const pattern of retrievingUsersBannedPatterns) {
      if (pattern.test(manual)) {
        errors.push(`${path}: manual retrieving-users MDX contains stale terminology (${pattern}).`);
        break;
      }
    }
  } catch {
    errors.push(`${path}: missing manual retrieving-users MDX file.`);
  }
}

const specifiedFriendPage =
  pages['/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-friend-information'];
if (specifiedFriendPage && /不是应用用户搜索接口/.test(specifiedFriendPage.body)) {
  errors.push('Specified friend page should not describe the API as not an application-user search.');
}
if (specifiedFriendPage && !specifiedFriendPage.body.includes('CbEvents.OnFriendAdded')) {
  errors.push('Specified friend page should include OnFriendAdded in synchronization events.');
}

for (const route of wasmRoutes.filter((route) => route.path.includes('/user/'))) {
  let manual;
  let manualFrontmatter;
  try {
    manual = await readFile(resolve(root, 'content/zh', `${route.path.slice(1)}.mdx`), 'utf8');
    manualFrontmatter = parseMdx(manual).frontmatter;
  } catch {
    continue;
  }

  const generatedPage = pages[route.path];
  if (generatedPage) {
    const manualTitle = manualFrontmatter.title;
    if (manualTitle && generatedPage.title !== manualTitle) {
      errors.push(
        `${route.path}: generated Chinese user page title should match manual MDX title ${manualTitle}.`,
      );
    }

    const generatedText = `${generatedPage.title}\n${generatedPage.description}\n${generatedPage.body}`;
    for (const [pattern, message] of userManualCopyBannedPatterns) {
      if (pattern.test(generatedText)) {
        errors.push(`${route.path}: generated user content needs copy cleanup: ${message}`);
        break;
      }
    }
  }

  for (const [pattern, message] of userManualCopyBannedPatterns) {
    if (pattern.test(manual)) {
      errors.push(`${route.path}: manual user MDX needs copy cleanup: ${message}`);
      break;
    }
  }
}

const groupMembersPage =
  pages['/docs/chat/sdk/v4/wasm/channel/retrieving-channels/retrieve-group-members'];
if (groupMembersPage) {
  if (groupMembersPage.title !== '获取群成员列表') {
    errors.push('Group members page should be localized as 获取群成员列表.');
  }
  for (const required of [
    '## 分页读取群成员',
    '## 获取指定群成员',
    '## 搜索群成员',
    '`GroupMemberItem`',
  ]) {
    if (!groupMembersPage.body.includes(required)) {
      errors.push(`Group members page is missing required content ${required}.`);
      break;
    }
  }
  if (/getGroupMemberOwnerAndAdmin|运营者/.test(groupMembersPage.body)) {
    errors.push('Group members page should not mention getGroupMemberOwnerAndAdmin or operators.');
  }
}

if (errors.length > 0) {
  console.error(`Chinese WASM SDK content check failed: ${errors.length}`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  if (errors.length > 50) console.error(`  ... ${errors.length - 50} additional errors omitted`);
  process.exitCode = 1;
} else {
  console.log(
    `Chinese WASM SDK content check passed (${wasmRoutes.length} pages, ${formalCandidateRoutes.length} formal candidates).`,
  );
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(value ?? '');
}

function hasTypeScriptFence(value) {
  return /```(?:ts|typescript)\b/i.test(value ?? '');
}

function isFormalCandidate(source) {
  return ![
    /No public OpenIM WASM SDK method/,
    /there is no public WASM SDK API equivalent/,
    /does not expose/,
    /server-owned/,
    /server-side/,
    /backend feature/,
    /authoritative action should run on your backend/,
    /trusted backend/,
    /Platform API layer/,
    /covers part of this workflow/,
    /remaining behavior belongs/,
  ].some((pattern) => pattern.test(source));
}

function isSpecialSdkGuide(route) {
  if (route.path.includes('/user/')) return true;
  if (route.path.includes('/user/retrieving-users/')) return true;
  if (route.path.endsWith('/channel/retrieving-channels/retrieve-group-members')) return true;
  if (route.path.endsWith('/user/overview-user')) return true;
  if (
    route.path.endsWith(
      '/user/retrieving-and-updating-user-information/retrieve-the-latest-information-on-participants',
    )
  ) {
    return true;
  }

  return [
    '/user/retrieving-users/retrieve-a-list-of-users-in-an-application',
    '/user/retrieving-users/retrieve-a-list-of-friends',
    '/user/retrieving-users/retrieve-friend-information',
    '/user/retrieving-users/retrieve-a-paginated-list-of-friends',
    '/user/managing-friends/manage-friend-requests',
    '/user/managing-friends/update-or-delete-friends',
    '/message/sending-a-message/create-media-and-rich-messages',
    '/message/managing-a-message/insert-a-local-message',
  ].some((suffix) => route.path.endsWith(suffix));
}

async function hasManualWasmPage(routePath) {
  try {
    await readFile(resolve(root, 'content/zh', `${routePath.slice(1)}.mdx`), 'utf8');
    return true;
  } catch {
    return false;
  }
}

function parseMdx(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = {};
  if (!match) return { body: source.trim(), frontmatter };

  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!key || !raw) continue;
    try {
      frontmatter[key] = JSON.parse(raw);
    } catch {
      frontmatter[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }

  return {
    body: source.slice(match?.[0].length ?? 0).trim(),
    frontmatter,
  };
}
