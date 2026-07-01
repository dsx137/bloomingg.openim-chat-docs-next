import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const outputPath = resolve(root, 'src/generated/wasm-sdk-zh-content.json');

async function main() {
  const routes = JSON.parse(await readFile(resolve(root, 'src/generated/routes.json'), 'utf8'));
  const wasmRoutes = routes
    .filter((route) => route.contextKey === 'chat/sdk/v4/wasm')
    .sort((a, b) => a.navOrder - b.navOrder || a.sourceIndex - b.sourceIndex);

  const pages = {};

  for (const route of wasmRoutes) {
    const source = await readFile(resolve(root, route.contentFile), 'utf8');
    const { body, frontmatter } = parseMdx(source);
    const title = normalizeOpenImTerminology(translateTitle(route.title, route.path));
    const formalCandidate = isFormalCandidate(source);
    const specialBody = localizeSpecialSdkGuide(route, title);
    const generatedBody =
      specialBody ??
      (formalCandidate
        ? localizeFormalSdkGuide(body, route, title)
        : localizeBody(body, route, title));
    const localizedBody = normalizeLocalizedBody(generatedBody);
    pages[route.path] = {
      body: localizedBody,
      description: normalizeOpenImTerminology(
        specialBody
          ? specialDescription(route, title)
          : formalCandidate
            ? formalDescription(route, title)
            : `OpenIM WASM SDK 的${title}指南，包含 API 签名、使用细节和验证步骤。`,
      ),
      headings: extractHeadings(localizedBody),
      sourcePath: frontmatter.sourcePath ?? route.path,
      title,
    };
  }

  const output = {
    sourceContext: 'chat/sdk/v4/wasm',
    sourceRoot: 'content/docs/chat/sdk/v4/wasm',
    pageCount: wasmRoutes.length,
    navigationLabels: Object.fromEntries(
      Object.entries(navigationLabels).map(([key, value]) => [
        key,
        normalizeOpenImTerminology(value),
      ]),
    ),
    pages,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote Chinese WASM SDK content (${wasmRoutes.length} pages).`);
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
    if (!raw) continue;
    try {
      frontmatter[key] = JSON.parse(raw);
    } catch {
      frontmatter[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }

  return { body: source.slice(match[0].length).trim(), frontmatter };
}

function localizeBody(body, route, title) {
  const sections = splitSections(body);
  const parts = [];

  parts.push('## 概览', '', overviewText(route, title), '', sdkVersionNotice(body), '');
  parts.push('## OpenIM 模型', '', modelText(route, title, body), '', supportStatus(body), '');
  parts.push('需要明确的核心概念：', '', ...coreConcepts(), '');
  parts.push(
    '## 前置条件',
    '',
    ...translateListSection(sections.get('Prerequisites') ?? '', route),
    '',
  );
  parts.push(
    '## API 签名',
    '',
    ...translateApiSection(sections.get('API signatures') ?? '', route),
    '',
  );
  parts.push(
    '## 实现步骤',
    '',
    ...translateImplementationSection(sections.get('Implementation') ?? '', route, title),
    '',
  );
  parts.push(
    '## 返回数据和事件',
    '',
    ...translateReturnedDataSection(sections.get('Returned data and events') ?? '', route),
    '',
  );
  parts.push(
    '## 验证结果',
    '',
    ...translateVerifySection(sections.get('Verify the result') ?? '', route),
    '',
  );
  parts.push(
    '## 故障排查',
    '',
    ...translateTroubleshootingSection(sections.get('Troubleshooting') ?? ''),
    '',
  );
  parts.push('## 下一步', '', ...translateNextSteps(sections.get('Next steps') ?? ''), '');

  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function localizeSpecialSdkGuide(route, title) {
  if (route.path.endsWith('/user/retrieving-users/retrieve-a-list-of-users-in-an-application')) {
    return applicationUserListGuide(title);
  }
  return undefined;
}

function specialDescription(route, title) {
  if (route.path.endsWith('/user/retrieving-users/retrieve-a-list-of-users-in-an-application')) {
    return '说明 OpenIM WASM SDK 在应用级用户列表查询中的能力边界，以及如何通过已知用户 ID、好友搜索和可信后端实现用户目录。';
  }
  return `OpenIM WASM SDK 的${title}指南。`;
}

function applicationUserListGuide(title) {
  return [
    `在 OpenIM 中，${title}这类能力不应由浏览器端 WASM SDK 直接执行。WASM SDK 适合在已经知道 ` +
      '`userID`' +
      ' 的情况下读取公开资料，或读取当前用户可见的好友、群成员等关系数据；应用级用户目录、全量分页和跨用户筛选应放在可信后端。',
    '',
    '如果你已经有一组目标用户 ID，可以在浏览器端调用 `getUsersInfo()` 获取公开资料：',
    '',
    ':::code-tabs',
    '```javascript title="JavaScript"',
    "const { data: users, errCode, errMsg } = await OpenIM.getUsersInfo(['user_a', 'user_b']);",
    '',
    'if (errCode !== 0) {',
    "  throw new Error(errMsg || 'Failed to retrieve users.');",
    '}',
    '',
    'renderUsers(users);',
    '```',
    '',
    '```ts title="TypeScript"',
    'type OpenIMUserSummary = {',
    '  userID: string;',
    '  nickname?: string;',
    '  faceURL?: string;',
    '};',
    '',
    'const { data: users, errCode, errMsg } = await OpenIM.getUsersInfo([',
    "  'user_a',",
    "  'user_b',",
    ']);',
    '',
    'if (errCode !== 0) {',
    "  throw new Error(errMsg || 'Failed to retrieve users.');",
    '}',
    '',
    'renderUsers(users as OpenIMUserSummary[]);',
    '```',
    ':::',
    '',
    '需要应用级分页、昵称搜索或运营后台用户目录时，前端应调用你自己的后端接口，再由后端使用 OpenIM Platform API，例如 [查询用户列表](/docs/chat/platform-api/v3/user/listing-users/list-users) 或 [获取用户](/docs/chat/platform-api/v3/user/listing-users/get-a-user)。管理员 token 只能保存在后端，不能下发到浏览器。',
    '',
    '---',
    '',
    '## ApplicationUserListQuery',
    '',
    'Sendbird JavaScript SDK 使用 `ApplicationUserListQuery` 在客户端构造应用级用户查询。OpenIM WASM SDK 没有等价的客户端查询对象；在 OpenIM 中应把这类查询拆成两类：浏览器端读取已知用户资料，后端负责应用级目录查询和筛选。',
    '',
    '#### 参数列表',
    '',
    ...renderMarkdownTable(
      ['参数名', '类型', '说明', 'OpenIM 对应方式'],
      [
        [
          '`userIdsFilter`',
          '`string[]`',
          '限定返回指定用户 ID。',
          '浏览器端使用 `getUsersInfo(userIDList)`，适合已知 ID 的资料补全。',
        ],
        [
          '`nicknameStartsWithFilter`',
          '`string`',
          '按昵称前缀过滤用户。',
          '应用级昵称搜索放在后端实现；WASM 的 `searchFriends()` 只适用于当前用户好友范围。',
        ],
        [
          '`metaDataKeyFilter`',
          '`string`',
          '按用户元数据键过滤。',
          'WASM SDK 不提供应用级元数据检索；请在业务用户表或后端索引中实现。',
        ],
        [
          '`metaDataValuesFilter`',
          '`string[]`',
          '配合元数据键按多个值过滤。',
          '由后端根据业务字段过滤，再返回允许当前用户查看的用户列表。',
        ],
        [
          '`limit`',
          '`number`',
          '每页返回数量。',
          'OpenIM Platform API 使用 `pagination.pageNumber` 和 `pagination.showNumber` 分页。',
        ],
      ],
    ),
    '',
    '当前用户好友范围内的搜索可以直接使用 WASM SDK：',
    '',
    ':::code-tabs',
    '```javascript title="JavaScript"',
    'const { data: friends } = await OpenIM.searchFriends({',
    '  keywordList: [query],',
    '  isSearchUserID: true,',
    '  isSearchNickname: true,',
    '  isSearchRemark: true,',
    '});',
    '',
    'renderUsers(friends);',
    '```',
    '',
    '```ts title="TypeScript"',
    'const { data: friends, errCode, errMsg } = await OpenIM.searchFriends({',
    '  keywordList: [query],',
    '  isSearchUserID: true,',
    '  isSearchNickname: true,',
    '  isSearchRemark: true,',
    '});',
    '',
    'if (errCode !== 0) {',
    "  throw new Error(errMsg || 'Failed to search friends.');",
    '}',
    '',
    'renderUsers(friends);',
    '```',
    ':::',
    '',
    '应用级目录查询应通过后端封装，前端只接收经过鉴权、脱敏和分页处理后的结果：',
    '',
    '```ts',
    'async function listApplicationUsers(params: {',
    '  keyword?: string;',
    '  pageNumber: number;',
    '  showNumber: number;',
    '}) {',
    "  const response = await fetch('/api/openim/users', {",
    "    method: 'POST',",
    "    headers: { 'Content-Type': 'application/json' },",
    '    body: JSON.stringify(params),',
    '  });',
    '',
    '  if (!response.ok) {',
    "    throw new Error('Failed to retrieve application users.');",
    '  }',
    '',
    '  return response.json();',
    '}',
    '```',
  ].join('\n');
}

function localizeFormalSdkGuide(body, route, title) {
  const sections = splitSections(body);
  const implementation = sections.get('Implementation') ?? '';
  const implementationCodeBlocks = extractCodeBlocks(implementation);
  const taskCodeBlocks =
    implementationCodeBlocks.length > 1
      ? implementationCodeBlocks.slice(1)
      : implementationCodeBlocks;
  const hasTaskCode = taskCodeBlocks.length > 0;

  const parts = [];
  parts.push('## 概览', '', formalOverview(route, title), '');
  parts.push('## 与 OpenIM 的对应关系', '', ...formalOpenImMapping(route, title), '');
  parts.push('## 前置条件', '', ...formalPrerequisites(route), '');
  parts.push(
    '## API 签名',
    '',
    ...translateApiSection(sections.get('API signatures') ?? '', route),
    '',
  );
  parts.push('## 安装和配置', '', ...formalInstallAndConfigure(), '');
  parts.push('## 初始化 SDK', '', ...formalInitializeSdk(), '');
  parts.push(
    '## 实现步骤',
    '',
    `下面的步骤以${title}为目标，代码中的用户、群组、会话和消息 ID 需要替换为你业务中的真实值。`,
    '',
    '### 1. 准备应用状态',
    '',
    ...formalPrepareState(route),
    '',
    '### 2. 调用 SDK API',
    '',
    hasTaskCode
      ? '使用本页 API 签名中列出的公开方法完成核心操作。'
      : `在完成初始化和登录后，根据业务状态调用对应的 OpenIM SDK API 完成${title}。`,
    '',
    ...renderCodeBlocks(taskCodeBlocks),
    '',
    '### 3. 处理结果和事件',
    '',
    ...formalHandleResult(route),
    '',
  );
  parts.push(
    '## 验证结果',
    '',
    ...formalVerify(route, sections.get('Verify the result') ?? ''),
    '',
  );
  parts.push(
    '## 故障排查',
    '',
    ...translateTroubleshootingSection(sections.get('Troubleshooting') ?? ''),
    '',
  );
  parts.push('## 下一步', '', ...translateNextSteps(sections.get('Next steps') ?? ''), '');

  return parts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeLocalizedBody(body) {
  return normalizeOpenImTerminology(body)
    .replaceAll('/openim/openIM.wasm', '/openIM.wasm')
    .replaceAll('/openim/sql-wasm.wasm', '/sql-wasm.wasm')
    .replaceAll('/openim/wasm_exec.js', '/wasm_exec.js')
    .replaceAll('public/openim/', 'public/')
    .replaceAll('public/openim', 'public')
    .replace(
      /No public OpenIM WASM SDK method in `@openim\/wasm-client-sdk@[^`]+` directly implements this Sendbird feature\./g,
      'OpenIM WASM SDK 没有直接实现该 Sendbird 功能的公开方法。',
    )
    .replace(
      /This \w+ uses public signatures from `@openim\/wasm-client-sdk@[^`]+`\./g,
      '示例使用 OpenIM WASM SDK 的公开接口，并假定 SDK 版本与 OpenIM Server 兼容。',
    )
    .replace(
      /Install `@openim\/wasm-client-sdk@[^`]+` or a compatible OpenIM WASM SDK version\./g,
      '安装与 OpenIM Server 兼容的 `@openim/wasm-client-sdk` 版本。',
    )
    .replace(/`@openim\/wasm-client-sdk@[^`]+`/g, '`@openim/wasm-client-sdk`');
}

function normalizeOpenImTerminology(value) {
  return value
    .replaceAll('开放频道', '群组')
    .replaceAll('开放房间', '群组')
    .replaceAll('频道 URL', '群组 ID')
    .replaceAll('通过 URL 获取频道', '通过 ID 获取群组或会话')
    .replaceAll('按名称、URL 或', '按名称、ID 或')
    .replaceAll('URL 或自定义类型', 'ID 或自定义类型')
    .replaceAll('URL 或多种过滤条件', 'ID 或多种过滤条件')
    .replaceAll('Do not port Sendbird open-channel calls one for one. Model public rooms as groups or own discovery in your 后端.', '不要照搬外部文档中的公开聊天室模型；在 OpenIM 中请使用群组，或由业务后端维护发现和加入规则。')
    .replaceAll('Join public room', '申请加入群组')
    .replaceAll('public room', 'group')
    .replaceAll('public rooms', 'groups');
}

function formalDescription(route, title) {
  if (route.path.endsWith('/overview')) {
    return 'OpenIM WASM SDK 的正式接入指南，覆盖安装、初始化、认证、消息收发、事件处理和常见故障排查。';
  }
  return `面向生产接入的 OpenIM WASM SDK ${title}指南，覆盖前置条件、API 签名、实现步骤、返回数据和验证方法。`;
}

function formalOverview(route, title) {
  if (route.path.endsWith('/overview')) {
    return 'OpenIM WASM SDK 运行在浏览器环境中，通过 WASM 包连接 OpenIM Server，提供用户登录、会话、群组、消息、事件回调和本地缓存能力。本文面向正式接入场景，说明如何完成最小可用初始化，并把后续功能页串成一条可验证的客户端接入路径。';
  }
  if (route.path.endsWith('/send-first-message')) {
    return '本页演示从浏览器客户端登录 OpenIM、创建文本消息对象、发送到单聊或群组会话，并通过事件回调确认另一端收到消息的完整流程。';
  }
  if (route.path.includes('/sending-a-message/send-a-message')) {
    return '本页说明如何创建 OpenIM 消息对象，并通过 `sendMessage()` 发送文本、文件、自定义或富文本消息。示例保留单聊和群聊都需要关注的 `recvID`、`groupID` 与 `MessageItem` 关系。';
  }
  if (route.path.includes('/receiving-messages-through-event-handler')) {
    return '本页说明如何注册消息事件处理器，在浏览器端接收 OpenIM 推送的新消息，并把事件数据合并到当前会话 UI 或本地状态中。';
  }
  if (route.path.includes('/retrieving-messages')) {
    return '本页说明如何通过会话 ID、分页参数和消息游标读取历史消息，用于首次进入会话、上拉加载更多和定位指定消息。';
  }
  if (route.path.includes('/channel/')) {
    return `本页说明如何使用 OpenIM 群组与会话 API 完成${title}。OpenIM 没有独立的频道对象，群组记录、会话记录和成员列表共同支撑频道式体验。`;
  }
  if (route.path.includes('/user/')) {
    return `本页说明如何使用 OpenIM 用户、好友、黑名单或群成员 API 完成${title}，并把返回数据同步到应用自己的用户状态中。`;
  }
  if (route.path.includes('/event-handler/')) {
    return `本页说明如何注册和移除${title}相关事件处理器，保证页面生命周期、重连和账号切换时不会重复监听或遗留旧回调。`;
  }
  if (route.path.includes('/message/')) {
    return `本页说明如何使用 OpenIM 消息 API 完成${title}，包括需要准备的会话状态、消息对象、SDK 调用以及事件或本地缓存更新。`;
  }
  return `本页说明如何在 OpenIM WASM SDK 中完成${title}，并给出可落地的初始化、调用、返回处理和验证步骤。`;
}

function formalOpenImMapping(route, title) {
  const rows = [
    ['当前登录用户', '`userID`', '由你的业务后端签发 token 后传给浏览器客户端。'],
    ['请求追踪', '`operationID`', '建议每次关键调用生成并记录，便于排查客户端和服务端日志。'],
  ];

  if (route.path.includes('/message/') || route.path.endsWith('/send-first-message')) {
    rows.push(
      [
        '消息对象',
        '`MessageItem`',
        '先通过 `create*Message` 创建，再传给 `sendMessage()` 或本地存储 API。',
      ],
      ['单聊目标', '`recvID`', '发送给单个用户时填写，群聊消息保持为空字符串。'],
      ['群聊目标', '`groupID`', '发送到已存在群组时填写，单聊消息保持为空字符串。'],
      ['会话', '`conversationID`', '读取历史、已读状态、未读数和本地会话列表时使用。'],
    );
  } else if (route.path.includes('/channel/')) {
    rows.push(
      [
        '频道式会话',
        '`GroupItem` + `ConversationItem`',
        '群组保存成员和权限，会话驱动聊天列表、未读数和展示状态。',
      ],
      ['群成员', '`GroupMemberItem`', '用于管理员、禁言、邀请、踢出和成员资料展示。'],
      ['群组标识', '`groupID`', `完成${title}时的主要目标 ID。`],
    );
  } else if (route.path.includes('/user/')) {
    rows.push(
      [
        '用户资料',
        '`PublicUserItem` / `SelfUserInfo`',
        '用于展示头像、昵称、在线状态和当前用户资料。',
      ],
      ['好友关系', '`FriendUserItem`', '好友列表、指定好友信息和好友搜索返回的数据结构。'],
      ['黑名单', '`BlackUserItem`', '拉黑、解除拉黑和黑名单列表使用。'],
    );
  } else if (route.path.includes('/event-handler/')) {
    rows.push(
      ['事件名', '`CbEvents`', '所有连接、消息、会话、群组和用户事件都通过该枚举注册。'],
      ['事件载荷', '`WSEvent<T>`', '回调中读取 `data`、`errCode`、`errMsg` 和 `operationID`。'],
      ['生命周期', '`on()` / `off()`', '组件挂载时注册，卸载或切换账号前移除。'],
    );
  } else {
    rows.push(
      [
        'SDK 实例',
        '`getSDK()` 返回值',
        '浏览器会话内复用一个实例，避免重复初始化本地数据库和事件监听。',
      ],
      [
        '连接状态',
        '`CbEvents.OnConnectSuccess`',
        '登录成功不等于 WebSocket 完全可用，业务调用前应等待连接成功事件。',
      ],
      ['本地缓存', 'IndexedDB / sql.js', '浏览器包通过 WASM 与本地数据库保存会话和消息状态。'],
    );
  }

  return renderMarkdownTable(['概念', 'OpenIM 对象', '说明'], rows);
}

function formalPrerequisites(route) {
  const items = [
    '- OpenIM Server 地址可从浏览器访问，包含 HTTP API 地址 `apiAddr` 和 WebSocket 地址 `wsAddr`。',
    '- 已安装与 OpenIM Server 兼容的 `@openim/wasm-client-sdk` 版本。',
    '- 已把 `openIM.wasm`、`sql-wasm.wasm` 和 `wasm_exec.js` 发布到应用的 public 静态资源路径。',
    '- 当前用户已经从可信后端拿到 `userID` 和有效 token。',
    '- 调用登录依赖 API 前，已完成 SDK 初始化、注册连接事件并等待登录成功。',
  ];
  if (route.path.includes('/group') || route.path.includes('/channel')) {
    items.push('- 群组相关操作需要准备目标 `groupID`，管理类操作还需要当前用户具备对应群角色。');
  }
  if (route.path.includes('/sending-a-message') || route.path.endsWith('/send-first-message')) {
    items.push(
      '- 单聊发送需要准备已存在的接收方 `recvID`；群聊发送只准备已存在的 `groupID`，发送参数中不再传接收方用户 ID。',
    );
  } else if (route.path.includes('/message/')) {
    items.push(
      '- 消息相关操作需要准备目标 `conversationID`、`clientMsgID`、`recvID` 或 `groupID`。',
    );
  }
  if (route.path.includes('/friend') || route.path.includes('/user/')) {
    items.push('- 用户或好友相关操作需要准备目标用户 ID，并在 UI 中处理用户不存在或无权限的返回。');
  }
  return items;
}

function formalInstallAndConfigure() {
  return [
    '使用 pnpm 安装浏览器 SDK，并在构建或部署阶段复制 WASM 资源。',
    '',
    '```bash',
    'pnpm add @openim/wasm-client-sdk',
    'cp node_modules/@openim/wasm-client-sdk/assets/openIM.wasm public/',
    'cp node_modules/@openim/wasm-client-sdk/assets/sql-wasm.wasm public/',
    'cp node_modules/@openim/wasm-client-sdk/assets/wasm_exec.js public/',
    '```',
    '',
    '如果你的应用使用 CDN 或非根路径部署，请把下面初始化代码中的 WASM 路径改成线上真实可访问地址。生产环境不要把用户 token 写死在前端代码中。',
  ];
}

function formalInitializeSdk() {
  return [
    '在应用启动阶段创建并复用一个 SDK 实例。连接、掉线、token 失效等事件应先注册，再调用 `login()`。',
    '',
    '```ts',
    "import { CbEvents, getSDK } from '@openim/wasm-client-sdk';",
    '',
    'const OpenIM = getSDK({',
    "  coreWasmPath: '/openIM.wasm',",
    "  sqlWasmPath: '/sql-wasm.wasm',",
    '});',
    '',
    'OpenIM.on(CbEvents.OnConnectSuccess, () => {',
    "  console.info('OpenIM connected');",
    '});',
    '',
    'OpenIM.on(CbEvents.OnConnectFailed, ({ errCode, errMsg, operationID }) => {',
    "  console.error('OpenIM connection failed', { errCode, errMsg, operationID });",
    '});',
    '',
    'await OpenIM.login({',
    '  userID,',
    '  token,',
    '  platformID: 5,',
    '  apiAddr,',
    '  wsAddr,',
    '});',
    '```',
  ];
}

function formalPrepareState(route) {
  if (route.path.includes('/retrieving-messages')) {
    return [
      '- 从当前会话路由、会话列表或消息事件中取得 `conversationID`。',
      '- 首次加载时可把起始 `clientMsgID` 设为空；翻页时使用上一页边界消息的 `clientMsgID`。',
      '- 根据 UI 场景设置分页数量，避免一次性拉取过多历史消息。',
    ];
  }
  if (route.path.includes('/sending-a-message') || route.path.endsWith('/send-first-message')) {
    return [
      '- 单聊发送前准备接收方 `recvID`，并把 `groupID` 设为空字符串。',
      '- 群聊发送前准备目标 `groupID`，并把 `recvID` 设为空字符串。',
      '- 单聊目标用户必须已存在；群聊目标只校验 `groupID`，发送参数中不指定某个群成员或接收用户。',
      '- 文件或富文本消息需要先完成文件选择、上传策略或内容校验，再创建消息对象。',
    ];
  }
  if (route.path.includes('/channel/')) {
    return [
      '- 确认当前用户已经登录并同步了群组或会话列表。',
      '- 对成员、管理员、禁言、解散等操作，先检查当前用户在群中的角色。',
      '- 对会话展示类操作，同时保存 `groupID` 和 `conversationID`，避免 UI 状态无法回填。',
    ];
  }
  if (route.path.includes('/user/')) {
    return [
      '- 准备目标用户 ID 列表，并在请求前去重。',
      '- 当前用户资料更新只允许修改业务允许的字段，例如昵称、头像和扩展信息。',
      '- 在线状态和关系状态可能随事件变化，页面需要处理刷新和重连后的重新查询。',
    ];
  }
  if (route.path.includes('/event-handler/')) {
    return [
      '- 在组件或应用模块初始化时注册事件处理器。',
      '- 为处理函数保留稳定引用，便于后续使用 `off()` 精确移除。',
      '- 事件回调只更新当前模块拥有的状态，不要在多个页面重复写同一份缓存。',
    ];
  }
  return [
    '- 确认 SDK 已完成初始化和登录。',
    '- 准备当前任务需要的用户、群组、会话或消息 ID。',
    '- 为关键调用生成 `operationID`，并在失败日志中保留它。',
  ];
}

function formalHandleResult(route) {
  const lines = [
    '- SDK Promise 成功返回后，仍要检查响应中的 `errCode`、`errMsg` 和 `data`。',
    '- UI 状态应以 SDK 返回值和后续事件共同确认，避免只根据按钮点击立即改成最终状态。',
    '- 失败时记录 `operationID`，并把错误提示转换成用户能理解的业务文案。',
  ];
  if (route.path.includes('/event-handler/')) {
    lines.push('- 页面卸载、退出登录或切换账号前调用 `off()` 移除事件，防止重复回调。');
  }
  if (route.path.includes('/message/')) {
    lines.push(
      '- 消息发送、撤回、已读或历史加载完成后，同步更新当前会话的本地消息列表和未读状态。',
    );
  }
  if (route.path.includes('/channel/')) {
    lines.push('- 群组或会话变更后，等待对应事件刷新列表；必要时再主动重新拉取目标群组或会话。');
  }
  return lines;
}

function formalVerify(route, section) {
  const translated = translateVerifySection(section, route).filter(Boolean);
  const base = translated.length > 0 ? translated : [];
  base.push('- 确认浏览器控制台没有 WASM 资源 404、连接失败或未处理的 Promise rejection。');
  base.push('- 断网重连或刷新页面后，确认本地状态能通过 SDK 查询和事件重新恢复。');
  return [...new Set(base)];
}

function splitSections(body) {
  const sections = new Map();
  let current = '';
  let lines = [];

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (current) sections.set(current, lines.join('\n').trim());
      current = heading[1].trim();
      lines = [];
    } else if (current) {
      lines.push(line);
    }
  }
  if (current) sections.set(current, lines.join('\n').trim());
  return sections;
}

function sdkVersionNotice(body) {
  if (body.includes('This draft avoids inventing Sendbird-compatible methods')) {
    return '本页只列出 OpenIM WASM SDK 已公开的能力；未提供 SDK 方法的行为应在可信后端或业务层实现。';
  }
  if (body.includes('This draft marks server-owned behavior')) {
    return '本页会区分浏览器 SDK 可直接调用的能力，以及需要服务端承担的用户、权限或业务状态处理。';
  }
  if (body.includes('This draft separates public OpenIM SDK support from product behavior')) {
    return '本页区分 OpenIM SDK 已支持的能力和需要应用代码补齐的产品行为。';
  }
  return '示例使用 OpenIM WASM SDK 的公开接口，并假定 SDK 版本与 OpenIM Server 兼容。';
}

function overviewText(route, title) {
  if (route.path.endsWith('/overview')) {
    return '本页是 OpenIM WASM SDK 的入口，说明浏览器包、WASM 资源、认证流程、消息流程，以及 Sendbird 风格概念在 OpenIM 中的对应关系。';
  }
  if (route.path.endsWith('/send-first-message')) {
    return '连接浏览器客户端，监听新消息，创建文本 `MessageItem`，并把它发送给单聊用户或群组。';
  }
  if (route.path.includes('/sending-a-message/send-a-message')) {
    return '本页说明如何在 OpenIM WASM SDK 中创建消息对象，并通过 `sendMessage()` 发送到单聊或群组会话。';
  }
  if (route.path.includes('/authentication')) {
    return '本页说明如何创建 SDK 实例、注册连接监听器、调用 `login()`，并处理用户 token 生命周期。';
  }
  if (route.path.includes('/environment-specific-implementation')) {
    return '本页说明在浏览器应用中安装 SDK 包、复制 WASM 资源，并根据运行环境初始化 OpenIM WASM SDK。';
  }
  if (route.path.includes('/error-codes')) {
    return '本页说明如何读取 SDK 响应和事件中的 `errCode`、`errMsg` 与 `operationID`，用于定位客户端和服务端问题。';
  }
  if (route.path.includes('/logger')) {
    return '本页说明如何在登录阶段配置 SDK 日志，并结合事件载荷收集浏览器侧诊断信息。';
  }
  if (route.path.includes('/deprecated')) {
    return '本页汇总 WASM SDK 中不建议继续依赖的 Sendbird 风格概念，并给出 OpenIM 中更合适的实现位置。';
  }
  return `本页说明如何在 OpenIM WASM SDK 中完成${title}，并给出相关 API 签名、实现步骤、返回数据和验证方法。`;
}

function modelText(route, title, body) {
  if (body.includes('A direct message sets `recvID`')) {
    return '单聊消息设置 `recvID` 并让 `groupID` 为空；群组消息设置 `groupID` 并让 `recvID` 为空。OpenIM 先创建消息对象，再发送该对象。';
  }
  if (body.includes('The public `@openim/wasm-client-sdk` surface does not include Web Push')) {
    return '公开的 `@openim/wasm-client-sdk` 不包含 Web Push、APNs、FCM token 注册、通知模板或通知翻译方法。浏览器 SDK 可以处理会话内收消息设置，推送订阅、模板和厂商凭据应由你的后端负责。';
  }
  if (body.includes('OpenIM WASM SDK does not expose poll')) {
    return 'OpenIM WASM SDK 不提供投票、投票选项、投票记录、投票人列表或投票变更日志 API。请把投票建模为后端记录，并按需用自定义消息发布状态变化。';
  }
  if (body.includes('OpenIM WASM SDK has no public scheduled-message')) {
    return 'OpenIM WASM SDK 没有公开的定时消息创建、更新、取消、列表或立即发送 API。定时任务应由可信后端 worker 维护，并在触发时通过服务端集成发送。';
  }
  if (body.includes('OpenIM WASM SDK does not provide built-in message translation')) {
    return 'OpenIM WASM SDK 不提供内置消息翻译或翻译引擎 API。翻译应放在应用层或后端服务中完成，并根据隐私策略决定是否保存译文。';
  }
  if (body.includes('OpenIM does not expose `GroupChannelCollection`')) {
    return 'OpenIM 不提供 Sendbird 风格的 `GroupChannelCollection` 或 `MessageCollection` 类。请通过会话和消息查询加载初始数据，再把 SDK 事件合并到应用自己的状态仓库。';
  }
  if (route.path.includes('/channel/')) {
    return 'OpenIM 使用群组和会话承载频道式体验。群组记录保存成员和权限，会话记录驱动聊天列表、未读数和本地展示状态。';
  }
  if (route.path.includes('/message/')) {
    return '消息能力围绕 `MessageItem`、`clientMsgID`、`conversationID`、`recvID` 和 `groupID` 展开。需要服务端权威状态的能力应放在后端实现。';
  }
  if (route.path.includes('/user/')) {
    return '用户能力围绕 `userID`、公开资料、好友/黑名单状态和群成员状态展开。账号级权限和全局封禁应由可信后端控制。';
  }
  if (route.path.includes('/application/')) {
    return '应用状态由后端和浏览器 SDK 共同组成。后端创建 OpenIM 用户和 token，浏览器 SDK 连接 `apiAddr` 与 `wsAddr`，并通过生命周期事件驱动 UI。';
  }
  if (route.path.includes('/event-handler/')) {
    return '事件处理器是浏览器端状态同步的入口。连接、会话、群组、消息和用户事件应注册在 SDK 实例上，并在页面卸载或模块销毁时移除。';
  }
  if (route.path.includes('/local-caching/')) {
    return '浏览器包由 WASM 驱动，并通过 sql.js / IndexedDB 保存本地状态。应用需要把查询结果和后续 SDK 事件合并成自己的 UI 状态。';
  }
  if (route.path.includes('/report/')) {
    return '举报流程应由可信后端或 Platform API 层记录和处理。浏览器 SDK 负责收集消息、用户、群组和会话上下文。';
  }
  return (
    `OpenIM WASM SDK 通过单个 ` +
    '`getSDK()`' +
    ` 实例提供能力。实现${title}时，请明确会话、目标用户、目标群组和 ` +
    '`operationID`' +
    ` 的关系。`
  );
}

function supportStatus(body) {
  if (body.includes('Support status: there is no public WASM SDK API equivalent')) {
    return '支持状态：没有与本页 Sendbird 功能完全等价的公开 WASM SDK API。';
  }
  if (body.includes('Support status: the browser SDK can provide context')) {
    return '支持状态：浏览器 SDK 可以提供上下文，权威动作应在后端或 Platform API 层执行。';
  }
  if (body.includes('Support status: the WASM SDK covers part of this workflow')) {
    return '支持状态：WASM SDK 覆盖此流程的一部分，其余行为需要应用或后端实现。';
  }
  return '支持状态：公开 WASM SDK API 可以覆盖此工作流。';
}

function coreConcepts() {
  return [
    '- `userID` 标识一个 OpenIM 用户。',
    '- `conversationID` 标识本地会话记录。',
    '- `recvID` 用于向单个用户发送单聊消息。',
    '- `groupID` 用于向群组会话发送消息或执行群组操作。',
    '- `operationID` 在大多数方法中可选，适合用来串联客户端和服务端日志。',
  ];
}

function translateListSection(section, route) {
  const lines = [];
  for (const line of section.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    lines.push(translateMarkdownLine(trimmed, route));
  }
  return ensureTypeScriptFence(lines);
}

function translateApiSection(section, route) {
  return translatePreservingCode(section, route, (line) => {
    if (line === 'Relevant public signatures:') return '相关公开签名：';
    if (line === 'Relevant events:') return '相关事件：';
    if (line === 'Response and event payloads use these common shapes:')
      return '响应和事件载荷使用以下通用结构：';
    return translateMarkdownLine(line, route);
  });
}

function translateImplementationSection(section, route, title) {
  const translated = translatePreservingCode(section, route, (line) =>
    translateImplementationLine(line, route, title),
  );
  return ensureTypeScriptFence(translated);
}

function translateReturnedDataSection(section, route) {
  const lines = translatePreservingCode(section, route, (line) =>
    translateMarkdownLine(line, route),
  );
  return ensureTypeScriptFence(lines);
}

function translateVerifySection(section, route) {
  const lines = [];
  for (const line of section.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    lines.push(translateMarkdownLine(trimmed, route));
  }
  return lines;
}

function translateTroubleshootingSection(section) {
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\s*\|?\s*:?-{3,}/.test(line)) continue;
    rows.push(parseTableRow(line).map(translateTableCell));
  }

  if (rows.length === 0) {
    rows.push(['情况', '原因', '处理方式']);
    rows.push([
      'SDK 调用返回错误码',
      '服务端拒绝请求，或当前用户没有权限。',
      '记录 `errCode`、`errMsg` 和 `operationID`，再检查 token、角色和目标 ID。',
    ]);
  }

  const [header, ...body] = rows;
  const table = [
    `| ${header.map(translateTableCell).join(' |')} |`,
    `| ${header.map(() => '---').join(' |')} |`,
  ];
  for (const row of body) table.push(`| ${row.map(translateTableCell).join(' |')} |`);
  return table;
}

function translateNextSteps(section) {
  const result = [];
  for (const line of section.split(/\r?\n/)) {
    const match = line.trim().match(/^-\s+\[([^\]]+)]\(([^)]+)\)$/);
    if (!match) continue;
    result.push(`- [${translateTitle(match[1], match[2])}](${match[2]})`);
  }
  return result.length > 0
    ? result
    : [
        '- [WASM SDK 概览](/docs/chat/sdk/v4/wasm/overview)',
        '- [用户认证](/docs/chat/sdk/v4/wasm/application/authenticating-a-user/authentication)',
        '- [发送消息](/docs/chat/sdk/v4/wasm/message/sending-a-message/send-a-message)',
      ];
}

function translatePreservingCode(section, route, translateLine) {
  const lines = [];
  let inCode = false;

  for (const raw of section.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      lines.push(line);
      continue;
    }
    if (inCode) {
      lines.push(raw);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }
    lines.push(translateLine(trimmed, route));
  }

  return trimBlankLines(lines);
}

function translateImplementationLine(line, route, title) {
  const exact = implementationTranslations[line];
  if (exact) return exact;
  const translated = translateMarkdownLine(line, route);
  if (translated !== line) return translated;
  if (line.startsWith('- ')) return `- 按示例中的参数完成${title}，并在失败时记录关键 ID。`;
  return `下面的示例展示如何完成${title}，关键参数和 ID 请替换为你自己应用中的值。`;
}

function translateMarkdownLine(line, route) {
  const exact = commonTranslations[line];
  if (exact) return exact;

  if (line.startsWith('- [') || line.match(/^\[.+]\(.+\)$/)) {
    return line.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, href) => {
      return `[${translateTitle(label, href)}](${href})`;
    });
  }

  const listPrefix = line.match(/^([-*+]\s+)(.+)$/);
  if (listPrefix) {
    const translated = translatePlainSentence(listPrefix[2], route);
    return `${listPrefix[1]}${translated}`;
  }

  return translatePlainSentence(line, route);
}

function translatePlainSentence(value, route) {
  const exact = commonTranslations[value];
  if (exact) return exact;

  if (/^This \w+ uses public signatures from `@openim\/wasm-client-sdk@[^`]+`\.$/.test(value)) {
    return '示例使用 OpenIM WASM SDK 的公开接口，并假定 SDK 版本与 OpenIM Server 兼容。';
  }
  if (
    /^Install `@openim\/wasm-client-sdk@[^`]+` or a compatible OpenIM WASM SDK version\.$/.test(
      value,
    )
  ) {
    return '安装与 OpenIM Server 兼容的 `@openim/wasm-client-sdk` 版本。';
  }

  const replaced = applyPhraseTranslations(value);
  if (replaced !== value && containsCjk(replaced)) return replaced;

  if (value.includes('Watch these callbacks while testing:')) {
    return value.replace('Watch these callbacks while testing:', '测试时重点关注这些回调：');
  }
  if (value.includes('Support status:')) return supportStatus(value);
  if (value.includes('No public OpenIM WASM SDK method')) {
    return '公开的 OpenIM WASM SDK 没有直接实现该 Sendbird 功能的方法；请使用本页列出的 OpenIM 替代方案或在可信后端实现。';
  }
  if (value.includes('OpenIM WASM SDK does not expose')) {
    return 'OpenIM WASM SDK 没有暴露该 Sendbird 功能的等价公开 API；请把权威状态放在后端，并用 SDK 能力完成展示或通知。';
  }
  if (value.includes('Use ') || value.includes('Build ') || value.includes('Create ')) {
    return '请结合本页示例使用 OpenIM SDK 调用和应用侧状态完成该能力，必要时由后端维护权威数据。';
  }

  const title = translateTitle(route.title, route.path);
  return `本段说明${title}的实现注意事项，代码中的 OpenIM 标识和调用参数保持不变。`;
}

function applyPhraseTranslations(value) {
  let result = value;
  for (const [source, target] of phraseTranslations) {
    result = result.replaceAll(source, target);
  }
  return result;
}

function ensureTypeScriptFence(lines) {
  return lines.length > 0
    ? lines
    : ['```ts', '// See the API signatures in the source SDK.', '```'];
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function translateTableCell(value) {
  if (containsCjk(value)) return value;
  return tableTranslations[value] ?? translatePlainSentence(value, { title: value, path: '' });
}

function trimBlankLines(lines) {
  while (lines[0] === '') lines.shift();
  while (lines.at(-1) === '') lines.pop();
  return lines;
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

function extractCodeBlocks(section) {
  const blocks = [];
  const pattern = /```([\w-]+)?\n([\s\S]*?)```/g;
  for (const match of section.matchAll(pattern)) {
    blocks.push({ code: match[2].trimEnd(), language: match[1] ?? 'text' });
  }
  return blocks;
}

function renderCodeBlocks(blocks) {
  if (blocks.length === 0) return [];
  const lines = [];
  for (const block of blocks) {
    lines.push(`\`\`\`${block.language}`, block.code, '```', '');
  }
  return trimBlankLines(lines);
}

function renderMarkdownTable(headers, rows) {
  return [
    `| ${headers.join(' |')} |`,
    `| ${headers.map(() => '---').join(' |')} |`,
    ...rows.map((row) => `| ${row.join(' |')} |`),
  ];
}

function extractHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,4})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      depth: match[1].length,
      title: match[2].trim(),
      url: `#${headingId(match[2])}`,
    }));
}

function headingId(value) {
  return value
    .replace(/[>#*_`]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function translateTitle(title, path = '') {
  if (title === 'Overview') return `${areaName(path)}概览`;
  return (
    titleTranslationsByPath[path] ??
    titleTranslations[title] ??
    fallbackTitleFromPath(path) ??
    title
  );
}

function areaName(path) {
  for (const [segment, label] of areaLabels) {
    if (path.includes(`/${segment}/`)) return label;
  }
  return 'SDK';
}

function fallbackTitleFromPath(path) {
  const segment = path.split('/').filter(Boolean).at(-1);
  if (!segment) return undefined;
  return segment
    .split('-')
    .map((part) => fallbackWordTranslations[part] ?? part)
    .join('');
}

const areaLabels = [
  ['application', '应用'],
  ['channel', '频道'],
  ['message', '消息'],
  ['user', '用户'],
  ['event-handler', '事件处理器'],
  ['push-notifications', '推送通知'],
  ['report', '举报'],
  ['local-caching', '本地缓存'],
  ['migration-guide', '迁移'],
];

const titleTranslationsByPath = {
  '/docs/chat/sdk/v4/wasm/overview': 'OpenIM WASM SDK 概览',
};

const titleTranslations = {
  'Accept or decline an invitation': '接受或拒绝邀请',
  'Add a poll option': '添加投票选项',
  'Add extra data to a message': '为消息添加扩展数据',
  'Add or remove a channel event handler': '添加或移除频道事件处理器',
  'Add or remove a connection event handler': '添加或移除连接事件处理器',
  'Add or remove a user event handler': '添加或移除用户事件处理器',
  Authentication: '用户认证',
  'Auto-translate messages': '自动翻译消息',
  'Ban and unban a user': '封禁和解封用户',
  'Block and unblock other members': '拉黑和解除拉黑成员',
  'Cancel a scheduled message': '取消定时消息',
  'Cancel an in-progress file upload': '取消进行中的文件上传',
  'Cast or cancel a vote': '投票或取消投票',
  'Categorize channels by custom type': '按自定义类型分类频道',
  'Categorize messages by custom type': '按自定义类型分类消息',
  'Clear the chat history in a group channel': '清空群组频道聊天记录',
  'Close a poll': '关闭投票',
  'Collection migration guide': 'Collection 迁移指南',
  'Copy a message': '复制消息',
  'Create a channel': '创建频道',
  'Create a message thread': '创建消息线程',
  'Create a poll': '创建投票',
  'Create a scheduled message': '创建定时消息',
  Deprecated: '废弃说明',
  'Delete a channel': '删除频道',
  'Delete a message': '删除消息',
  'Delete a poll': '删除投票',
  'Delete a poll option': '删除投票选项',
  'Display Open Graph tags in a message': '在消息中展示 Open Graph 标签',
  'Environment-specific implementation': '按运行环境实现',
  'Error codes': '错误码',
  'Event handler': '事件处理器',
  'Filter group channels by user IDs': '按用户 ID 过滤群组频道',
  'Freeze and unfreeze a channel': '冻结和解冻频道',
  'Generate thumbnails of a file message': '为文件消息生成缩略图',
  'Get read status of a message': '获取消息已读状态',
  'Group channel collection': '群组频道集合',
  'Hide or archive a group channel': '隐藏或归档群组频道',
  'Invite users as members': '邀请用户成为成员',
  'Join and leave a group channel': '加入和退出群组频道',
  'Enter and exit an open channel': '加入和退出群组',
  'List all scheduled messages': '列出所有定时消息',
  'List changelogs of messages': '列出消息变更日志',
  'List changelogs of polls': '列出投票变更日志',
  'List pinned messages': '列出置顶消息',
  'List replies in a message thread': '列出消息线程回复',
  'Local caching': '本地缓存',
  Logger: '日志',
  'Manage channel metacounters': '管理频道计数器',
  'Manage channel metadata': '管理频道元数据',
  'Manage user metadata': '管理用户元数据',
  'Mark messages as delivered': '标记消息已送达',
  'Mark messages as read': '标记消息已读',
  'Mark messages as unread': '标记消息未读',
  'Mention other users in a message': '在消息中提及其他用户',
  'Message collection': '消息集合',
  'Migrating to OpenIM': '迁移到 OpenIM',
  'Migration guide': '迁移指南',
  'Mute and unmute a user': '禁言和解除禁言用户',
  'OpenIM SDK for WASM': 'OpenIM WASM SDK',
  'Pin a message': '置顶消息',
  'Push notification content templates': '推送通知内容模板',
  'Push notification preferences': '推送通知偏好',
  'Push notification translation': '推送通知翻译',
  'Rate limits': '速率限制',
  'React to a message in a group channel': '对群组频道消息添加回应',
  'Receive messages in a group channel': '在群组频道中接收消息',
  'Receive messages in an open channel': '接收群组消息',
  'Refresh all data related to a channel': '刷新频道相关全部数据',
  'Register and remove operators': '注册和移除管理员',
  'Report a message, user, or channel': '举报消息、用户或频道',
  'Retrieve a channel by URL': '通过 URL 获取频道',
  'Retrieve a list of banned users': '获取被封禁用户列表',
  'Retrieve a list of blocked users': '获取黑名单用户列表',
  'Retrieve a list of channels': '获取频道列表',
  'Retrieve a list of members and operators in a specific order': '按指定顺序获取成员和管理员列表',
  'Retrieve a list of messages': '获取消息列表',
  'Retrieve a list of muted users': '获取被禁言用户列表',
  'Retrieve a list of operators': '获取管理员列表',
  'Retrieve a list of polls': '获取投票列表',
  'Retrieve a list of users in a channel': '获取频道中的用户列表',
  'Retrieve a list of users in an application': '获取应用中的用户列表',
  'Retrieve a list of voters': '获取投票人列表',
  'Retrieve a message': '获取消息',
  'Retrieve a poll': '获取投票',
  'Retrieve a poll option': '获取投票选项',
  'Retrieve a scheduled message': '获取定时消息',
  'Retrieve members who have read a message': '获取已读消息的成员',
  'Retrieve number of channels with unread messages': '获取有未读消息的频道数',
  "Retrieve number of members who haven't read a message": '获取未读消息的成员数',
  "Retrieve number of members who haven't received a message": '获取未收到消息的成员数',
  'Retrieve number of unread items': '获取未读项数量',
  'Retrieve number of unread messages in a channel': '获取频道未读消息数',
  'Retrieve number of unread messages in all channels': '获取全部频道未读消息数',
  'Retrieve the latest information on participants': '获取参与者最新信息',
  'Retrieve the online status of a user': '获取用户在线状态',
  'Retrieve the total number of scheduled messages': '获取定时消息总数',
  'Search group channels by name, URL, or several types of filters':
    '按名称、ID 或多种过滤条件搜索群组',
  'Search messages by a keyword': '按关键词搜索消息',
  'Search open channels by name, URL, or custom types': '按名称、ID 或自定义类型搜索群组',
  'Send a critical alert message to iOS device users': '向 iOS 用户发送关键提醒消息',
  'Send a message': '发送消息',
  'Send a scheduled message immediately': '立即发送定时消息',
  'Send an admin message': '发送管理员消息',
  'Send typing indicators to other members': '向其他成员发送正在输入提示',
  'Send your first message': '发送第一条消息',
  'Set up push notifications': '配置推送通知',
  'Share an encrypted file': '共享加密文件',
  'Smart throttling': '智能限流',
  'Spam flood protection': '刷屏保护',
  'Track file upload progress using a handler': '使用处理器跟踪文件上传进度',
  'Translate messages on-demand': '按需翻译消息',
  'Translation engine': '翻译引擎',
  'Unpin a message': '取消置顶消息',
  'Update a message': '更新消息',
  'Update a poll': '更新投票',
  'Update a poll option': '更新投票选项',
  'Update a scheduled message': '更新定时消息',
  'Update user profile': '更新用户资料',
};

const navigationLabels = {
  'accept-or-decline-an-invitation': '接受或拒绝邀请',
  'adding-extra-data-to-a-message': '为消息添加扩展数据',
  'authenticating-a-user': '用户认证',
  'categorizing-channels': '频道分类',
  'categorizing-messages': '消息分类',
  channel: '频道',
  'configuring-preferences': '配置偏好',
  'creating-a-channel': '创建频道',
  'creating-a-report': '创建举报',
  'event-handler': '事件处理器',
  'getting-started': '快速开始',
  'inviting-users-to-a-group-channel': '邀请用户加入群组频道',
  'joining-and-leaving-a-channel': '加入和离开频道',
  'listing-changelogs': '变更日志',
  'local-caching': '本地缓存',
  'managing-a-message': '管理消息',
  'managing-channel-event-handlers': '管理频道事件处理器',
  'managing-channel-metacounters': '管理频道计数器',
  'managing-channel-metadata': '管理频道元数据',
  'managing-channels': '管理频道',
  'managing-connection-event-handlers': '管理连接事件处理器',
  'managing-operators': '管理管理员',
  'managing-pinned-messages-in-group-channels': '管理群组频道置顶消息',
  'managing-polls': '管理投票',
  'managing-read-status-in-a-group-channel': '管理群组频道已读状态',
  'managing-scheduled-messages-in-group-channel': '管理群组频道定时消息',
  'managing-user-event-handlers': '管理用户事件处理器',
  'managing-user-metadata': '管理用户元数据',
  'marking-messages-as-delivered-in-a-group-channel': '标记群组频道消息已送达',
  'marking-messages-as-read-in-a-group-channel': '标记群组频道消息已读',
  'mentioning-other-users-in-a-message': '在消息中提及用户',
  message: '消息',
  'migration-guide': '迁移指南',
  'moderating-a-channel': '频道管理控制',
  'moderating-a-user': '用户管理控制',
  'push-notifications': '推送通知',
  'receiving-messages-through-event-handler': '通过事件处理器接收消息',
  report: '举报',
  'retrieving-and-updating-user-information': '获取和更新用户信息',
  'retrieving-channels': '获取频道',
  'retrieving-messages': '获取消息',
  'retrieving-unread-counts-in-a-group-channel': '获取群组频道未读数',
  'retrieving-users': '获取用户',
  'searching-channels': '搜索频道',
  'searching-messages-in-a-group-channel': '搜索群组频道消息',
  'sending-a-message': '发送消息',
  'translating-messages': '翻译消息',
  'understanding-rate-limits': '理解速率限制',
  user: '用户',
  'using-group-channel-collection': '使用群组频道集合',
  'using-message-collection': '使用消息集合',
  'using-message-threading': '使用消息线程',
};

const commonTranslations = {
  'Always log `operationID` with failures.': '失败时始终记录 `operationID`。',
  'Always log `operationID` with failures. It is the fastest way to match browser behavior with OpenIM server logs.':
    '失败时始终记录 `operationID`。这是把浏览器行为和 OpenIM 服务端日志对应起来最快的方式。',
  'Build scheduled sending in a trusted backend worker. When the schedule fires, the backend should send through a server-side integration or authorized service account.':
    '定时发送应由可信后端 worker 实现。到达计划时间后，后端通过服务端集成或授权服务账号发送消息。',
  'Create and reuse one SDK instance in the browser session.':
    '在同一个浏览器会话中创建并复用一个 SDK 实例。',
  'Create the message object first, then send it.': '先创建消息对象，然后发送该对象。',
  "For a group message, pass `recvID: ''` and the target `groupID`.":
    "发送群组消息时，传入 `recvID: ''` 和目标 `groupID`。",
  'Handle failures from both promises and callbacks.': '同时处理 Promise 返回和回调事件中的失败。',
  'Install the package and copy the browser assets during your app build.':
    '在应用构建过程中安装 SDK 包，并复制浏览器所需资源。',
  'Keep a queue item state around file sends and check cancellation before each SDK boundary.':
    '围绕文件发送维护队列项状态，并在每个 SDK 调用边界前检查是否已取消。',
  'Mark the visible conversation read, and send group read receipts for displayed group messages when needed.':
    '将当前可见会话标记为已读，并在需要时为已展示的群组消息发送已读回执。',
  'OpenIM WASM SDK has no public scheduled-message create, update, cancel, list, or send-now API.':
    'OpenIM WASM SDK 没有公开的定时消息创建、更新、取消、列表或立即发送 API。',
  'OpenIM WASM SDK does not provide built-in message translation or translation-engine APIs.':
    'OpenIM WASM SDK 不提供内置消息翻译或翻译引擎 API。',
  'OpenIM WASM SDK can pin conversations, but it does not expose public pin-message APIs.':
    'OpenIM WASM SDK 可以置顶会话，但没有公开的消息置顶 API。',
  'OpenIM stores unread count on conversations and exposes global unread totals. Group message reader APIs can list users by read status for a specific message when receipts are enabled.':
    'OpenIM 在会话上保存未读数，并提供全局未读总数。启用回执后，群消息读者 API 可以按已读状态列出特定消息的用户。',
  'Relevant events:': '相关事件：',
  'Relevant public signatures:': '相关公开签名：',
  'Response and event payloads use these common shapes:': '响应和事件载荷使用以下通用结构：',
  'Retrieve OpenIM unread counts from conversation records and SDK unread-count callbacks.':
    '从会话记录和 SDK 未读数回调中获取 OpenIM 未读数。',
  'Schedule in the backend and send when the job fires.':
    '在后端创建计划任务，并在任务触发时发送消息。',
  'Set in-app receive behavior through conversation settings, then use your own service worker and backend for browser push.':
    '通过会话设置配置应用内收消息行为；浏览器推送则使用你自己的 service worker 和后端实现。',
  'Store Web Push subscriptions, localized templates, and provider credentials outside the browser SDK.':
    '将 Web Push 订阅、国际化模板和厂商凭据保存在浏览器 SDK 之外。',
  'The browser can render schedule state returned by your backend, but it should not be the scheduler of record.':
    '浏览器可以渲染后端返回的定时状态，但不应成为定时任务的权威记录方。',
  'The SDK response `data` field contains the updated OpenIM object or operation result. Persist IDs such as `conversationID`, `groupID`, and `clientMsgID` in your application state.':
    'SDK 响应的 `data` 字段包含更新后的 OpenIM 对象或操作结果。请在应用状态中保存 `conversationID`、`groupID`、`clientMsgID` 等 ID。',
  'Treat the listed OpenIM calls as building blocks when the feature is partial or server-owned. Persist IDs such as `conversationID`, `groupID`, and `clientMsgID` in your application state.':
    '当能力只由 SDK 部分支持或属于服务端权威行为时，请把本页列出的 OpenIM 调用当作构建块使用，并在应用状态中保存 `conversationID`、`groupID`、`clientMsgID` 等 ID。',
  'Use conversation data and unread-count callbacks.': '使用会话数据和未读数回调。',
  'Watch these callbacks while testing: `CbEvents.OnConversationChanged`.':
    '测试时重点关注这些回调：`CbEvents.OnConversationChanged`。',
  'Watch these callbacks while testing: `CbEvents.OnGroupInfoChanged`, `CbEvents.OnConversationChanged`.':
    '测试时重点关注这些回调：`CbEvents.OnGroupInfoChanged`、`CbEvents.OnConversationChanged`。',
  'Watch these callbacks while testing: `CbEvents.OnRecvNewMessages`.':
    '测试时重点关注这些回调：`CbEvents.OnRecvNewMessages`。',
  'Watch these callbacks while testing: `CbEvents.OnRecvNewMessages`, `CbEvents.OnTotalUnreadMessageCountChanged`.':
    '测试时重点关注这些回调：`CbEvents.OnRecvNewMessages`、`CbEvents.OnTotalUnreadMessageCountChanged`。',
};

const implementationTranslations = {
  'Create and reuse one SDK instance in the browser session.':
    '在同一个浏览器会话中创建并复用一个 SDK 实例。',
  'Create the message object first, then send it.': '先创建消息对象，然后发送该对象。',
  'Create your own collection state from query results and events.':
    '基于查询结果和 SDK 事件维护你自己的集合状态。',
  "For a group message, pass `recvID: ''` and the target `groupID`.":
    "发送群组消息时，传入 `recvID: ''` 和目标 `groupID`。",
  'Schedule in the backend and send when the job fires.':
    '在后端创建定时任务，并在任务触发时发送消息。',
  'Set in-app receive behavior through conversation settings, then use your own service worker and backend for browser push.':
    '通过会话设置配置应用内收消息行为；浏览器推送由你的 service worker 和后端负责。',
  'Store Web Push subscriptions, localized templates, and provider credentials outside the browser SDK.':
    '将 Web Push 订阅、国际化模板和推送厂商凭据放在浏览器 SDK 之外保存。',
  'Translate outside the SDK and decide whether translated content is sent or only displayed locally.':
    '在 SDK 外部完成翻译，并决定译文是发送出去还是只在本地展示。',
  'Use browser throttles only as UX protection.':
    '浏览器侧限流只作为交互保护，不能替代服务端策略。',
  'Use group moderation in the SDK and account bans in the backend.':
    '群组内管理使用 SDK 能力，账号级封禁放在后端实现。',
  'Use quote messages for inline replies. Use a backend if replies need a separate thread list.':
    '内联回复可以使用引用消息；如果需要独立线程列表，请在后端建模。',
};

const tableTranslations = {
  Case: '情况',
  Cause: '原因',
  Handling: '处理方式',
  'A Sendbird method name is missing': '缺少 Sendbird 方法名',
  'Messages do not appear in the UI': '消息没有出现在界面中',
  'The client never connects': '客户端一直无法连接',
  'The response has an error code': '响应包含错误码',
  'WASM asset requests return 404': 'WASM 资源请求返回 404',
  'The feature is not part of the OpenIM WASM SDK public API.':
    '该能力不是 OpenIM WASM SDK 公开 API 的一部分。',
  'The listener was registered too late, the wrong `recvID` or `groupID` was used, or history has not synced.':
    '监听器注册太晚、使用了错误的 `recvID` 或 `groupID`，或历史消息尚未同步。',
  'The SDK assets were not copied to the app public path.': 'SDK 资源没有复制到应用 public 路径。',
  '`apiAddr`, `wsAddr`, token, platform ID, or network routing is wrong.':
    '`apiAddr`、`wsAddr`、token、平台 ID 或网络路由配置错误。',
  'The server rejected the request or the current user lacks permission.':
    '服务端拒绝请求，或当前用户没有权限。',
  'Copy `openIM.wasm`, `sql-wasm.wasm`, and `wasm_exec.js` from the npm package assets directory.':
    '从 npm 包资源目录复制 `openIM.wasm`、`sql-wasm.wasm` 和 `wasm_exec.js`。',
  'Log `errCode`, `errMsg`, and `operationID`; verify group role, token, and target IDs.':
    '记录 `errCode`、`errMsg` 和 `operationID`，并检查群组角色、token 和目标 ID。',
  'Register connection events before `login()` and test the API and WebSocket URLs from the same browser.':
    '在 `login()` 前注册连接事件，并在同一个浏览器中测试 API 与 WebSocket 地址。',
  'Register message events before testing and verify the target IDs with a second signed-in user.':
    '测试前注册消息事件；单聊用接收方账号验证，群聊用目标群中的任意已登录成员验证 `groupID`。',
  'Use the OpenIM alternative on this page or implement the feature in a trusted backend.':
    '使用本页给出的 OpenIM 替代方案，或在可信后端实现该能力。',
};

const phraseTranslations = [
  [
    'Confirm `login()` succeeds and `CbEvents.OnConnectSuccess` fires before calling the task API.',
    '确认 `login()` 成功，并且在调用目标 API 前触发 `CbEvents.OnConnectSuccess`。',
  ],
  [
    "Confirm the SDK response has `errCode === 0` or follows your deployment's success convention.",
    '确认 SDK 响应包含 `errCode === 0`，或符合你部署环境中的成功约定。',
  ],
  [
    'Confirm the expected SDK event fires in another signed-in browser session when the action should be visible to other users.',
    '当该操作应对其他用户可见时，确认另一个已登录浏览器会话收到了预期 SDK 事件。',
  ],
  [
    'Confirm refresh and reconnect behavior matches the product requirement.',
    '确认刷新和重连行为符合产品要求。',
  ],
  [
    'Confirm the backend validates user identity, role, and target IDs instead of trusting browser claims.',
    '确认后端会校验用户身份、角色和目标 ID，而不是信任浏览器提交的声明。',
  ],
  [
    'Confirm the application-owned part of the feature survives refresh, reconnect, and a second device session.',
    '确认由应用维护的状态在刷新、重连和第二设备会话中仍然正确。',
  ],
  [
    'Confirm the application-owned state survives refresh and a second signed-in device.',
    '确认由应用维护的状态在刷新和第二个已登录设备中仍然正确。',
  ],
  [
    'Serve `openIM.wasm`, `sql-wasm.wasm`, and `wasm_exec.js` from the browser app public path.',
    '从浏览器应用的 public 路径提供 `openIM.wasm`、`sql-wasm.wasm` 和 `wasm_exec.js`。',
  ],
  [
    'Create one SDK instance with `getSDK()` and call `login()` with `userID`, token, `platformID: 5`, `apiAddr`, and `wsAddr`.',
    '使用 `getSDK()` 创建一个 SDK 实例，并用 `userID`、token、`platformID: 5`、`apiAddr` 和 `wsAddr` 调用 `login()`。',
  ],
  [
    'Have a target `conversationID`, `recvID`, or `groupID` depending on whether the flow is direct or group chat.',
    '根据当前流程准备目标：单聊使用 `recvID`，群聊使用 `groupID`；发送群聊消息时不再传接收方用户 ID。',
  ],
  [
    'Keep application-owned behavior in your app or backend when the SDK does not expose a direct method.',
    '当 SDK 没有直接方法时，把应用自有行为放在应用或后端中实现。',
  ],
  [
    'Provide a trusted backend endpoint for authoritative product behavior.',
    '为权威产品行为提供可信后端接口。',
  ],
  [
    'The SDK response `data` field contains the updated OpenIM object or operation result.',
    'SDK 响应的 `data` 字段包含更新后的 OpenIM 对象或操作结果。',
  ],
  [
    'Persist IDs such as `conversationID`, `groupID`, and `clientMsgID` in your application state.',
    '请在应用状态中保存 `conversationID`、`groupID`、`clientMsgID` 等 ID。',
  ],
  ['Watch these callbacks while testing:', '测试时重点关注这些回调：'],
  ['OpenIM WASM SDK', 'OpenIM WASM SDK'],
  ['OpenIM', 'OpenIM'],
  ['WASM SDK', 'WASM SDK'],
  ['browser SDK', '浏览器 SDK'],
  ['browser client', '浏览器客户端'],
  ['trusted backend', '可信后端'],
  ['backend', '后端'],
  ['application state', '应用状态'],
  ['conversation records', '会话记录'],
  ['group conversation', '群组会话'],
  ['direct message', '单聊消息'],
  ['group message', '群组消息'],
  ['SDK response', 'SDK 响应'],
  ['public API', '公开 API'],
  ['server-owned', '服务端权威'],
  ['server-side', '服务端'],
  ['message object', '消息对象'],
  ['operation result', '操作结果'],
];

const fallbackWordTranslations = {
  add: '添加',
  admin: '管理员',
  application: '应用',
  authentication: '认证',
  ban: '封禁',
  channel: '频道',
  channels: '频道',
  collection: '集合',
  create: '创建',
  delete: '删除',
  deprecated: '废弃说明',
  error: '错误',
  event: '事件',
  group: '群组',
  guide: '指南',
  handler: '处理器',
  wasm: 'WASM',
  list: '列表',
  local: '本地',
  message: '消息',
  messages: '消息',
  migration: '迁移',
  openim: 'OpenIM',
  overview: '概览',
  poll: '投票',
  push: '推送',
  report: '举报',
  retrieve: '获取',
  sdk: 'SDK',
  send: '发送',
  user: '用户',
  users: '用户',
};

await main();
