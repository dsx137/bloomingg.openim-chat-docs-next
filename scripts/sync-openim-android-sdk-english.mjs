import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const localRoot = '/docs/chat/sdk/v4/android';
const contentRoot = 'content/docs/chat/sdk/v4/android';
const zhContentRoot = 'content/zh/docs/chat/sdk/v4/android';
const contextKey = 'chat/sdk/v4/android';

const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const structurePath = resolve(root, 'data/structure/chat-pages.json');
const cjkPattern = /[\u4e00-\u9fff]/;

let routeTitleByPath = new Map();

async function main() {
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  const androidRoutes = routes.filter((route) => route.contextKey === contextKey);

  for (const route of androidRoutes) {
    route.contentFile = englishContentFile(route);
  }

  routeTitleByPath = new Map(
    androidRoutes.map((route) => [route.path, titleForRoute(route, undefined)]),
  );

  await removeUnroutedEnglishFiles(new Set(androidRoutes.map((route) => route.contentFile)));

  for (const route of androidRoutes) {
    const source = await readFile(resolve(root, zhContentFile(route)), 'utf8');
    const parsed = parseMdx(source);
    const title = titleForRoute(route, parsed);
    const description = descriptionForRoute(route, parsed, title);
    route.title = title;
    route.description = description;
    route.status = parsed.frontmatter.status ?? route.status;
    route.template = parsed.frontmatter.template ?? route.template;
    route.platform = 'android';
    route.version = 'v4';
    route.product = 'sdk';
    routeTitleByPath.set(route.path, title);

    const frontmatter = {
      title,
      description,
      product: 'sdk',
      context: contextKey,
      template: route.template,
      status: route.status,
      lastUpdated: parsed.frontmatter.lastUpdated ?? today,
      version: 'v4',
      platform: 'android',
      sourcePath: route.sourcePath,
    };
    const body = renderAndroidPage(route, parsed, title);
    const mdx = `---\n${renderFrontmatter(frontmatter)}\n---\n\n${body.trim()}\n`;

    await mkdir(dirname(resolve(root, route.contentFile)), { recursive: true });
    await writeFile(resolve(root, route.contentFile), mdx, 'utf8');
  }

  const androidContext = navigation.contexts.find((context) => context.key === contextKey);
  if (androidContext) {
    androidContext.title = 'SDKs · Android · v4';
    localizeNavigationNodes(androidContext.nodes);
  }

  const structureRecords = await updateStructureRecords(routes);

  await Promise.all([
    writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8'),
    writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8'),
    writeFile(structurePath, `${JSON.stringify(structureRecords, null, 2)}\n`, 'utf8'),
  ]);

  console.log(`Synchronized ${androidRoutes.length} OpenIM Android SDK English page(s).`);
}

function englishContentFile(route) {
  return `${contentRoot}/${route.path.slice(localRoot.length + 1)}.mdx`;
}

function zhContentFile(route) {
  return `${zhContentRoot}/${route.path.slice(localRoot.length + 1)}.mdx`;
}

async function removeUnroutedEnglishFiles(usedFiles) {
  const files = await collectMdxFiles(resolve(root, contentRoot));
  await Promise.all(
    files
      .map((file) => file.replace(`${root}/`, ''))
      .filter((file) => !usedFiles.has(file))
      .map((file) => rm(resolve(root, file), { force: true })),
  );
}

async function collectMdxFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMdxFiles(file)));
    else if (entry.isFile() && file.endsWith('.mdx')) files.push(file);
  }
  return files;
}

async function updateStructureRecords(routes) {
  const records = JSON.parse(await readFile(structurePath, 'utf8'));
  const androidRoutes = routes.filter((route) => route.contextKey === contextKey);
  const androidRecords = androidRoutes.map(structureRecordFromRoute);
  const firstIndex = records.findIndex((record) => record.context === contextKey);
  const withoutAndroid = records.filter((record) => record.context !== contextKey);

  if (firstIndex < 0) return [...withoutAndroid, ...androidRecords];

  const before = records.slice(0, firstIndex).filter((record) => record.context !== contextKey);
  const after = records.slice(firstIndex).filter((record) => record.context !== contextKey);
  return [...before, ...androidRecords, ...after];
}

function structureRecordFromRoute(route) {
  return {
    sourcePath: route.sourcePath,
    openimPath: route.path,
    title: route.title,
    context: route.contextKey,
    template: route.template,
    contentFile: route.contentFile,
  };
}

function parseMdx(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!item) continue;
      frontmatter[item[1]] = unquote(item[2].trim());
    }
  }
  return {
    frontmatter,
    body: match ? source.slice(match[0].length).trim() : source.trim(),
  };
}

function unquote(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function renderFrontmatter(frontmatter) {
  return Object.entries(frontmatter)
    .map(([key, value]) => `${key}: '${String(value).replaceAll("'", "''")}'`)
    .join('\n');
}

function renderAndroidPage(route, parsed, title) {
  const relative = route.path.slice(localRoot.length + 1);
  if (isMethodPage(parsed.body)) return renderMethodPage(route, parsed, title);
  if (relative === 'overview') return renderRootOverview();
  if (relative === 'getting-started/send-first-message') return renderGettingStarted();
  if (relative === 'application/authenticating-a-user/authentication') return renderAuthFlow();
  if (relative === 'deprecated') return renderDeprecated();
  if (relative.startsWith('models/') && relative !== 'models/overview') {
    return renderModelPage(route, parsed);
  }
  return translateMarkdown(parsed.body, route);
}

function isMethodPage(body) {
  return body.includes('## Core Binding 方法') && body.includes('## 输入参数');
}

function renderMethodPage(route, parsed, title) {
  const core = extractCoreBinding(parsed.body);
  const methodName = core.methodName ?? methodNameFromRoute(route);
  const javaBlock = extractFirstCodeBlock(section(parsed.body, 'Android 调用参考'), 'java');
  const exampleBlock = extractFirstCodeBlock(section(parsed.body, '代码示例'), 'java');
  const inputSection = section(parsed.body, '输入参数');
  const params = parseMarkdownTable(inputSection);
  const inputSubtables = extractSubtables(inputSection);
  const returnSection = section(parsed.body, '返回结果');
  const returnRows = parseMarkdownTable(returnSection);
  const returnSubtables = extractSubtables(returnSection);
  const relatedTypes = extractRelatedLinks(section(parsed.body, '相关类型'));
  const relatedPages = extractRelatedLinks(section(parsed.body, '相关页面'));
  const returnText = returnTextForMethod(route, methodName);
  const feature = featureTextForMethod(route, title, methodName);

  return [
    `Use \`${methodName}\` for ${title.toLowerCase()} in the OpenIM Android SDK.`,
    '## Feature',
    feature,
    'Initialize the SDK before calling user-scoped APIs, and pass a unique `operationID` whenever the core binding signature includes it so client and server logs can be correlated.',
    '## Core Binding Method',
    renderTable(
      ['Item', 'Description'],
      [
        ['Method signature', core.signature ? `\`${core.signature}\`` : `\`${methodName}(...)`],
        ['Capability', abilityForRoute(route)],
        ['Source file', core.source ? `\`${core.source}\`` : '`open_im_sdk`'],
      ],
    ),
    javaBlock
      ? [
          '## Android Call Reference',
          'The Java method prototype in Android SDK v3.8.3 is shown below. The core binding signature explains the underlying `open_im_sdk` capability and parameter mapping.',
          renderCodeBlock('java', javaBlock),
        ].join('\n\n')
      : '',
    params.length > 0
      ? [
          '## Input Parameters',
          renderTable(
            ['Parameter', 'Type', 'Description'],
            params.map((row) => [
              codeCell(row[0]),
              translateTypeCell(row[1]),
              parameterDescription(row[0], row[row.length - 1]),
            ]),
          ),
          inputSubtables.length > 0 ? renderSubtables(inputSubtables) : '',
        ].join('\n\n')
      : '',
    '## Return Value',
    returnRows.length > 0
      ? [
          returnText,
          renderTable(
            ['Name', 'Type', 'Description'],
            returnRows.map((row) => [
              codeCell(row[0]),
              translateTypeCell(row[1]),
              returnDescription(row[row.length - 1]),
            ]),
          ),
        ].join('\n\n')
      : returnText,
    returnSubtables.length > 0 ? renderSubtables(returnSubtables) : '',
    exampleBlock
      ? ['## Code Example', 'The following example uses the Android SDK v3.8.3 call style.', renderCodeBlock('java', exampleBlock)].join(
          '\n\n',
        )
      : '',
    relatedTypes.length > 0
      ? ['## Related Types', renderRelatedLinks(relatedTypes, 'type')].join('\n\n')
      : '',
    relatedPages.length > 0
      ? ['## Related Pages', renderRelatedLinks(relatedPages, 'page')].join('\n\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function renderModelPage(route, parsed) {
  const typeName = extractTypeName(parsed.body) ?? pascalFromSlug(route.path.split('/').pop());
  const className = extractFullClassName(parsed.body);
  const kind = modelKind(parsed.body, parsed.frontmatter.title);
  const fields = parseMarkdownTable(section(parsed.body, '字段说明'));
  const callbacks = parseMarkdownTable(section(parsed.body, '回调方法'));
  const values = [
    ...parseMarkdownTable(section(parsed.body, '取值说明')),
    ...parseMarkdownTable(section(parsed.body, '枚举常量')),
  ];
  const notes = translateMarkdownSection(section(parsed.body, '类型说明'), route);
  const relatedTypes = [
    ...extractRelatedLinks(section(parsed.body, '关联类型')),
    ...extractRelatedLinks(section(parsed.body, '相关类型')),
    ...extractRelatedLinks(section(parsed.body, '对应 Android 类型')),
  ];
  const relatedPages = extractRelatedLinks(section(parsed.body, '相关页面'));

  return [
    `\`${typeName}\` is an Android SDK ${kind}.${className ? ` Full class name: \`${className}\`.` : ''}`,
    notes ? ['## Notes', notes].join('\n\n') : '',
    fields.length > 0
      ? [
          '## Fields',
          renderTable(
            ['Field', 'Java type', 'Description'],
            fields.map((row) => [codeCell(row[0]), codeCell(row[1]), fieldDescription(row[0], row[2])]),
          ),
        ].join('\n\n')
      : '',
    callbacks.length > 0
      ? [
          '## Callback Methods',
          renderTable(
            ['Method', 'Parameters', 'Description'],
            callbacks.map((row) => [codeCell(row[0]), noneCell(row[1]), callbackDescription(row[0], row[2])]),
          ),
        ].join('\n\n')
      : '',
    values.length > 0
      ? [
          '## Constants',
          renderTable(
            normalizeValueHeaders(values[0]),
            values.map((row) => row.map((cell, index) => valueCell(cell, index))),
          ),
        ].join('\n\n')
      : '',
    relatedTypes.length > 0
      ? ['## Related Types', renderRelatedLinks(relatedTypes, 'type')].join('\n\n')
      : '',
    relatedPages.length > 0
      ? ['## Related Pages', renderRelatedLinks(relatedPages, 'page')].join('\n\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function renderRootOverview() {
  return [
    'The OpenIM Android documentation follows the current OpenIM SDK capability structure and is based on the public methods exported by Android SDK v3.8.3. Each method page focuses on the Android call style, parameters, return value, and usage boundaries.',
    'This section records how the Android platform layer maps to OpenIM core capabilities. Platform method names and parameter wrappers may differ from other SDKs; when the platform layer differs from the core export, use the Android SDK v3.8.3 prototype shown on each page.',
    '## Integration Model',
    renderTable(
      ['Model', 'Description'],
      [
        ['Initialization', 'Configure the API address, WebSocket address, logs, local data directory, and connection listener.'],
        ['Login state', 'Register message, conversation, friend, group, and user listeners before login to avoid missing synchronization events.'],
        ['Asynchronous result', 'Platform methods return results through Promise, Future, or callback style depending on the method page.'],
        ['Message creation', '`Create*Message` methods create local message objects that are passed to sending methods.'],
        ['operationID', 'Generate a unique `operationID` for each call so client and server logs can be correlated.'],
      ],
    ),
    '## Current Capability Pages',
    renderTable(
      ['Page', 'Coverage'],
      [
        [linkForPath(`${localRoot}/getting-started/send-first-message`), 'Initialization, listeners, login, and the order of prerequisites before sending messages.'],
        [linkForPath(`${localRoot}/application/overview`), 'SDK initialization, login, logout, login state, foreground/background state, and network changes.'],
        [linkForPath(`${localRoot}/application/authenticating-a-user/authentication`), 'Token handling, connection listener behavior, login status, and logout boundaries.'],
        [linkForPath(`${localRoot}/event-handler/overview`), 'Connection, user, friend, group, conversation, message, custom business, and message KV callbacks.'],
        [linkForPath(`${localRoot}/user/overview`), 'User profiles, user commands, online status subscriptions, friends, and blocklist APIs.'],
        [linkForPath(`${localRoot}/group/overview`), 'Group creation, joining, members, applications, moderation, and ownership transfer.'],
        [linkForPath(`${localRoot}/message/overview`), 'Conversation lists, message creation, sending, history, read status, deletion, search, and typing state.'],
        [linkForPath(`${localRoot}/push-notifications/overview`), 'FCM token updates and application badge management.'],
        [linkForPath(`${localRoot}/logger/overview`), 'SDK log writing and log upload.'],
        [linkForPath(`${localRoot}/file/overview`), 'Uploading files to the object storage path configured for the SDK.'],
        [linkForPath(`${localRoot}/models/overview`), 'Data models, enums, listeners, and callback structures.'],
        [linkForPath(`${localRoot}/error-codes`), 'SDK core, server, and WebSocket protocol error code identifiers.'],
        [linkForPath(`${localRoot}/deprecated`), 'Capabilities that are not currently exported as standalone Android SDK APIs.'],
      ],
    ),
    '## Currently Unexposed Capabilities',
    'Android SDK v3.8.3 does not currently expose standalone methods for open groups, polls, scheduled messages, message threads, translation, independent reporting, group metadata, or counters. Add those pages after the SDK exports matching methods.',
  ].join('\n\n');
}

function renderGettingStarted() {
  return [
    'This page describes the integration order and the parameters you need to prepare. For exact API signatures, open the corresponding capability pages.',
    '## Call Order',
    renderTable(
      ['Step', 'Required method', 'Description'],
      [
        ['Read version', '`GetSdkVersion()`', 'Use this for diagnosing the current AAR or core binding version.'],
        ['Initialize', '`InitSDK(listener, operationID, config)`', '`config` passes the `IMConfig` JSON, and `listener` handles connection lifecycle events.'],
        ['Set listeners', '`SetConversationListener`, `SetAdvancedMsgListener`, `SetFriendListener`', 'Set listeners before login to avoid missing events during login synchronization.'],
        ['Login', '`Login(callback, operationID, userID, token)`', 'The token should be issued by your business server. Call conversation, message, and group APIs after login succeeds.'],
        ['Create message', '`CreateTextMessage`, `CreateImageMessage`, and other creation methods', 'Creation methods synchronously return a message JSON string.'],
        ['Send message', '`SendMessage` or `SendMessageNotOss`', 'Use `recvID` for one-to-one chats and `groupID` for group chats. Send results are returned through `SendMsgCallBack`.'],
        ['Logout or release', '`Logout`, `UnInitSDK`', 'Use `Logout` for the current user and `UnInitSDK` to release global SDK resources.'],
      ],
    ),
    '## Initialization Config',
    renderTable(
      ['Field', 'Type', 'Description'],
      [
        ['`systemType`', '`string`', 'System type for logs and runtime identification.'],
        ['`platformID`', '`int32`', 'Platform ID. Android must pass a non-zero value.'],
        ['`apiAddr`', '`string`', 'OpenIM HTTP API address. Include the HTTP scheme.'],
        ['`wsAddr`', '`string`', 'OpenIM WebSocket address. Include the WS scheme.'],
        ['`dataDir`', '`string`', 'Local database, cache, and SDK data directory.'],
        ['`logLevel`', '`uint32`', 'SDK log level.'],
        ['`isLogStandardOutput`', '`bool`', 'Whether logs are printed to standard output.'],
        ['`logFilePath`', '`string`', 'Directory for log files.'],
        ['`isExternalExtensions`', '`bool`', 'Whether external extension field handling is enabled.'],
      ],
    ),
    '## Integration Checklist',
    renderTable(
      ['Check', 'Passing condition'],
      [
        ['Initialize once', 'Repeated initialization reuses the existing `UserForSDK`; do not rebuild it frequently in the same process.'],
        ['Non-empty operationID', 'The core call chain validates `operationID`; generate a traceable ID for each business operation.'],
        ['Call user APIs after login', 'Most APIs return an error callback when the SDK is not initialized or the user is not logged in.'],
        ['Valid JSON parameters', '`userIDList`, `groupIDList`, `searchParam`, `req`, and similar string parameters should contain JSON for the target structure.'],
        ['Listeners are not lost', '`Set*Listener` replaces the previous listener. Maintain distribution in your wrapper layer when multiple consumers need events.'],
      ],
    ),
    '## Related Types',
    `- ${linkForPath(`${localRoot}/models/send-msg-call-back`)} (\`SendMsgCallBack\`): core binding message sending callback, usually mapped to \`OnMsgSendCallback\` in the Android call layer.`,
    '## Related Pages',
    [
      `- ${linkForPath(`${localRoot}/application/overview`)}`,
      `- ${linkForPath(`${localRoot}/event-handler/overview`)}`,
      `- [Send messages](${localRoot}/message/overview#send-messages)`,
    ].join('\n'),
  ].join('\n\n');
}

function renderAuthFlow() {
  return [
    'Authentication is centered on the user token issued by your business server. The client initializes the SDK, registers listeners, logs in with `userID` and `token`, and keeps UI state aligned with connection events and login state.',
    '## Authentication Order',
    renderTable(
      ['Step', 'Description'],
      [
        ['Prepare a token', 'Issue an OpenIM user token from your trusted business backend. Do not hard-code tokens in the client.'],
        ['Initialize the SDK', 'Call `InitSDK` with API, WebSocket, log, and local data configuration.'],
        ['Register listeners', 'Set connection, message, conversation, friend, group, and user listeners before login.'],
        ['Login', 'Call `Login` with the user ID and token. User-scoped APIs are reliable only after login succeeds.'],
        ['Handle expiration', 'When token expiration or invalid-token events arrive, request a new token from your backend and log in again.'],
      ],
    ),
    '## Token Boundaries',
    '- User tokens are issued by your backend and should be treated as sensitive credentials.',
    '- Token expiration, invalid-token, and kicked-offline events are delivered through the connection listener.',
    '- Calling `Logout` clears the current user session but does not release the global SDK instance.',
    '## Related Pages',
    [
      `- ${linkForPath(`${localRoot}/application/methods/init-sdk`)}`,
      `- ${linkForPath(`${localRoot}/application/methods/login`)}`,
      `- ${linkForPath(`${localRoot}/application/methods/logout`)}`,
      `- ${linkForPath(`${localRoot}/models/on-conn-listener`)}`,
    ].join('\n'),
  ].join('\n\n');
}

function renderDeprecated() {
  return [
    'The Android documentation only keeps capabilities that are exported by the current `open_im_sdk`. The following areas are not exposed as standalone OpenIM Android SDK core APIs right now.',
    '## Capabilities Not Exposed As Android Core APIs',
    renderTable(
      ['Capability', 'Current status'],
      [
        ['Open groups', 'No standalone Android core API is exposed in the current SDK.'],
        ['Polls', 'No standalone Android core API is exposed in the current SDK.'],
        ['Scheduled messages', 'No standalone Android core API is exposed in the current SDK.'],
        ['Message threads', 'No standalone Android core API is exposed in the current SDK.'],
        ['Translation', 'No standalone Android core API is exposed in the current SDK.'],
        ['Independent reporting', 'No standalone Android core API is exposed in the current SDK.'],
        ['Group metadata and counters', 'No standalone Android core API is exposed in the current SDK.'],
      ],
    ),
    '## Documentation Policy',
    'Do not add API pages for capabilities that are not exported by Android SDK v3.8.3. Add pages only after the SDK exposes matching methods and the Android call prototype can be verified.',
  ].join('\n\n');
}

function translateMarkdown(body, route) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCode = !inCode;
      out.push(line);
      continue;
    }
    if (inCode) {
      out.push(translateCodeLine(line));
      continue;
    }
    out.push(translateMarkdownLine(line, route));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function translateMarkdownSection(markdown, route) {
  return translateMarkdown(markdown.trim(), route).trim();
}

function translateMarkdownLine(line, route) {
  if (!line.trim()) return line;
  const heading = line.match(/^(#{1,6})\s+(.+)$/);
  if (heading) return `${heading[1]} ${translateHeading(heading[2])}`;
  if (isTableSeparator(line)) return line;
  if (line.includes('|')) {
    const edge = line.trim().startsWith('|') && line.trim().endsWith('|');
    const cells = line.split('|');
    const start = edge ? 1 : 0;
    const end = edge ? cells.length - 1 : cells.length;
    for (let index = start; index < end; index += 1) {
      cells[index] = ` ${cleanCell(translateInline(cells[index].trim(), route), route)} `;
    }
    return cells.join('|').replace(/\s+\|/g, ' |').replace(/\|\s+/g, '| ');
  }
  const translated = translateInline(line, route);
  if (!containsCjk(translated)) return translated;
  return fallbackLine(line, route);
}

function translateInline(value) {
  if (!value) return value;
  let text = value;
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    return `[${titleForHref(href, label)}](${translateHref(href)})`;
  });
  const parts = text.split(/(`[^`]*`)/g).map((part) => {
    if (part.startsWith('`') && part.endsWith('`')) return part;
    return translatePlain(part);
  });
  return normalizeEnglishPunctuation(parts.join(''));
}

function translatePlain(value) {
  let text = value;
  for (const [from, to] of exactTextTranslations) {
    if (text.trim() === from) return preserveOuterSpace(value, to);
  }
  for (const [from, to] of phraseTranslations) {
    text = text.replaceAll(from, to);
  }
  text = text.replace(/说明 Android core binding 方法 ([A-Za-z0-9_]+) 的用途、参数、返回和使用边界。/g, 'Explains the Android core binding method $1, including purpose, parameters, return value, and usage boundaries.');
  text = text.replace(/说明 Android SDK ([A-Za-z0-9_]+) 类型的用途和字段。/g, 'Explains the Android SDK $1 type and its fields.');
  text = text.replace(/说明 Android SDK ([A-Za-z0-9_]+) 类型的用途和回调方法。/g, 'Explains the Android SDK $1 type and callback methods.');
  text = text.replace(/说明 Android SDK ([A-Za-z0-9_]+) 枚举的取值。/g, 'Explains the Android SDK $1 enum values.');
  text = text.replace(/`([^`]+)` 是 Android SDK 的数据模型/g, '`$1` is an Android SDK data model');
  text = text.replace(/`([^`]+)` 是 Android SDK 的监听器/g, '`$1` is an Android SDK listener');
  text = text.replace(/`([^`]+)` 是 Android SDK 的回调接口/g, '`$1` is an Android SDK callback interface');
  text = text.replace(/完整类名为/g, 'full class name is');
  return normalizeEnglishPunctuation(text);
}

function fallbackLine(line, route) {
  if (line.trim().startsWith('- ')) {
    const link = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (link) return `- [${titleForHref(link[2], link[1])}](${translateHref(link[2])})`;
  }
  if (line.includes('|')) return line.replace(/[\u4e00-\u9fff][^|]*/g, 'See details');
  return `${titleForRoute(route, undefined)} documentation for OpenIM Android SDK v3.8.3.`;
}

function cleanCell(value, route) {
  if (!containsCjk(value)) return value;
  const link = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) return `[${titleForHref(link[2], link[1])}](${translateHref(link[2])})`;
  return genericCell(value, route);
}

function genericCell(value, route) {
  if (/^\d+$/.test(value.trim())) return value.trim();
  if (value.includes('方法数')) return 'Method count';
  if (value.includes('说明')) return 'Description';
  if (value.includes('模块')) return 'Module';
  if (value.includes('页面')) return 'Page';
  if (value.includes('错误码')) return 'Error code';
  return `${titleForRoute(route, undefined)} details`;
}

function normalizeEnglishPunctuation(value) {
  return value
    .replaceAll('（', ' (')
    .replaceAll('）', ')')
    .replaceAll('，', ', ')
    .replaceAll('。', '.')
    .replaceAll('；', '; ')
    .replaceAll('：', ': ')
    .replaceAll('、', ', ')
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('‘', "'")
    .replaceAll('’', "'");
}

function preserveOuterSpace(original, value) {
  const prefix = original.match(/^\s*/)?.[0] ?? '';
  const suffix = original.match(/\s*$/)?.[0] ?? '';
  return `${prefix}${value}${suffix}`;
}

function translateHeading(value) {
  const translated = exactTextTranslations.get(value.trim()) ?? translatePlain(value.trim());
  return containsCjk(translated) ? slugTitle(value) : translated;
}

function translateHref(href) {
  const [path, hash] = href.split('#');
  if (!hash) return href;
  return `${path}#${anchorForText(hash)}`;
}

function anchorForText(value) {
  const decoded = decodeURIComponent(value);
  const translated = translateHeading(decoded);
  return translated
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function section(body, heading) {
  const escaped = escapeRegExp(heading);
  const match = body.match(new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^##\\s|\\z)`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function extractCoreBinding(body) {
  const table = parseMarkdownTable(section(body, 'Core Binding 方法'));
  const record = new Map(table.map(([key, value]) => [key, value]));
  const signature = stripMarkdown(record.get('方法签名') ?? '');
  return {
    signature,
    methodName: signature.match(/^([A-Za-z0-9_]+)/)?.[1],
    source: stripMarkdown(record.get('源码位置') ?? ''),
  };
}

function extractFirstCodeBlock(markdown) {
  const match = markdown.match(/```[^\n]*\n([\s\S]*?)\n```/);
  if (!match) return '';
  return match[1]
    .split(/\r?\n/)
    .map(translateCodeLine)
    .join('\n');
}

function translateCodeLine(line) {
  if (!containsCjk(line)) return line;
  if (line.includes('//')) return line.replace(/\/\/.*$/, '// TODO: handle the callback result');
  return normalizeEnglishPunctuation(translatePlain(line)).replace(cjkPattern, '');
}

function renderCodeBlock(language, code) {
  return `\`\`\`${language} showLineNumbers\n${code.trim()}\n\`\`\``;
}

function parseMarkdownTable(markdown) {
  const lines = firstTableLines(markdown).filter((line) => !isTableSeparator(line));
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
}

function firstTableLines(markdown) {
  const lines = [];
  let started = false;
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const isTableLine = line.startsWith('|') && line.endsWith('|');
    if (isTableLine) {
      started = true;
      lines.push(line);
      continue;
    }
    if (started) break;
  }
  return lines;
}

function extractSubtables(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^#{3,4}\s+(.+)$/);
    if (!heading) continue;
    const block = [];
    for (let next = index + 1; next < lines.length; next += 1) {
      const line = lines[next].trim();
      if (!line) {
        if (block.length > 0) break;
        continue;
      }
      if (!line.startsWith('|') || !line.endsWith('|')) break;
      block.push(line);
    }
    const rows = parseMarkdownTable(block.join('\n'));
    if (rows.length > 0) tables.push({ title: heading[1], rows });
  }
  return tables;
}

function renderSubtables(tables) {
  return tables
    .map((table) =>
      [
        `### ${translateHeading(table.title)}`,
        renderTable(
          ['Field', 'Type', 'Description'],
          table.rows.map((row) => [
            codeCell(row[0]),
            translateTypeCell(row[1]),
            fieldDescription(row[0], row[row.length - 1]),
          ]),
        ),
      ].join('\n\n'),
    )
    .join('\n\n');
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function stripMarkdown(value) {
  return value.replace(/`/g, '').trim();
}

function renderTable(headers, rows) {
  const cleanHeaders = headers.map((header) => String(header).trim());
  const cleanRows = rows.map((row) => row.map((cell) => String(cell ?? '').trim()));
  const widths = cleanHeaders.map((header, index) =>
    Math.max(header.length, ...cleanRows.map((row) => row[index]?.length ?? 0), 3),
  );
  const line = (cells) =>
    `| ${cells.map((cell, index) => String(cell ?? '').padEnd(widths[index], ' ')).join(' | ')} |`;
  return [
    line(cleanHeaders),
    `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`,
    ...cleanRows.map(line),
  ].join('\n');
}

function codeCell(value) {
  const clean = stripMarkdown(value);
  if (!clean) return '-';
  if (clean === '无') return 'None';
  if (clean.startsWith('[')) return translateTypeCell(value);
  if (clean.includes('；')) return clean.replaceAll('；', '; ');
  if (/^[A-Za-z0-9_<>, ?.[\]-]+$/.test(clean)) return `\`${clean}\``;
  return clean;
}

function noneCell(value) {
  const clean = stripMarkdown(value);
  if (!clean || clean === '无') return 'None';
  return codeCell(clean);
}

function translateTypeCell(value) {
  if (!value) return '-';
  return translateInline(value, undefined).replaceAll('（', '(').replaceAll('）', ')');
}

function parameterDescription(name, source) {
  const cleanName = stripMarkdown(name);
  const lower = cleanName.toLowerCase();
  if (lower.includes('callback') || lower === 'base') return 'Async callback for success and failure results.';
  if (lower === 'operationid') return 'Trace ID for this operation.';
  if (lower === 'userid' || lower === 'uid' || lower === 'user id') return 'User ID.';
  if (lower.includes('useridlist') || lower.includes('uidlist')) {
    return 'List of user IDs, usually encoded as JSON.';
  }
  if (lower === 'token') return 'User token issued by the business server.';
  if (lower === 'groupid') return 'Group ID.';
  if (lower.includes('groupidlist')) return 'List of group IDs, usually encoded as JSON.';
  if (lower === 'recvid') return 'Receiver user ID for one-to-one chats.';
  if (lower === 'msg' || lower.includes('message')) return 'Message payload or message JSON.';
  if (lower.includes('offset')) return 'Pagination offset.';
  if (lower.includes('count') || lower.includes('number')) return 'Number of records to return.';
  if (lower.includes('req') || lower.includes('param')) return 'Request parameters, usually encoded as JSON.';
  if (lower.includes('path')) return 'Local file path.';
  if (lower.includes('url')) return 'Resource URL.';
  const translated = translateInline(source ?? '', undefined);
  return containsCjk(translated) || !translated ? 'Parameter passed according to the core binding signature.' : translated;
}

function fieldDescription(name, source) {
  const cleanName = stripMarkdown(name);
  const byName = fieldDescriptions.get(cleanName);
  if (byName) return byName;
  const translated = translateInline(source ?? '', undefined);
  return containsCjk(translated) || !translated ? 'SDK field returned or submitted by the SDK.' : translated;
}

function callbackDescription(name, source) {
  const cleanName = stripMarkdown(name);
  const byName = callbackDescriptions.get(cleanName);
  if (byName) return byName;
  const translated = translateInline(source ?? '', undefined);
  return containsCjk(translated) || !translated ? 'Called when this event is triggered.' : translated;
}

function returnDescription(source) {
  const translated = translateInline(source ?? '', undefined);
  return containsCjk(translated) || !translated ? 'Returned when the operation succeeds.' : translated;
}

function valueCell(cell, index) {
  if (index === 0 && cell && !cell.startsWith('`') && /^[A-Za-z0-9_-]+$/.test(cell)) return `\`${cell}\``;
  const translated = translateInline(cell, undefined);
  if (!containsCjk(translated)) return translated;
  if (index === 0) return stripMarkdown(cell);
  return 'SDK-defined value.';
}

function normalizeValueHeaders() {
  return ['Value', 'Name', 'Description'];
}

function extractRelatedLinks(markdown) {
  const links = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)(?:（`([^`]+)`）|\s+\(`([^`]+)`\))?(?:[:：](.*))?/);
    if (!match) continue;
    links.push({
      label: match[1],
      href: match[2],
      code: match[3] ?? match[4] ?? '',
      description: match[5]?.trim() ?? '',
    });
  }
  return links;
}

function renderRelatedLinks(links, kind) {
  return links
    .map((link) => {
      const title = titleForHref(link.href, link.label);
      const code = link.code ? ` (\`${link.code}\`)` : '';
      const description = translateRelatedDescription(link.description, kind, link.code);
      return description
        ? `- [${title}](${translateHref(link.href)})${code}: ${description}`
        : `- [${title}](${translateHref(link.href)})${code}`;
    })
    .join('\n');
}

function translateRelatedDescription(value, kind, code) {
  if (!value) return '';
  const translated = translateInline(value, undefined);
  if (!containsCjk(translated)) return translated;
  if (code) return `${code} used by this Android SDK ${kind}.`;
  return kind === 'type' ? 'Related Android SDK type.' : 'Related Android SDK page.';
}

function titleForHref(href, fallback) {
  const [path] = href.split('#');
  if (routeTitleByPath.has(path)) return routeTitleByPath.get(path);
  if (path.startsWith(localRoot)) return slugTitle(path.split('/').pop());
  const translated = translatePlain(fallback ?? '');
  return containsCjk(translated) || !translated ? slugTitle(path.split('/').pop() ?? 'page') : translated;
}

function linkForPath(path) {
  return `[${routeTitleByPath.get(path) ?? slugTitle(path.split('/').pop())}](${path})`;
}

function titleForRoute(route, parsed) {
  const relative = route.path.slice(localRoot.length + 1);
  const last = relative.split('/').pop();
  if (relative === 'overview') return 'OpenIM Android SDK overview';
  if (relative === 'getting-started/send-first-message') return 'Android integration flow';
  if (relative === 'application/authenticating-a-user/authentication') return 'Authentication flow';
  if (relative === 'deprecated') return 'Unsupported or unexposed capabilities';
  if (relative === 'error-codes') return 'Error codes';
  if (relative.endsWith('/overview')) return 'Overview';
  if (relative.startsWith('models/') && parsed) {
    const typeName = extractTypeName(parsed.body);
    if (typeName) return splitTypeName(typeName);
  }
  if (relative.startsWith('models/')) return splitTypeName(pascalFromSlug(last));
  return specialTitles.get(last) ?? slugTitle(last);
}

function descriptionForRoute(route, parsed, title) {
  const relative = route.path.slice(localRoot.length + 1);
  if (isMethodPage(parsed.body)) {
    const methodName = extractCoreBinding(parsed.body).methodName ?? methodNameFromRoute(route);
    return `Explains the Android core binding method ${methodName}, including purpose, parameters, return value, and usage boundaries.`;
  }
  if (relative === 'overview') {
    return 'Organizes OpenIM Android SDK v3.8.3 capabilities by lifecycle, authentication, listeners, users, groups, messages, push notifications, logging, files, and model types.';
  }
  if (relative === 'error-codes') {
    return 'Lists Android SDK v3.8.3 error codes from SDK core, server, and WebSocket protocol identifiers.';
  }
  if (relative === 'deprecated') {
    return 'Lists capabilities that are not currently exported as standalone OpenIM Android SDK APIs.';
  }
  if (relative.startsWith('models/') && relative !== 'models/overview') {
    const typeName = extractTypeName(parsed.body) ?? pascalFromSlug(route.path.split('/').pop());
    return `Explains the Android SDK ${typeName} type and its fields, callbacks, or constants.`;
  }
  return `${title} for the OpenIM Android SDK v3.8.3.`;
}

function methodNameFromRoute(route) {
  return pascalFromSlug(route.path.split('/').pop());
}

function pascalFromSlug(slug = '') {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => {
      const upper = acronym(part);
      return upper ?? `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join('');
}

function slugTitle(slug = '') {
  const words = slug
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      const upper = acronym(word);
      if (upper) return upper;
      if (word === 'oss') return 'OSS';
      if (word === 'kv') return 'KV';
      if (word === 'id') return 'ID';
      if (word === 'ids') return 'IDs';
      return index === 0 ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : word;
    });
  return words.join(' ');
}

function splitTypeName(typeName = '') {
  return typeName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bId\b/g, 'ID')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bSdk\b/g, 'SDK')
    .replace(/\bOss\b/g, 'OSS')
    .replace(/\bKv\b/g, 'KV')
    .replace(/\bFcm\b/g, 'FCM')
    .replace(/\bIm\b/g, 'IM');
}

function acronym(word) {
  const map = {
    api: 'API',
    sdk: 'SDK',
    id: 'ID',
    ids: 'IDs',
    im: 'IM',
    json: 'JSON',
    url: 'URL',
    urls: 'URLs',
    oss: 'OSS',
    fcm: 'FCM',
    kv: 'KV',
    aar: 'AAR',
    ws: 'WS',
    websocket: 'WebSocket',
    c2c: 'C2C',
  };
  return map[word.toLowerCase()];
}

function abilityForRoute(route) {
  if (route.path.includes('/application/')) return 'SDK lifecycle';
  if (route.path.includes('/event-handler/')) return 'Event listeners';
  if (route.path.includes('/user/')) return 'Users, friends, and blocklist';
  if (route.path.includes('/group/')) return 'Groups';
  if (route.path.includes('/message/')) return 'Conversations and messages';
  if (route.path.includes('/push-notifications/')) return 'Push notifications';
  if (route.path.includes('/logger/')) return 'Logging';
  if (route.path.includes('/file/')) return 'File upload';
  return 'Android SDK';
}

function featureTextForMethod(route, title, methodName) {
  if (methodName.startsWith('Create')) {
    return `Creates the local message payload for ${title.toLowerCase()}. Pass the returned message JSON to a sending method when you are ready to send it.`;
  }
  if (methodName.startsWith('Set') && route.path.includes('/event-handler/')) {
    return `Registers or replaces the listener used to receive ${title.toLowerCase()}. Register listeners before login when you need login-time synchronization events.`;
  }
  if (methodName.startsWith('Get') || methodName.startsWith('Search') || methodName.startsWith('Find')) {
    return `Reads ${title.toLowerCase()} from the local SDK state or OpenIM service according to the method contract.`;
  }
  if (methodName.startsWith('Delete') || methodName.startsWith('Clear') || methodName.startsWith('Dismiss')) {
    return `Removes or clears the target resource for ${title.toLowerCase()}. Check the current resource state before retrying after an uncertain failure.`;
  }
  if (methodName.startsWith('Send')) {
    return `Sends message data through OpenIM. Use the callback to handle progress, success, and failure.`;
  }
  return `${methodName} provides the Android SDK operation for ${title.toLowerCase()}.`;
}

function returnTextForMethod(route, methodName) {
  if (methodName.startsWith('Create') || methodName === 'GetAtAllTag') {
    return 'This method returns a value synchronously according to the Android method prototype, usually a message JSON string or SDK-defined value.';
  }
  return 'The result is returned through the callback. Success is delivered through `OnSuccess`, failure through `OnError`, and sending or upload methods may also report progress.';
}

function extractTypeName(body) {
  return body.match(/`([^`]+)`\s*是 Android SDK/)?.[1];
}

function extractFullClassName(body) {
  return body.match(/完整类名为\s*`([^`]+)`/)?.[1];
}

function modelKind(body, title) {
  if (body.includes('监听器') || title?.includes('监听器')) return 'listener';
  if (body.includes('回调接口') || title?.includes('回调')) return 'callback interface';
  if (body.includes('枚举') || body.includes('取值说明')) return 'enum';
  return 'data model';
}

function containsCjk(value) {
  return cjkPattern.test(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localizeNavigationNodes(nodes) {
  for (const node of nodes) {
    if (node.href) node.title = titleForHref(node.href, node.title);
    else node.title = folderTitle(node);
    if (Array.isArray(node.children)) localizeNavigationNodes(node.children);
  }
}

function folderTitle(node) {
  const byId = folderTitles.get(node.id);
  if (byId) return byId;
  const bySegment = folderTitles.get(node.segment);
  if (bySegment) return bySegment;
  return slugTitle(node.segment ?? node.id ?? 'section');
}

const exactTextTranslations = new Map([
  ['概述', 'Overview'],
  ['相关页面', 'Related Pages'],
  ['相关类型', 'Related Types'],
  ['关联类型', 'Related Types'],
  ['功能介绍', 'Feature'],
  ['Core Binding 方法', 'Core Binding Method'],
  ['Android 调用参考', 'Android Call Reference'],
  ['输入参数', 'Input Parameters'],
  ['返回结果', 'Return Value'],
  ['代码示例', 'Code Example'],
  ['字段说明', 'Fields'],
  ['回调方法', 'Callback Methods'],
  ['类型说明', 'Notes'],
  ['取值说明', 'Values'],
  ['枚举常量', 'Constants'],
  ['对应 Android 类型', 'Android Type Mapping'],
  ['模块索引', 'Module Index'],
  ['方法索引', 'Method Index'],
  ['事件联动', 'Event Integration'],
  ['认证顺序', 'Authentication Order'],
  ['token 边界', 'Token Boundaries'],
  ['相关错误码', 'Related Error Codes'],
  ['生命周期顺序', 'Lifecycle Order'],
  ['调用边界', 'Call Boundaries'],
  ['当前未作为 Android core API 暴露的能力', 'Capabilities Not Exposed As Android Core APIs'],
  ['文档处理原则', 'Documentation Policy'],
  ['SDK core 错误码', 'SDK Core Error Codes'],
  ['通用错误', 'Common Errors'],
  ['用户和登录', 'Users and Login'],
  ['消息', 'Messages'],
  ['会话', 'Conversations'],
  ['群组', 'Groups'],
  ['Server 错误码', 'Server Error Codes'],
  ['成功和未知错误', 'Success and Unknown Errors'],
  ['账号认证扩展错误', 'Account Authentication Extension Errors'],
  ['通用和基础设施', 'Common and Infrastructure'],
  ['账号', 'Accounts'],
  ['好友和关系', 'Friends and Relationships'],
  ['token', 'Token'],
  ['长连接网关和推送', 'Long Connection Gateway and Push'],
  ['对象存储', 'Object Storage'],
  ['WebSocket 协议标识', 'WebSocket Protocol Identifiers'],
  ['监听器索引', 'Listener Index'],
  ['注册建议', 'Registration Recommendations'],
  ['调用顺序', 'Call Order'],
  ['初始化配置', 'Initialization Config'],
  ['接入检查', 'Integration Checklist'],
  ['管理群组', 'Managing Groups'],
  ['入群申请', 'Group Join Requests'],
  ['用户入群关系', 'Group Membership'],
  ['群成员', 'Group Members'],
  ['群组禁言', 'Group Moderation'],
  ['使用边界', 'Usage Boundaries'],
  ['查询会话', 'Query Conversations'],
  ['管理会话', 'Manage Conversations'],
  ['会话状态', 'Conversation State'],
  ['创建消息', 'Create Messages'],
  ['发送消息', 'Send Messages'],
  ['查询消息', 'Query Messages'],
  ['管理消息', 'Manage Messages'],
  ['已读状态', 'Read Status'],
  ['删除消息', 'Delete Messages'],
  ['本地消息', 'Local Messages'],
  ['发送参数与事件', 'Send Parameters and Events'],
  ['使用场景', 'Use Cases'],
  ['使用建议', 'Usage Recommendations'],
  ['数据模型', 'Data Models'],
  ['监听器', 'Listeners'],
  ['回调接口', 'Callback Interfaces'],
  ['接入模型', 'Integration Model'],
  ['当前能力页', 'Current Capability Pages'],
  ['当前未暴露的能力', 'Currently Unexposed Capabilities'],
  ['用户资料、命令和在线状态', 'User Profiles, Commands, and Online Status'],
  ['好友', 'Friends'],
  ['黑名单', 'Blocklist'],
  ['项目', 'Item'],
  ['说明', 'Description'],
  ['方法签名', 'Method signature'],
  ['所属能力', 'Capability'],
  ['源码位置', 'Source file'],
  ['参数名称', 'Parameter'],
  ['参数类型', 'Parameter type'],
  ['是否必填', 'Required'],
  ['描述', 'Description'],
  ['字段名称', 'Field'],
  ['Java 类型', 'Java type'],
  ['方法', 'Method'],
  ['参数', 'Parameters'],
  ['值', 'Value'],
  ['常量', 'Constant'],
  ['错误码', 'Error code'],
  ['默认消息或源码说明', 'Default message or source note'],
  ['标识值', 'Identifier'],
  ['页面', 'Page'],
  ['覆盖范围', 'Coverage'],
  ['模块', 'Module'],
  ['方法数', 'Method count'],
  ['步骤', 'Step'],
  ['必要方法', 'Required method'],
  ['检查项', 'Check'],
  ['通过标准', 'Passing condition'],
  ['类型', 'Type'],
  ['名称', 'Name'],
  ['中文名称', 'Chinese name'],
  ['是否', 'Whether'],
  ['否', 'No'],
  ['是', 'Yes'],
  ['无', 'None'],
]);

const phraseTranslations = [
  ['基于 OpenIM SDK v3.8.3 整理', 'Organized based on OpenIM SDK v3.8.3'],
  ['本 Android 文档按照当前 OpenIM SDK 能力结构组织', 'The Android documentation follows the current OpenIM SDK capability structure'],
  ['每个方法均提供独立页面', 'Each method has its own page'],
  ['当前 Android SDK v3.8.3', 'Android SDK v3.8.3'],
  ['当前 Android 中文文档只保留', 'The Android documentation only keeps'],
  ['未按独立方法暴露', 'is not exposed as a standalone method'],
  ['未作为 OpenIM Android SDK 的独立 core API 暴露', 'is not exposed as a standalone OpenIM Android SDK core API'],
  ['事件触发时回调', 'Called when the event is triggered'],
  ['SDK 返回或提交的字段', 'SDK field returned or submitted by the SDK'],
  ['异步结果回调', 'Async result callback'],
  ['本次操作的追踪 ID', 'Trace ID for this operation'],
  ['按 core binding 签名传入', 'Pass according to the core binding signature'],
  ['业务标识参数', 'Business identifier'],
  ['通常为 JSON 字符串或上层封装对象，具体结构以 SDK 定义为准', 'Usually a JSON string or upper-layer wrapper object; the exact structure follows the SDK definition'],
  ['分页偏移量', 'Pagination offset'],
  ['分页数量', 'Page size'],
  ['起始偏移量', 'Starting offset'],
  ['每页数量', 'Page size'],
  ['查询结果回调', 'Query result callback'],
  ['删除结果回调', 'Delete result callback'],
  ['操作结果回调', 'Operation result callback'],
  ['发送结果和进度回调', 'Send result and progress callback'],
  ['事件监听器实例', 'Event listener instance'],
  ['使用业务服务端签发的 token 登录指定用户', 'Log in the specified user with a token issued by your business server'],
  ['登录成功后才能可靠调用会话、消息、群组、好友等用户态接口', 'After login succeeds, user-scoped APIs such as conversations, messages, groups, and friends can be called reliably'],
  ['初始化类方法应在应用进程内按需调用', 'Initialization methods should be called as needed in the application process'],
  ['用户态方法通常要求 `InitSDK` 已成功执行', 'User-scoped methods usually require `InitSDK` to have completed successfully'],
  ['并通过 `operationID` 串联日志', 'and use `operationID` to correlate logs'],
  ['通过回调返回结果', 'The result is returned through callbacks'],
  ['成功走 `OnSuccess`', 'success is delivered through `OnSuccess`'],
  ['失败走 `OnError`', 'failure is delivered through `OnError`'],
  ['发送或上传类方法还可能通过进度回调返回进度', 'sending or upload methods may also return progress through progress callbacks'],
  ['以下示例展示 Android SDK v3.8.3 的调用方式', 'The following example shows the Android SDK v3.8.3 call style'],
  ['用于', 'used to'],
  ['适合', 'suitable for'],
  ['获取', 'Get'],
  ['创建', 'Create'],
  ['更新', 'Update'],
  ['设置', 'Set'],
  ['删除', 'Delete'],
  ['搜索', 'Search'],
  ['查询', 'Query'],
  ['发送', 'Send'],
  ['上传', 'Upload'],
  ['监听', 'Listen for'],
  ['用户资料对象', 'User profile object'],
  ['好友资料', 'Friend profile'],
  ['黑名单用户资料', 'Blocklist user profile'],
  ['群组资料对象', 'Group profile object'],
  ['群成员资料对象', 'Group member profile object'],
  ['入群申请记录', 'Group join request record'],
  ['消息对象', 'Message object'],
  ['会话资料对象', 'Conversation profile object'],
  ['公开用户资料', 'Public user profile'],
  ['扩展字段', 'Extension field'],
  ['头像', 'Avatar'],
  ['昵称', 'Nickname'],
  ['手机号', 'Phone number'],
  ['邮箱', 'Email'],
  ['生日', 'Birthday'],
  ['性别', 'Gender'],
  ['备注', 'Remark'],
  ['创建时间', 'Creation time'],
  ['错误信息', 'Error message'],
  ['错误码', 'Error code'],
  ['网络错误', 'Network error'],
  ['网络超时', 'Network timeout'],
  ['输入参数无效', 'Invalid input arguments'],
  ['上下文超时', 'Context deadline exceeded'],
  ['SDK 资源初始化未完成', 'SDK resource initialization is incomplete'],
  ['未识别的错误码', 'Unrecognized error code'],
  ['SDK 内部错误', 'Internal SDK error'],
  ['没有可更新内容', 'No updates available'],
  ['用户 ID 不存在或未注册', 'User ID does not exist or is not registered'],
  ['用户已退出登录', 'The user has logged out'],
  ['用户重复登录', 'The user has logged in repeatedly'],
  ['文件或记录不存在', 'File or record does not exist'],
  ['消息解压失败', 'Message decompression failed'],
  ['消息已删除', 'Message has been deleted'],
  ['操作不支持', 'Operation is not supported'],
  ['类型不支持', 'Type is not supported'],
  ['未读数为 0', 'Unread count is zero'],
  ['群组 ID 不存在', 'Group ID does not exist'],
  ['群组类型无效', 'Invalid group type'],
  ['成功', 'Success'],
  ['未知错误码', 'Unknown error code'],
  ['格式化错误', 'Formatting error'],
  ['用户已注册', 'User has already registered'],
  ['用户未注册', 'User is not registered'],
  ['密码错误', 'Password error'],
  ['获取 IM token 失败', 'Failed to get IM token'],
  ['重复发送验证码', 'Verification code was sent repeatedly'],
  ['验证码无效或已过期', 'Verification code is invalid or expired'],
  ['注册失败', 'Registration failed'],
  ['重置密码失败', 'Password reset failed'],
  ['权限不足', 'Permission denied'],
  ['记录不存在', 'Record not found'],
  ['数据库或 Redis 等存储错误', 'Database, Redis, or storage error'],
  ['不能添加自己为好友', 'Cannot add yourself as a friend'],
  ['已被对方拉黑', 'Blocked by the peer'],
  ['不是对方好友', 'Not a friend of the peer'],
  ['好友关系已存在', 'Friend relationship already exists'],
  ['好友申请已处理', 'Friend request has already been handled'],
  ['消息已读能力不可用', 'Message read capability is unavailable'],
  ['成员在群内被禁言', 'The member is muted in the group'],
  ['群组被禁言', 'The group is muted'],
  ['消息已撤回', 'Message has already been revoked'],
  ['token 已过期', 'Token has expired'],
  ['token 无效', 'Token is invalid'],
  ['token 格式错误', 'Token is malformed'],
  ['token 尚未生效', 'Token is not valid yet'],
  ['token 未知错误', 'Unknown token error'],
  ['token 对应账号被踢下线', 'The token account was kicked offline'],
  ['token 不存在', 'Token does not exist'],
  ['连接数超过上限', 'Connection count exceeds the limit'],
  ['长连接参数错误', 'Long connection arguments are invalid'],
  ['推送消息失败', 'Failed to push the message'],
  ['对象存储', 'Object storage'],
  ['WebSocket 数据错误协议标识', 'WebSocket data error protocol identifier'],
].sort((a, b) => b[0].length - a[0].length);

const specialTitles = new Map([
  ['un-init-sdk', 'Uninitialize SDK'],
  ['get-sdk-version', 'Get SDK version'],
  ['get-login-user-id', 'Get login user ID'],
  ['get-login-status', 'Get login status'],
  ['set-app-background-status', 'Set foreground/background status'],
  ['network-status-changed', 'Notify network status change'],
  ['send-message-not-oss', 'Send non-OSS message'],
  ['get-at-all-tag', 'Get @all tag'],
  ['update-fcm-token', 'Update FCM token'],
  ['set-app-badge', 'Set app badge'],
]);

const folderTitles = new Map([
  ['application', 'SDK lifecycle'],
  ['authenticating-a-user', 'Authenticating a user'],
  ['methods', 'Methods'],
  ['event-handler', 'Event handlers'],
  ['user', 'Users'],
  ['friend', 'Friends'],
  ['blacklist', 'Blocklist'],
  ['group', 'Groups'],
  ['managing-groups', 'Managing groups'],
  ['group-applications', 'Group join requests'],
  ['group-membership', 'Group membership'],
  ['group-members', 'Group members'],
  ['group-moderation', 'Group moderation'],
  ['message', 'Conversations and messages'],
  ['listing-conversations', 'Listing conversations'],
  ['managing-conversations', 'Managing conversations'],
  ['conversation-state', 'Conversation state'],
  ['creating-messages', 'Creating messages'],
  ['sending-messages', 'Sending messages'],
  ['retrieving-messages', 'Retrieving messages'],
  ['managing-messages', 'Managing messages'],
  ['read-status', 'Read status'],
  ['deleting-messages', 'Deleting messages'],
  ['local-messages', 'Local messages'],
  ['push-notifications', 'Push notifications'],
  ['logger', 'Logging'],
  ['file', 'File upload'],
  ['models', 'Models'],
  ['getting-started', 'Getting started'],
]);

const fieldDescriptions = new Map([
  ['userID', 'User ID.'],
  ['groupID', 'Group ID.'],
  ['clientMsgID', 'Client message ID.'],
  ['conversationID', 'Conversation ID.'],
  ['nickname', 'Nickname.'],
  ['faceURL', 'Avatar URL.'],
  ['gender', 'Gender.'],
  ['phoneNumber', 'Phone number.'],
  ['birth', 'Birthday timestamp.'],
  ['email', 'Email address.'],
  ['ex', 'Extension field.'],
  ['remark', 'Remark.'],
  ['createTime', 'Creation time.'],
  ['recvID', 'Receiver user ID for one-to-one chats.'],
  ['sendID', 'Sender user ID.'],
  ['senderUserID', 'Sender user ID.'],
  ['groupName', 'Group name.'],
  ['notification', 'Notification content.'],
  ['ownerUserID', 'Group owner user ID.'],
  ['memberCount', 'Group member count.'],
  ['status', 'Status value.'],
  ['errCode', 'Error code.'],
  ['errMsg', 'Error message.'],
  ['url', 'Resource URL.'],
  ['size', 'Resource size.'],
  ['type', 'Type value.'],
  ['content', 'Content.'],
  ['text', 'Text content.'],
  ['duration', 'Duration.'],
  ['uuid', 'Unique ID.'],
  ['longitude', 'Longitude.'],
  ['latitude', 'Latitude.'],
]);

const callbackDescriptions = new Map([
  ['onError', 'Called when the operation fails.'],
  ['onSuccess', 'Called when the operation succeeds.'],
  ['onProgress', 'Called when progress changes.'],
  ['onConnectFailed', 'Called when connecting to the server fails.'],
  ['onConnectSuccess', 'Called after the server connection succeeds.'],
  ['onConnecting', 'Called while the SDK is connecting to the server.'],
  ['onKickedOffline', 'Called when the current user is kicked offline.'],
  ['onUserTokenExpired', 'Called when the login token expires.'],
  ['onUserTokenInvalid', 'Called when the login token is invalid.'],
  ['onRecvNewMessage', 'Called when a new message is received.'],
  ['onNewConversation', 'Called when a new conversation is created.'],
  ['onConversationChanged', 'Called when conversation data changes.'],
  ['onTotalUnreadMessageCountChanged', 'Called when the total unread count changes.'],
]);

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
