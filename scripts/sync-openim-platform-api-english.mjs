import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const localRoot = '/docs/chat/platform-api/v3';
const contentRoot = 'content/docs/chat/platform-api/v3';
const zhContentRoot = 'content/zh/docs/chat/platform-api/v3';
const contextKey = 'chat/platform-api/v3';

const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const structurePath = resolve(root, 'data/structure/chat-pages.json');

let platformRouteByPath = new Map();

async function main() {
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  const platformRoutes = routes.filter((route) => route.contextKey === contextKey);
  platformRouteByPath = new Map(platformRoutes.map((route) => [route.path, route]));

  await removeUnroutedEnglishFiles(new Set(platformRoutes.map((route) => route.contentFile)));

  for (const route of platformRoutes) {
    const source = await readPlatformSource(route);
    const parsed = parseMdx(source);
    const existingEnglish = await readOptional(resolve(root, route.contentFile));
    const existingFrontmatter = parseMdx(existingEnglish ?? '').frontmatter;
    const title = titleForRoute(route.path);
    const description = descriptionForRoute(route, title);
    const frontmatter = {
      title,
      description,
      product: route.product,
      context: route.contextKey,
      template: route.template,
      status: route.status,
      lastUpdated: existingFrontmatter.lastUpdated ?? today,
      version: route.version,
      sourcePath: route.sourcePath,
    };
    const body =
      route.template === 'api'
        ? renderApiPage(route, parsed.body, title)
        : renderOverviewPage(route, title);

    route.title = title;
    route.description = description;

    await mkdir(dirname(resolve(root, route.contentFile)), { recursive: true });
    await writeFile(
      resolve(root, route.contentFile),
      `---\n${renderFrontmatter(frontmatter)}\n---\n\n${body.trim()}\n`,
      'utf8',
    );
  }

  const platformContext = navigation.contexts.find((context) => context.key === contextKey);
  if (platformContext) {
    localizeEnglishNavigation(platformContext.nodes);
    platformContext.title = 'Platform API';
  }

  const structureRecords = await updateStructureRecords(routes);

  await Promise.all([
    writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8'),
    writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8'),
    writeFile(structurePath, `${JSON.stringify(structureRecords, null, 2)}\n`, 'utf8'),
  ]);

  console.log(`Synchronized ${platformRoutes.length} OpenIM Platform API English page(s).`);
}

async function readPlatformSource(route) {
  const localizedFile = resolve(root, zhContentRoot, `${route.path.slice(localRoot.length + 1)}.mdx`);
  return (await readOptional(localizedFile)) ?? (await readOptional(resolve(root, route.contentFile))) ?? '';
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

async function readOptional(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return undefined;
  }
}

async function updateStructureRecords(routes) {
  const structureRecords = JSON.parse(await readFile(structurePath, 'utf8'));
  const platformRoutes = routes.filter((route) => route.contextKey === contextKey);
  const platformByPath = new Map(platformRoutes.map((route) => [route.path, route]));
  const seen = new Set();
  const next = [];

  for (const record of structureRecords) {
    if (record.context !== contextKey) {
      next.push(record);
      continue;
    }

    const route = platformByPath.get(record.openimPath);
    if (!route) continue;
    seen.add(route.path);
    next.push(structureRecordFromRoute(route));
  }

  const missing = platformRoutes.filter((route) => !seen.has(route.path)).map(structureRecordFromRoute);
  return [...next, ...missing];
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

function renderApiPage(route, sourceBody, title) {
  const { endpoint, method } = extractHttpRequest(sourceBody);
  const requestJson = sanitizeJsonValue(extractRequestJson(sourceBody));
  const responseJson =
    sanitizeJsonValue(extractResponseJson(sourceBody)) ?? defaultSuccessResponse();
  const requestFields = extractRequestFields(sourceBody, requestJson);
  const responseFields = extractResponseFields(sourceBody, responseJson);
  const requiresAdminToken = sourceBody.includes('token:') || sourceBody.includes('| token');
  const moduleName = moduleLabel(route.path);

  return [
    `${title} is an OpenIM ${moduleName} REST API for trusted backend services. Configure the API address and administrator token in [Prepare to use the API](/docs/chat/platform-api/v3/prepare-to-use-api) before calling management endpoints.`,
    '## HTTP request',
    `\`\`\`bash\n${method} {API_ADDRESS}${endpoint}\n\`\`\``,
    '### Request example',
    renderCurlExample({ endpoint, method, requestJson, requiresAdminToken }),
    requiresAdminToken
      ? '> Keep administrator tokens on trusted backend services only. Client applications should use user tokens issued by your backend.'
      : '',
    '## Request body',
    requestJson
      ? `\`\`\`json\n${json(requestJson)}\n\`\`\`\n\n${renderTable(
          ['Parameter', 'Required', 'Type', 'Description'],
          requestFields,
        )}`
      : 'This endpoint does not require a JSON request body.',
    '## Response',
    'OpenIM usually returns `200 OK` when the request reaches the service. Use `errCode` in the JSON response to determine business success; `errCode === 0` means the operation succeeded.',
    `\`\`\`json\n${json(responseJson)}\n\`\`\``,
    '### Response fields',
    renderTable(['Field', 'Type', 'Description'], responseFields),
    '### Error response',
    'When a request fails, OpenIM returns the same error envelope. See [Error codes](/docs/chat/platform-api/v3/error-codes) for the full handling model.',
    `\`\`\`json\n${json({
      errCode: 1004,
      errMsg: 'RecordNotFoundError',
      errDlt: ': [1004]RecordNotFoundError',
    })}\n\`\`\``,
    renderTable(
      ['Scenario', 'Possible cause', 'Recommended action'],
      [
        [
          'Authentication failed',
          '`token` is missing, expired, or not an administrator token.',
          'Issue a new administrator token and keep it on the backend.',
        ],
        [
          'Traceability is weak',
          '`operationID` is missing or reused across many requests.',
          'Generate a unique `operationID` for every request and log it with the response.',
        ],
        [
          'Validation failed',
          'The request body has an invalid type, missing field, or unsupported enum value.',
          'Compare the payload with the request table and retry after correcting the fields.',
        ],
      ],
    ),
    '## Permissions and limits',
    [
      '- Call this endpoint from a trusted backend service.',
      '- Log `operationID`, the endpoint path, and the response error fields for troubleshooting.',
      '- Treat write operations as state-changing. If a retry follows an uncertain failure, check the resource state first.',
    ].join('\n'),
    '## Related pages',
    renderLinks(relatedLinks(route)),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function renderOverviewPage(route, title) {
  if (route.path === `${localRoot}/overview`) return renderRootOverview();
  if (route.path === `${localRoot}/prepare-to-use-api`) return renderPrepareToUseApi();
  if (route.path === `${localRoot}/error-codes`) return renderErrorCodes();
  if (route.path === `${localRoot}/migration-to-openim`) return renderMigration();

  const moduleInfo = moduleOverview(route.path);
  if (!moduleInfo) {
    return `This page introduces ${title.toLowerCase()} for the OpenIM Platform API.\n\n## Capability scope\n\n${renderTable(
      ['Capability', 'Description'],
      [['Platform API', 'Use trusted backend services to call OpenIM REST APIs.']],
    )}\n\n## Common APIs\n\n${renderLinks([[title, route.path]])}\n\n## Integration advice\n\nKeep administrator credentials on the backend and log every request with an operation ID.\n\n## Related pages\n\n${renderLinks([
      ['Prepare to use the API', '/docs/chat/platform-api/v3/prepare-to-use-api'],
      ['Error codes', '/docs/chat/platform-api/v3/error-codes'],
    ])}`;
  }

  return `${moduleInfo.intro}\n\n## Capability scope\n\n${renderTable(
    ['Capability', 'Description'],
    moduleInfo.capabilities,
  )}\n\n## Common APIs\n\n${renderLinks(moduleInfo.commonLinks)}\n\n## Integration advice\n\n${moduleInfo.advice.join(
    '\n\n',
  )}\n\n## Related pages\n\n${renderLinks([
    ['Prepare to use the API', '/docs/chat/platform-api/v3/prepare-to-use-api'],
    ['Error codes', '/docs/chat/platform-api/v3/error-codes'],
  ])}`;
}

function renderRootOverview() {
  return `OpenIM Platform API is the server-side REST API surface for trusted backend services. It covers authentication, users, relationships, groups, conversations, messages, third-party services, migration workflows, and error handling.

## Common tasks

### Authentication

Issue administrator tokens for backend calls and user tokens for SDK login.

- [Prepare to use the API](/docs/chat/platform-api/v3/prepare-to-use-api)
- [Get an administrator token](/docs/chat/platform-api/v3/auth/tokens/get-admin-token)
- [Get a user token](/docs/chat/platform-api/v3/auth/tokens/get-user-token)

### User management

Create, update, and query OpenIM users while keeping registration and authorization rules in your business system.

- [Create a user](/docs/chat/platform-api/v3/user/creating-users/create-a-user)
- [List users](/docs/chat/platform-api/v3/user/listing-users/list-users)
- [Get a user](/docs/chat/platform-api/v3/user/listing-users/get-a-user)

### Messages

Send messages from the backend, deliver business notifications, and maintain message state.

- [Send a message](/docs/chat/platform-api/v3/message/sending-messages/send-msg)
- [Batch send messages](/docs/chat/platform-api/v3/message/sending-messages/batch-send-msg)
- [Search messages](/docs/chat/platform-api/v3/message/retrieving-messages/search-msg)

## Recommended modules

### Relationships

Use relationship APIs to manage friends, friend requests, and blacklists.

- [Apply to add a friend](/docs/chat/platform-api/v3/relation/managing-friend-requests/apply-to-add-friend)
- [List friends](/docs/chat/platform-api/v3/relation/listing-friends/list-friends)
- [Add to blacklist](/docs/chat/platform-api/v3/relation/blacklist/add-black)

### Groups

Use group APIs to create groups, invite members, process join requests, and manage moderation.

- [Create a group](/docs/chat/platform-api/v3/group/managing-groups/create-group)
- [Invite users to a group](/docs/chat/platform-api/v3/group/group-members/invite-users-to-group)
- [Mute a group member](/docs/chat/platform-api/v3/group/group-moderation/mute-group-member)

### Conversations and third-party services

Conversation APIs help backend services inspect and repair conversation state. Third-party service APIs cover monitoring, push helpers, logs, and object storage.

- [Get sorted conversations](/docs/chat/platform-api/v3/conversation/listing-conversations/get-sorted-conversation-list)
- [Open monitoring dashboard](/docs/chat/platform-api/v3/third/monitoring/prometheus)
- [Initiate multipart upload](/docs/chat/platform-api/v3/third/object-storage/initiate-multipart-upload)

## Resources

| Field | Value |
| ---- | ----- |
| Access model | Backend-to-backend HTTP JSON requests |
| Authentication | Administrator token for management APIs |
| Trace header | Use \`operationID\` to connect client, backend, and OpenIM logs |

- [OpenIM REST API introduction](https://docs.openim.io/restapi/apis/introduction)
- [OpenIM error codes](https://docs.openim.io/restapi/errCode)`;
}

function renderPrepareToUseApi() {
  return `Before calling OpenIM Platform API endpoints, configure the base API address, common headers, authentication tokens, and JSON request conventions.

## Base URL

Use the API address from your OpenIM deployment as the base URL. Replace \`{API_ADDRESS}\` in endpoint examples with your gateway or server address.

\`\`\`bash
{API_ADDRESS}
\`\`\`

Production deployments should keep management endpoints reachable only from trusted backend services.

## Headers

Most OpenIM management APIs use JSON request bodies and the following headers.

| Header | Required | Description |
| ------ | -------- | ----------- |
| Content-Type | Yes | Use \`application/json; charset=utf-8\` for JSON requests. |
| operationID | Yes | Unique trace ID for the request. Generate a new value for each backend call. |
| token | Management APIs | Administrator token issued by the OpenIM authentication API. |

## Authentication

Backend services should first obtain an administrator token, then pass it in the \`token\` header for user, group, message, conversation, and other management APIs. User tokens for SDK login should also be issued by the backend.

1. Configure the OpenIM API address and administrator credentials on the backend.
2. Call the administrator token API.
3. Use the administrator token to call management APIs.
4. Issue user tokens when clients need to log in to the SDK.

- [Get an administrator token](/docs/chat/platform-api/v3/auth/tokens/get-admin-token)
- [Get a user token](/docs/chat/platform-api/v3/auth/tokens/get-user-token)

## Request body

Current OpenIM Platform API pages use fixed endpoint paths and JSON request bodies. Do not move user IDs, group IDs, pagination fields, or message payloads into URL query strings unless a specific endpoint says so.`;
}

function renderMigration() {
  return `When migrating to OpenIM, normalize existing data into OpenIM users, relationships, groups, conversations, and messages, then import it from trusted backend jobs. Do not run migration workflows from client applications.

## Capability scope

| Source data | OpenIM target | Description |
| ----------- | ------------- | ----------- |
| Accounts and profiles | Users | Register users first, then fill nickname, avatar, and extension fields. |
| Friend relationships | Relationships | Import historical friends and migrate blacklist data separately. |
| Groups and members | Groups | Create groups before importing or inviting members. |
| Historical messages | Messages | Write historical records by conversation, sender, timestamp, and message type. |
| Conversation state | Conversations | Rebuild pinned, muted, unread, and offline-push state after core data is imported. |

## Common APIs

${renderLinks([
    ['Create a user', '/docs/chat/platform-api/v3/user/creating-users/create-a-user'],
    ['List users', '/docs/chat/platform-api/v3/user/listing-users/list-users'],
    ['Import friends', '/docs/chat/platform-api/v3/relation/managing-friends/import-friends'],
    ['Create a group', '/docs/chat/platform-api/v3/group/managing-groups/create-group'],
    ['Invite users to a group', '/docs/chat/platform-api/v3/group/group-members/invite-users-to-group'],
    ['Send a message', '/docs/chat/platform-api/v3/message/sending-messages/send-msg'],
    ['Batch send messages', '/docs/chat/platform-api/v3/message/sending-messages/batch-send-msg'],
  ])}

## Integration advice

Run migration in repeatable batches. Record the source primary key, OpenIM target ID, operation time, \`operationID\`, response, and failure reason for each item.

Import users first, then relationships and groups, then historical messages, and finally conversation state. Before retrying failed writes, check whether the target resource already exists.

## Related pages

${renderLinks([
    ['Prepare to use the API', '/docs/chat/platform-api/v3/prepare-to-use-api'],
    ['User overview', '/docs/chat/platform-api/v3/user/overview'],
    ['Relationship overview', '/docs/chat/platform-api/v3/relation/overview'],
    ['Group overview', '/docs/chat/platform-api/v3/group/overview'],
    ['Message overview', '/docs/chat/platform-api/v3/message/overview'],
    ['Error codes', '/docs/chat/platform-api/v3/error-codes'],
  ])}`;
}

function renderErrorCodes() {
  return `OpenIM REST APIs use a common error response envelope. A request may return HTTP \`200 OK\` and still fail at the business layer, so always check \`errCode\`; \`errCode === 0\` means the operation succeeded.

## Response structure

\`\`\`json
{
  "errCode": 1001,
  "errMsg": "ArgsError",
  "errDlt": "request body or header is invalid"
}
\`\`\`

| Field | Type | Description |
| ----- | ---- | ----------- |
| errCode | int | OpenIM business error code. \`0\` means success. |
| errMsg | string | Short error message for logs and diagnostics. |
| errDlt | string | Detailed error text for parameter, permission, or server-state troubleshooting. |
| data | object | Successful responses may include endpoint-specific data. |

## Error code ranges

| Range | Source | Description |
| ----- | ------ | ----------- |
| 0 | Common success code | The business operation succeeded. |
| 1-9999 | OpenIM server errors | Main REST API and server-side error range. |
| 10000-20000 | OpenIM client errors | SDK or client runtime errors, not expanded as server Platform API codes. |
| 20001-29999 | Business webhook errors | Custom backend errors returned by webhook or business logic. |

## Handling flow

1. Check the HTTP status first for network, gateway, or infrastructure failures.
2. Parse the JSON response and use \`errCode\` as the business success flag.
3. When \`errCode !== 0\`, log \`operationID\`, endpoint path, request summary, \`errCode\`, \`errMsg\`, and \`errDlt\`.
4. Fix authentication, permission, and parameter errors before retrying.
5. Convert internal error details into product-safe messages before showing them to end users.

## Server error codes

| Code | Category | Meaning | Recommended action |
| ---- | -------- | ------- | ------------------ |
| 0 | Success | Success | Continue reading endpoint-specific \`data\`. |
| 500 | Server | Internal server error | Check OpenIM services, dependencies, and internal networking. |
| 1001 | Request | Invalid arguments | Check headers, JSON types, required fields, and enum values. |
| 1002 | Request | Permission denied | Confirm that \`token\` is a valid administrator token and the operation is authorized. |
| 1003 | Request | Duplicate primary key | Check whether the user, group, or business ID was already submitted. |
| 1004 | Request | Record not found | Confirm that the target user, group, message, or relationship exists. |
| 1101 | User | User ID does not exist | Register or import the user before calling dependent APIs. |
| 1102 | User | User already registered | Treat repeated registration as idempotent success or a business conflict. |
| 1201 | Group | Group does not exist | Confirm that \`groupID\` exists and has not been dismissed. |
| 1202 | Group | Group already exists | Use another \`groupID\` or check whether creation already succeeded. |
| 1203 | Group | User is not in the group | Confirm membership before member-level operations. |
| 1204 | Group | Group dismissed | Stop group operations and sync business-side group state. |
| 1205 | Group | Unsupported group type | Check that \`groupType\` is supported by the deployment. |
| 1206 | Group | Group application already processed | Make join-request handling idempotent. |
| 1301 | Relationship | Cannot add yourself as a friend | Reject self-targeted friend operations before calling OpenIM. |
| 1302 | Relationship | Blocked by the other user | Resolve blacklist state before continuing friend workflows. |
| 1303 | Relationship | The target user is not a friend | Establish the relationship before friend-dependent operations. |
| 1304 | Relationship | Already friends | Treat the existing relationship as success. |
| 1401 | Message | Read status is disabled | Avoid workflows that depend on read status when the feature is off. |
| 1402 | Message | Member is muted | Check the member mute end time or unmute before sending. |
| 1403 | Message | Group is muted | Unmute the group before sending. |
| 1404 | Message | Message already revoked | Sync message state in the business system. |
| 1405 | Message | Authorization expired | Refresh the related credential and retry. |
| 1501 | Token | Token expired | Refresh or issue a new token. |
| 1502 | Token | Token invalid | Reissue the token and check signing keys, user ID, and platform. |
| 1503 | Token | Token format error | Check whether the token string was truncated or encoded incorrectly. |
| 1504 | Token | Token not active yet | Check server time and token effective time. |
| 1505 | Token | Unknown token error | Log full details and reissue the token. |
| 1506 | Token | Token was kicked | Ask the client to log in again. |
| 1507 | Token | Token missing | Confirm that the request header or login payload includes a token. |
| 1601 | Connection | Too many gateway connections | Check gateway limits and scale or clear abnormal connections. |
| 1602 | Connection | Invalid connection handshake | Check platform ID, user ID, token, and client version. |
| 1701 | File | Upload expired | Initialize upload again and use fresh credentials. |

## Troubleshooting

| Scenario | Recommendation |
| -------- | -------------- |
| Error cannot be reproduced | Use the same \`operationID\` across business logs, OpenIM API logs, and gateway logs. |
| Many \`1001\` errors | Check JSON field types, required fields, pagination, and headers. |
| Many \`1002\` or \`1501-1507\` errors | Review administrator token issuing, refresh, and storage logic. |
| Group or member errors | Confirm \`groupID\`, member role, group state, and operator permission before retrying. |
| File upload errors | Initialize upload again and verify object name, signature, and expiration time. |`;
}

function moduleOverview(path) {
  const id = path.slice(localRoot.length + 1).split('/')[0];
  return moduleOverviews[id];
}

const moduleOverviews = {
  auth: {
    intro:
      'The authentication module lets backend services obtain management credentials, issue user login tokens, parse tokens, and force sessions offline when required.',
    capabilities: [
      ['Administrator tokens', 'Issue tokens for trusted backend calls to management APIs.'],
      ['User tokens', 'Issue SDK login tokens for specific users and platforms.'],
      ['Session control', 'Force a user session offline for security or account-risk workflows.'],
    ],
    commonLinks: [
      ['Get an administrator token', '/docs/chat/platform-api/v3/auth/tokens/get-admin-token'],
      ['Get a user token', '/docs/chat/platform-api/v3/auth/tokens/get-user-token'],
      ['Force logout', '/docs/chat/platform-api/v3/auth/sessions/force-logout'],
    ],
    advice: [
      'Store administrator tokens only on trusted backend services.',
      'Bind user-token issuing to your business login state, risk controls, and account permissions.',
    ],
  },
  user: {
    intro:
      'The user module maps business accounts to OpenIM users and manages profile data, online status, status subscriptions, and notification accounts.',
    capabilities: [
      ['User registration', 'Register business user IDs with nickname, avatar, and extension data.'],
      ['Profile maintenance', 'Update profile fields and global message receiving options.'],
      ['User queries', 'List users, fetch profiles, and check account existence.'],
      ['Presence', 'Query online status, subscribed status, and online token details.'],
      ['Notification accounts', 'Create, update, and search system notification accounts.'],
    ],
    commonLinks: [
      ['Create a user', '/docs/chat/platform-api/v3/user/creating-users/create-a-user'],
      ['Update a user', '/docs/chat/platform-api/v3/user/managing-users/update-a-user'],
      ['List users', '/docs/chat/platform-api/v3/user/listing-users/list-users'],
      ['Get online status', '/docs/chat/platform-api/v3/user/presence/get-users-online-status'],
      [
        'Add a notification account',
        '/docs/chat/platform-api/v3/user/notification-accounts/add-notification-account',
      ],
    ],
    advice: [
      'Use your business system as the source of truth for user IDs.',
      'Let clients request login credentials from your backend, then let the backend issue OpenIM user tokens.',
    ],
  },
  relation: {
    intro:
      'The relationship module manages friend relationships, friend requests, friend profile updates, and user blacklists from trusted backend services.',
    capabilities: [
      ['Friends', 'Add, delete, import, check, and list friend relationships.'],
      ['Friend requests', 'List received or sent requests and process request decisions.'],
      ['Blacklists', 'Add users to a blacklist, remove them, or list blocked users.'],
      ['Friend metadata', 'Update remarks and extension fields for friend records.'],
    ],
    commonLinks: [
      [
        'Apply to add a friend',
        '/docs/chat/platform-api/v3/relation/managing-friend-requests/apply-to-add-friend',
      ],
      [
        'Respond to a friend request',
        '/docs/chat/platform-api/v3/relation/managing-friend-requests/respond-friend-apply',
      ],
      ['List friends', '/docs/chat/platform-api/v3/relation/listing-friends/list-friends'],
      ['Add to blacklist', '/docs/chat/platform-api/v3/relation/blacklist/add-black'],
      ['Delete a friend', '/docs/chat/platform-api/v3/relation/managing-friends/delete-friend'],
    ],
    advice: [
      'Apply privacy, risk, and notification rules in your backend before changing relationships.',
      'Record blacklist operations with source and operator information for auditability.',
    ],
  },
  group: {
    intro:
      'The group module lets backend services create and manage groups, members, join requests, ownership, moderation, and full data reads.',
    capabilities: [
      ['Group management', 'Create groups, update group profile data, dismiss groups, and transfer ownership.'],
      ['Join workflows', 'Apply to join groups and process group applications.'],
      ['Members', 'Invite, remove, query, and update group members.'],
      ['Moderation', 'Mute or unmute members and whole groups.'],
      ['Full reads', 'Read complete member IDs, joined group IDs, and unhandled application counts.'],
    ],
    commonLinks: [
      ['Create a group', '/docs/chat/platform-api/v3/group/managing-groups/create-group'],
      ['Invite users to a group', '/docs/chat/platform-api/v3/group/group-members/invite-users-to-group'],
      ['Get group members', '/docs/chat/platform-api/v3/group/group-members/get-group-member-list'],
      ['Mute a group member', '/docs/chat/platform-api/v3/group/group-moderation/mute-group-member'],
      [
        'Get unhandled application count',
        '/docs/chat/platform-api/v3/group/group-applications/get-group-application-unhandled-count',
      ],
    ],
    advice: [
      'Group operations affect multiple users, so log the operator, target group, member list, and `operationID`.',
      'Restrict mute, kick, ownership transfer, and dismiss operations to audited backend workflows.',
    ],
  },
  conversation: {
    intro:
      'The conversation module lets backend services inspect and maintain user conversation data, including pinned, muted, and offline-push state.',
    capabilities: [
      ['Conversation reads', 'Get sorted, all, single, or batch conversation records.'],
      ['Conversation settings', 'Set conversation attributes and extension data in batches.'],
      ['Offline push', 'Read users associated with conversation offline push.'],
      ['Full sync', 'Read all conversation IDs for a user.'],
      ['State filters', 'Read pinned and do-not-notify conversation IDs.'],
    ],
    commonLinks: [
      [
        'Get sorted conversations',
        '/docs/chat/platform-api/v3/conversation/listing-conversations/get-sorted-conversation-list',
      ],
      [
        'Get all conversations',
        '/docs/chat/platform-api/v3/conversation/listing-conversations/get-all-conversations',
      ],
      [
        'Set conversations',
        '/docs/chat/platform-api/v3/conversation/managing-conversations/set-conversations',
      ],
      [
        'Get pinned conversation IDs',
        '/docs/chat/platform-api/v3/conversation/conversation-state/get-pinned-conversation-ids',
      ],
    ],
    advice: [
      'Use conversation APIs for admin tooling, data repair, and synchronization support rather than direct client calls.',
      'Validate ownership before batch updates to avoid changing another user\'s conversation state.',
    ],
  },
  message: {
    intro:
      'The message module lets backend services send messages, deliver business notifications, query message state, mark reads, and delete or revoke messages.',
    capabilities: [
      ['Backend sending', 'Send single messages, batch messages, and business notifications.'],
      ['Message retrieval', 'Search messages or pull messages by sequence.'],
      ['Read state', 'Mark messages or conversations as read and maintain read sequence values.'],
      ['Deletion', 'Clear conversation messages, clear all user messages, and delete messages logically or physically.'],
      ['Diagnostics', 'Read latest sequence numbers, send status, and server time.'],
    ],
    commonLinks: [
      ['Send a message', '/docs/chat/platform-api/v3/message/sending-messages/send-msg'],
      ['Batch send messages', '/docs/chat/platform-api/v3/message/sending-messages/batch-send-msg'],
      ['Search messages', '/docs/chat/platform-api/v3/message/retrieving-messages/search-msg'],
      ['Revoke a message', '/docs/chat/platform-api/v3/message/managing-messages/revoke-msg'],
      ['Get server time', '/docs/chat/platform-api/v3/message/retrieving-messages/get-server-time'],
    ],
    advice: [
      'Before backend message sending, verify sender identity, target conversation, and message content in trusted business logic.',
      'Deletion and physical deletion are high-impact actions. Keep audit logs and restrict them to administrative or compliance workflows.',
    ],
  },
  third: {
    intro:
      'The third-party services module connects OpenIM with monitoring, push helpers, client logs, and object storage upload flows.',
    capabilities: [
      ['Monitoring', 'Open Prometheus or Grafana monitoring dashboards.'],
      ['Push helpers', 'Update FCM tokens and set application badge values.'],
      ['Logs', 'Upload, delete, and search client log records.'],
      ['Object upload', 'Get limits, initialize multipart or form uploads, refresh signatures, and complete uploads.'],
      ['Object access', 'Get object URLs or redirect by object path.'],
    ],
    commonLinks: [
      ['Open monitoring dashboard', '/docs/chat/platform-api/v3/third/monitoring/prometheus'],
      ['Update FCM token', '/docs/chat/platform-api/v3/third/push/fcm-update-token'],
      ['Upload logs', '/docs/chat/platform-api/v3/third/logs/upload-logs'],
      [
        'Initiate multipart upload',
        '/docs/chat/platform-api/v3/third/object-storage/initiate-multipart-upload',
      ],
      ['Get object access URL', '/docs/chat/platform-api/v3/third/object-storage/access-url'],
    ],
    advice: [
      'Guard object-storage signatures and log access with backend authorization checks.',
      'Monitoring and log search endpoints are best suited for admin systems, not regular client applications.',
    ],
  },
};

function extractHttpRequest(body) {
  const match = body.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+\{API_ADDRESS\}([^\s`]+)/i);
  return {
    endpoint: match?.[2] ?? endpointFromPath(body) ?? '/unknown',
    method: (match?.[1] ?? 'POST').toUpperCase(),
  };
}

function endpointFromPath(body) {
  const match = body.match(/\$\{API_ADDRESS\}(\/[a-z0-9_/-]+)/i);
  return match?.[1];
}

function extractRequestJson(body) {
  const section = sectionBetween(
    body,
    [/^## 请求体\s*$/m, /^### 请求体参数\s*$/m],
    [/^## 响应\s*$/m],
  );
  return firstJsonBlock(section);
}

function extractResponseJson(body) {
  const section = sectionBetween(
    body,
    [/^## 响应\s*$/m],
    [/^### 错误\s*$/m, /^## 权限/m, /^## 相关/m],
  );
  return firstJsonBlock(section);
}

function firstJsonBlock(section) {
  if (!section) return undefined;
  for (const match of section.matchAll(/```json\s*([\s\S]*?)```/gi)) {
    const parsed = parseJson(match[1]);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function sectionBetween(body, startPatterns, endPatterns) {
  const starts = startPatterns
    .map((pattern) => {
      const match = body.match(pattern);
      return match ? match.index + match[0].length : -1;
    })
    .filter((index) => index >= 0);
  if (starts.length === 0) return '';
  const start = Math.min(...starts);
  const rest = body.slice(start);
  const ends = endPatterns
    .map((pattern) => {
      const match = rest.match(pattern);
      return match ? match.index : -1;
    })
    .filter((index) => index >= 0);
  const end = ends.length > 0 ? Math.min(...ends) : rest.length;
  return rest.slice(0, end);
}

function extractRequestFields(body, requestJson) {
  const section = sectionBetween(
    body,
    [/^## 请求体\s*$/m, /^### 请求体参数\s*$/m],
    [/^## 响应\s*$/m],
  );
  const table = firstDataTable(section);
  const rows = table
    .filter((row) => row[0] && !/^(参数名|Header|请求头)$/i.test(row[0]))
    .map((row) => {
      const field = normalizeFieldName(row[0]);
      return [
        field,
        normalizeRequired(row[1]),
        normalizeType(row[2] ?? inferTypeByPath(requestJson, row[0])),
        describeField(field),
      ];
    });
  return rows.length > 0 ? rows : flattenJsonFields(requestJson).map(requestFieldRow);
}

function extractResponseFields(body, responseJson) {
  const section = sectionBetween(
    body,
    [/^### 响应参数\s*$/m, /^#### 响应属性列表\s*$/m],
    [/^### 错误\s*$/m, /^## 权限/m, /^## 相关/m],
  );
  const table = firstDataTable(section);
  const rows = table
    .filter((row) => row[0] && !/^(参数名|Field|字段)$/i.test(row[0]))
    .map((row) => {
      const field = normalizeFieldName(row[0]);
      return [
        field,
        normalizeType(row[1] ?? inferTypeByPath(responseJson, row[0])),
        describeField(field),
      ];
    });
  return rows.length > 0 ? rows : flattenJsonFields(responseJson).map(responseFieldRow);
}

function firstDataTable(section) {
  const lines = section.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith('|')) continue;
    const table = [];
    while (index < lines.length && lines[index].trim().startsWith('|')) {
      const cells = splitMarkdownRow(lines[index]);
      if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))) table.push(cells);
      index += 1;
    }
    if (table.length > 1) return table.slice(1);
  }
  return [];
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function flattenJsonFields(value, prefix = '') {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    const rows = prefix ? [[prefix, 'array']] : [];
    const first = value.find((item) => item && typeof item === 'object') ?? value[0];
    if (first && typeof first === 'object') {
      rows.push(...flattenJsonFields(first, `${prefix}[]`));
    }
    return rows;
  }
  if (typeof value === 'object') {
    const rows = [];
    if (prefix) rows.push([prefix, 'object']);
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (child && typeof child === 'object') rows.push(...flattenJsonFields(child, path));
      else rows.push([path, valueType(child)]);
    }
    return rows;
  }
  return prefix ? [[prefix, valueType(value)]] : [];
}

function requestFieldRow([field, type]) {
  return [field, 'Yes', type, describeField(field)];
}

function responseFieldRow([field, type]) {
  return [field, type, describeField(field)];
}

function inferTypeByPath(value, path) {
  if (!value || !path) return 'string';
  const normalized = path.replace(/\[\]/g, '.0').split('.');
  let cursor = value;
  for (const segment of normalized) {
    if (cursor === undefined || cursor === null) return 'string';
    cursor = cursor[segment];
  }
  return valueType(cursor);
}

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (Number.isInteger(value)) return 'int';
  return typeof value === 'number' ? 'number' : typeof value;
}

function normalizeRequired(value = '') {
  if (/^(是|必填|required|yes)$/i.test(value.trim())) return 'Yes';
  if (/^(否|可选|选填|optional|no)$/i.test(value.trim())) return 'No';
  if (/^(条件|条件必填|conditional)$/i.test(value.trim())) return 'Conditional';
  return value || 'Yes';
}

function normalizeFieldName(value = '') {
  if (value === '(空对象)' || value === '（空对象）') return 'empty object';
  return containsCjk(value) ? 'field' : value;
}

function normalizeType(value = '') {
  return String(value)
    .replace(/\berrDlt\b/g, 'string')
    .replace(/\bbool\b/g, 'boolean')
    .replace(/\bint64\b/g, 'int64')
    .trim()
    .toLowerCase();
}

function renderCurlExample({ endpoint, method, requestJson, requiresAdminToken }) {
  const parts = [
    `curl --request ${method} "\${API_ADDRESS}${endpoint}"`,
    '  --header "Content-Type: application/json; charset=utf-8"',
    '  --header "operationID: ${OPERATION_ID}"',
    requiresAdminToken ? '  --header "token: ${ADMIN_TOKEN}"' : '',
    requestJson ? `  --data-raw '${json(requestJson)}'` : '',
  ].filter(Boolean);
  return `\`\`\`bash\n${parts.join(' \\\n')}\n\`\`\``;
}

function defaultSuccessResponse() {
  return {
    errCode: 0,
    errMsg: '',
    errDlt: '',
  };
}

function sanitizeJsonValue(value, key = '') {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((item) => sanitizeJsonValue(item, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeJsonValue(childValue, childKey),
      ]),
    );
  }
  if (typeof value === 'string' && containsCjk(value)) return englishSampleValue(key);
  return value;
}

function englishSampleValue(key) {
  const normalized = key.toLowerCase();
  if (normalized.includes('nickname')) return 'Alice';
  if (normalized.includes('groupname')) return 'Product Discussion';
  if (normalized.includes('notification')) return 'Welcome to OpenIM';
  if (normalized.includes('introduction')) return 'Group for product discussions';
  if (normalized.includes('reason')) return 'Approved by backend workflow';
  if (normalized.includes('content')) return 'Hello from OpenIM';
  if (normalized.includes('remark')) return 'Friend remark';
  if (normalized.includes('ex')) return '';
  return 'Example value';
}

function parseJson(value) {
  try {
    return JSON.parse(value.trim());
  } catch {
    return undefined;
  }
}

function describeField(field = '') {
  const normalized = field
    .replace(/^data\./, '')
    .replace(/\[\]/g, '')
    .split('.')
    .at(-1)
    ?.toLowerCase();
  const exact = {
    errcode: 'Business error code. `0` means success.',
    errmsg: 'Short error message.',
    errdlt: 'Detailed error information for troubleshooting.',
    data: 'Endpoint-specific response data.',
    token: 'OpenIM authentication token.',
    expiretimeseconds: 'Token expiration time in seconds.',
    operationid: 'Unique request trace ID.',
    pagination: 'Pagination settings.',
    pagenumber: 'Page number, starting from 1.',
    shownumber: 'Number of records to return per page.',
    total: 'Total number of matching records.',
    userid: 'OpenIM user ID.',
    userids: 'List of OpenIM user IDs.',
    fromuserid: 'Sender user ID.',
    sendid: 'Sender user ID.',
    recvuserid: 'Receiver user ID.',
    groupid: 'OpenIM group ID.',
    groupids: 'List of OpenIM group IDs.',
    conversationid: 'OpenIM conversation ID.',
    conversationids: 'List of OpenIM conversation IDs.',
    clientmsgid: 'Client-side message ID.',
    servermsgid: 'Server-side message ID.',
    sendtime: 'Message send time, usually a millisecond timestamp.',
    createtime: 'Creation time, usually a millisecond timestamp.',
    updatetime: 'Update time, usually a millisecond timestamp.',
    nickname: 'User nickname.',
    faceurl: 'Avatar or icon URL.',
    ex: 'Business extension field.',
    appmangerlevel: 'Application manager level returned by OpenIM.',
    globalrecvmsgopt: 'Global message receiving option.',
    platformid: 'Client platform ID.',
    platformids: 'List of client platform IDs.',
    status: 'Status value returned by OpenIM.',
    online: 'Online status value.',
    groupinfo: 'Group profile object.',
    groupname: 'Group name.',
    owneruserid: 'Group owner user ID.',
    memberuserids: 'List of regular group member user IDs.',
    adminuserids: 'List of group administrator user IDs.',
    membercount: 'Number of group members.',
    grouptype: 'OpenIM group type.',
    needverification: 'Join verification policy.',
    lookmemberinfo: 'Whether members can view group member information.',
    applymemberfriend: 'Whether members can add each other as friends from the group.',
    sendmessage: 'Whether OpenIM should send a notification message for this operation.',
    notification: 'Group announcement or notification text.',
    introduction: 'Group introduction.',
    reason: 'Reason submitted for the operation.',
    remark: 'Friend remark.',
    contenttype: 'OpenIM message content type.',
    sessiontype: 'OpenIM session type.',
    content: 'Message content payload.',
    seq: 'Message sequence number.',
    maxseq: 'Maximum message sequence number.',
    minseq: 'Minimum message sequence number.',
    hasreadseq: 'Read sequence number.',
    isbackground: 'Whether the client connection is in the background.',
    url: 'Resource URL.',
    name: 'Resource name.',
    filename: 'File name.',
    filesize: 'File size.',
    partsize: 'Multipart upload part size.',
    uploadid: 'Multipart upload ID.',
    objectname: 'Object storage key.',
  };
  if (normalized && exact[normalized]) return exact[normalized];
  return `The ${humanizeKey(field)} value.`;
}

function humanizeKey(value) {
  const key = value
    .replace(/^data\./, '')
    .replace(/\[\]/g, '')
    .split('.')
    .at(-1);
  return (key || 'field')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\bID\b/g, 'ID')
    .toLowerCase();
}

function relatedLinks(route) {
  const links = [
    ['Prepare to use the API', '/docs/chat/platform-api/v3/prepare-to-use-api'],
    ['Error codes', '/docs/chat/platform-api/v3/error-codes'],
  ];
  const moduleSegment = route.path.slice(localRoot.length + 1).split('/')[0];
  const overview = `${localRoot}/${moduleSegment}/overview`;
  if (moduleSegment && platformRouteByPath.has(overview) && route.path !== overview) {
    links.splice(1, 0, [`${moduleLabel(route.path)} overview`, overview]);
  }
  return links;
}

function localizeEnglishNavigation(nodes) {
  for (const node of nodes) {
    if (node.href) {
      node.title = platformRouteByPath.get(node.href)?.title ?? titleForRoute(node.href);
    } else {
      node.title = navigationLabel(node.segment);
    }
    localizeEnglishNavigation(node.children ?? []);
  }
}

function titleForRoute(path) {
  const exact = {
    [`${localRoot}/overview`]: 'Overview',
    [`${localRoot}/prepare-to-use-api`]: 'Prepare to use the API',
    [`${localRoot}/error-codes`]: 'Error codes',
    [`${localRoot}/migration-to-openim`]: 'Migrate to OpenIM',
    [`${localRoot}/auth/tokens/get-admin-token`]: 'Get an administrator token',
    [`${localRoot}/auth/tokens/get-user-token`]: 'Get a user token',
    [`${localRoot}/relation/managing-friend-requests/apply-to-add-friend`]:
      'Apply to add a friend',
    [`${localRoot}/relation/managing-friends/delete-friend`]: 'Delete a friend',
    [`${localRoot}/relation/blacklist/add-black`]: 'Add to blacklist',
    [`${localRoot}/relation/blacklist/list-blacks`]: 'List blacklisted users',
    [`${localRoot}/relation/blacklist/remove-black`]: 'Remove from blacklist',
    [`${localRoot}/user/notification-accounts/add-notification-account`]:
      'Add a notification account',
    [`${localRoot}/user/notification-accounts/update-notification-account`]:
      'Update a notification account',
    [`${localRoot}/user/notification-accounts/search-notification-account`]:
      'Search notification accounts',
    [`${localRoot}/user/presence/get-users-online-status`]: "Get users' online status",
    [`${localRoot}/user/presence/get-users-online-token-detail`]:
      'Get users online token details',
    [`${localRoot}/third/monitoring/prometheus`]: 'Open monitoring dashboard',
    [`${localRoot}/third/object-storage/part-limit`]: 'Get upload part limits',
    [`${localRoot}/third/object-storage/part-size`]: 'Calculate upload part size',
    [`${localRoot}/third/object-storage/auth-sign`]: 'Refresh multipart upload signature',
    [`${localRoot}/third/object-storage/access-url`]: 'Get object access URL',
    [`${localRoot}/third/object-storage/object-redirect`]: 'Redirect object access',
    [`${localRoot}/message/retrieving-messages/newest-seq`]: 'Get latest sequence',
    [`${localRoot}/message/retrieving-messages/pull-msg-by-seq`]: 'Pull messages by sequence',
    [`${localRoot}/message/deleting-messages/delete-msg-physical`]:
      'Physically delete messages by time',
    [`${localRoot}/message/deleting-messages/delete-msg-physical-by-seq`]:
      'Physically delete messages by sequence',
    [`${localRoot}/message/read-status/get-conversations-has-read-and-max-seq`]:
      'Get conversation read and max sequence',
    [`${localRoot}/message/read-status/set-conversation-has-read-seq`]:
      'Set conversation read sequence',
    [`${localRoot}/group/group-applications/respond-group-application`]:
      'Respond to a group application',
    [`${localRoot}/relation/managing-friend-requests/respond-friend-apply`]:
      'Respond to a friend request',
  };
  if (exact[path]) return exact[path];
  if (path.endsWith('/overview')) return 'Overview';
  return titleFromSlug(path.split('/').at(-1) ?? '');
}

function titleFromSlug(slug) {
  const words = slug
    .split('-')
    .map((word) => titleWord(word))
    .join(' ')
    .replace(/\bMsg\b/g, 'Message')
    .replace(/\bMsgs\b/g, 'Messages')
    .replace(/\bSeq\b/g, 'Sequence')
    .replace(/\bFcm\b/g, 'FCM')
    .replace(/\bId\b/g, 'ID')
    .replace(/\bIds\b/g, 'IDs')
    .replace(/\bUrl\b/g, 'URL')
    .replace(/\bApi\b/g, 'API');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function titleWord(word) {
  const replacements = {
    msg: 'message',
    msgs: 'messages',
    seq: 'sequence',
    uid: 'user ID',
    ids: 'IDs',
    id: 'ID',
    fcm: 'FCM',
    url: 'URL',
    ex: 'extension',
  };
  return replacements[word] ?? word;
}

function descriptionForRoute(route, title) {
  if (route.template === 'overview') {
    return `${title} for the OpenIM Platform API.`;
  }
  return `${title} with the OpenIM Platform API, including endpoint, request body, response fields, and error handling.`;
}

function moduleLabel(path) {
  const segment = path.slice(localRoot.length + 1).split('/')[0];
  const labels = {
    auth: 'authentication',
    user: 'user',
    relation: 'relationship',
    group: 'group',
    conversation: 'conversation',
    message: 'message',
    third: 'third-party service',
  };
  return labels[segment] ?? 'platform';
}

function navigationLabel(segment) {
  const labels = {
    auth: 'Authentication',
    user: 'User',
    relation: 'Relationships',
    group: 'Groups',
    conversation: 'Conversations',
    message: 'Messages',
    third: 'Third-party services',
    tokens: 'Tokens',
    sessions: 'Sessions',
    'creating-users': 'Creating users',
    'listing-users': 'Listing users',
    'managing-users': 'Managing users',
    presence: 'Presence',
    'notification-accounts': 'Notification accounts',
    'managing-friend-requests': 'Friend requests',
    'listing-friends': 'Listing friends',
    'managing-friends': 'Managing friends',
    blacklist: 'Blacklist',
    'managing-groups': 'Managing groups',
    'group-applications': 'Group applications',
    'group-members': 'Group members',
    'group-membership': 'Group membership',
    'group-moderation': 'Group moderation',
    'listing-conversations': 'Listing conversations',
    'managing-conversations': 'Managing conversations',
    'conversation-state': 'Conversation state',
    'retrieving-messages': 'Retrieving messages',
    'sending-messages': 'Sending messages',
    'managing-messages': 'Managing messages',
    'read-status': 'Read status',
    'deleting-messages': 'Deleting messages',
    monitoring: 'Monitoring',
    push: 'Push',
    logs: 'Logs',
    'object-storage': 'Object storage',
  };
  return labels[segment] ?? titleFromSlug(segment);
}

function renderLinks(links) {
  return links.map(([label, href]) => `- [${label}](${href})`).join('\n');
}

function renderTable(headers, rows) {
  return [headers, headers.map(() => '---'), ...rows]
    .map((row) => `| ${row.map(escapeCell).join(' | ')} |`)
    .join('\n');
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

function renderFrontmatter(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

function parseMdx(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: source.trim(), frontmatter: {} };
  return {
    body: source.slice(match[0].length).trim(),
    frontmatter: parseFrontmatterBlock(match[1]),
  };
}

function parseFrontmatterBlock(value) {
  const result = {};
  for (const line of value.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!key || !raw) continue;
    try {
      result[key] = JSON.parse(raw);
    } catch {
      result[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

await main();
