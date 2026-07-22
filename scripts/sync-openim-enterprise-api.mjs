import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { format } from 'prettier';
import { enterpriseEndpoints, meetingEndpoints } from './enterprise-platform-api-specs.mjs';
import {
  webhookCategoryTitles,
  webhookRoute,
  webhookSpecs,
} from './openim-webhook-specs.mjs';

const root = process.cwd();
const serverRoot =
  process.env.OPENIM_ENTERPRISE_SERVER ?? '/Users/gordon/GolandProjects/open-im-server-enterprise';
const openSourceServerRoot =
  process.env.OPENIM_OPEN_SOURCE_SERVER ?? '/Users/gordon/GolandProjects/open-im-server';
const protocolRoot = resolve(serverRoot, 'pkg/protocol');
const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const localizedPath = resolve(root, 'src/generated/platform-api-zh-content.json');
const allEndpoints = [...enterpriseEndpoints, ...meetingEndpoints];
const metadataOnly = process.env.OPENIM_ENTERPRISE_METADATA_ONLY === '1';
let activeProtocol;

async function main() {
  await validateRouteCoverage();
  const schema = await loadProtocol(protocolRoot);
  activeProtocol = schema;
  validateSpecs(allEndpoints, schema);
  if (!metadataOnly) {
    await removeGeneratedDirectories();
    await writeOverviewPages(schema);

    for (const spec of allEndpoints) {
      const rpc = getRpc(spec, schema);
      const body =
        spec.special === 'stream-put' ? renderStreamPutPage(spec) : renderApiPage(spec, rpc, schema);
      await writePage(contentFile(spec), body);
    }
  }

  await updateGeneratedData(allEndpoints);
  console.log(
    metadataOnly
      ? 'Updated Chinese commercial Platform API navigation and routes.'
      : `Wrote ${allEndpoints.length + 2} Chinese commercial Platform API pages.`,
  );
}

async function validateRouteCoverage() {
  const enterpriseRoutes = parseRouter(
    await readFile(resolve(serverRoot, 'internal/api/router.go'), 'utf8'),
  );
  const openSourceRoutes = parseRouter(
    await readFile(resolve(openSourceServerRoot, 'internal/api/router.go'), 'utf8'),
  );
  const openSourceKeys = new Set(openSourceRoutes.map(routeKey));
  const expected = new Set(
    enterpriseRoutes
      .filter(
        (route) =>
          route.path.startsWith('/rtc-meeting/') ||
          (route.marked && !openSourceKeys.has(routeKey(route))),
      )
      .map(routeKey),
  );
  const documented = new Set(allEndpoints.map((spec) => routeKey(spec)));
  const missing = [...expected].filter((key) => !documented.has(key));
  const extra = [...documented].filter((key) => !expected.has(key));
  if (missing.length || extra.length) {
    throw new Error(
      `Commercial route coverage mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`,
    );
  }
}

function parseRouter(source) {
  const prefixes = new Map([['r', '']]);
  const routes = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const group = line.match(/^(\w+)\s*:=\s*(\w+)\.Group\("([^"]*)"\)/);
    if (group) {
      const parent = prefixes.get(group[2]);
      if (parent !== undefined) prefixes.set(group[1], `${parent}${group[3]}`);
      continue;
    }
    const route = line.match(/^(\w+)\.(GET|POST|PUT|PATCH|DELETE)\("([^"]+)".*\)\s*(1)?$/);
    if (!route) continue;
    const prefix = prefixes.get(route[1]);
    if (prefix === undefined) continue;
    const suffix = route[3].startsWith('/') ? route[3] : `/${route[3]}`;
    routes.push({ method: route[2], path: `${prefix}${suffix}`, marked: route[4] === '1' });
  }
  return routes;
}

function routeKey(route) {
  return `${route.method} ${route.path}`;
}

function validateSpecs(specs, protocol) {
  const paths = new Set();
  for (const spec of specs) {
    const route = routePath(spec);
    if (paths.has(route)) throw new Error(`Duplicate commercial documentation route: ${route}`);
    paths.add(route);
    if (spec.special) continue;
    getRpc(spec, protocol);
  }
}

async function removeGeneratedDirectories() {
  const directories = [
    'content/zh/docs/chat/platform-api/v3/user/account-governance',
    'content/zh/docs/chat/platform-api/v3/relation/managing-friend-requests/delete-sent-friend-requests.mdx',
    'content/zh/docs/chat/platform-api/v3/relation/managing-friend-requests/delete-received-friend-requests.mdx',
    'content/zh/docs/chat/platform-api/v3/group/group-applications/get-group-application-badge-count.mdx',
    'content/zh/docs/chat/platform-api/v3/group/group-applications/clear-group-application-badge-count.mdx',
    'content/zh/docs/chat/platform-api/v3/group/group-applications/delete-user-group-requests.mdx',
    'content/zh/docs/chat/platform-api/v3/group/group-applications/delete-group-received-requests.mdx',
    'content/zh/docs/chat/platform-api/v3/message/content-processing',
    'content/zh/docs/chat/platform-api/v3/message/streaming-messages',
    'content/zh/docs/chat/platform-api/v3/message/unread-count',
    'content/zh/docs/chat/platform-api/v3/message/read-status',
    'content/zh/docs/chat/platform-api/v3/message/managing-messages/modify-message.mdx',
    'content/zh/docs/chat/platform-api/v3/conversation/conversation-groups',
    'content/zh/docs/chat/platform-api/v3/timer',
    'content/zh/docs/chat/platform-api/v3/meeting',
  ];
  for (const item of directories) await rm(resolve(root, item), { recursive: true, force: true });
}

async function writeOverviewPages(protocol) {
  const timerResources = ['TimerTaskCallbackConfig', 'TimerTask'];
  const meetingResources = [
    'LiveKit',
    'SystemGeneratedMeetingInfo',
    'CreatorDefinedMeetingInfo',
    'MeetingInfo',
    'MeetingSetting',
    'MeetingInfoSetting',
    'MeetingRepeatInfoReq',
    'MeetingRepeatInfo',
    'RepeatMeetingData',
    'PersonalMeetingSetting',
    'MeetingUser',
    'FileRecord',
    'MeetingRecord',
    'UserMeetingHistory',
    'HostedMeeting',
    'MeetingChatMessage',
    'InviteeInfo',
    'InvitationInfo',
  ];
  const timer = renderOverview({
    title: '概述',
    description: 'OpenIM 商业版定时任务能力概览。',
    route: '/docs/chat/platform-api/v3/timer/overview',
    introduction:
      '定时任务模块用于由业务服务端登记延迟执行任务，并在到达执行时间后按配置回调业务地址。该模块适合消息提醒、预约操作和业务补偿，不用于替代高频实时调度系统。',
    endpoints: enterpriseEndpoints.filter((item) => item.module === 'timer'),
    resources: timerResources
      .map((name) => findMessage(protocol, 'openim.third', name))
      .filter(Boolean),
    enums: timerEnumDocumentation,
  });
  const meeting = renderOverview({
    title: '概述',
    description: 'OpenIM 商业版会议、实时通话、会议聊天和录制能力概览。',
    route: '/docs/chat/platform-api/v3/meeting/overview',
    introduction:
      '会议模块提供预约会议、即时会议、参会控制、重复会议、会议聊天、录制查询和实时通话恢复能力。全部会议接口均属于 OpenIM 商业版，调用方应在自己的业务服务端校验用户和会议权限。',
    endpoints: meetingEndpoints,
    resources: meetingResources
      .map((name) =>
        findMessage(
          protocol,
          name === 'InvitationInfo' ? 'openmeeting.signal' : 'openmeeting.meeting',
          name,
        ),
      )
      .filter(Boolean),
    enums: meetingEnumDocumentation,
  });
  await writePage('content/zh/docs/chat/platform-api/v3/timer/overview.mdx', timer);
  await writePage('content/zh/docs/chat/platform-api/v3/meeting/overview.mdx', meeting);
}

function renderOverview({ title, description, route, introduction, endpoints, resources, enums }) {
  const grouped = Map.groupBy(endpoints, (item) => categoryTitles[item.category] ?? item.category);
  const capabilitySections = [...grouped.entries()]
    .map(
      ([category, items]) =>
        `### ${category}\n\n${items.map((item) => `- [${item.title}](${routePath(item)})：${item.summary}`).join('\n')}`,
    )
    .join('\n\n');
  const resourceSections = resources
    .map(
      (message) =>
        `### ${message.name}\n\n${resourceIntroduction(message.name)}\n\n${renderResourceTable(message)}`,
    )
    .join('\n\n');
  return `${frontmatter({ title, description, route, template: 'overview' })}\n\n${introduction}\n\n## 能力范围\n\n${capabilitySections}\n\n## 资源结构\n\n${resourceSections}\n\n${enums}\n\n## 接入建议\n\n- 会议、任务和实时通话接口应由可信业务服务端调用。\n- 调用方应校验操作用户、目标资源和租户边界，不要仅依赖请求体中的用户 ID。\n- 使用唯一的 \`operationID\` 关联业务日志和 OpenIM 服务端日志。\n`;
}

function renderApiPage(spec, rpc, protocol) {
  const request = protocol.messages.get(rpc.requestKey);
  const response = protocol.messages.get(rpc.responseKey);
  const requestSample = sampleMessage(request, protocol, 0);
  const responseData = sampleMessage(response, protocol, 0);
  const success = {
    errCode: 0,
    errMsg: '',
    errDlt: '',
    ...(Object.keys(responseData).length ? { data: responseData } : {}),
  };
  const relatedOverview = `/docs/chat/platform-api/v3/${spec.module}/overview`;
  return `${frontmatter({
    title: spec.title,
    description: `OpenIM 商业版 Platform API：${spec.summary}`,
    route: routePath(spec),
    template: 'api',
  })}\n\n${spec.summary} 此接口仅在 OpenIM 商业版中提供。请先在[接入准备](/docs/chat/platform-api/v3/prepare-to-use-api)中配置 API 地址和有效 Token。\n\n## HTTP 请求\n\n\`\`\`bash\n${spec.method} {API_ADDRESS}${spec.path}\n\`\`\`\n\n### 请求示例\n\n\`\`\`bash\ncurl --request ${spec.method} "\${API_ADDRESS}${spec.path}" \\\n  --header "Content-Type: application/json; charset=utf-8" \\\n  --header "operationID: \${OPERATION_ID}" \\\n  --header "token: \${TOKEN}" \\\n  --data-raw '${json(requestSample)}'\n\`\`\`\n\n> 商业版：此接口需要部署对应的商业版服务。接口是否可用以及具体权限以客户交付版本为准。\n\n## 请求体\n\n\`\`\`json\n${json(requestSample)}\n\`\`\`\n\n${renderRequestTable(request)}\n\n## 响应\n\n请求被 OpenIM 正常处理时通常返回 \`200 OK\`。业务是否成功以响应体中的 \`errCode\` 为准。\n\n\`\`\`json\n${json(success)}\n\`\`\`\n\n### 响应参数\n\n${renderResponseTable(response)}\n\n### 错误\n\n错误响应使用 Platform API 通用结构，处理方式见[错误码](/docs/chat/platform-api/v3/error-codes)。\n\n## 权限和限制\n\n- 仅在 OpenIM 商业版中提供。\n- 调用方必须校验操作用户和目标资源的业务权限。\n- 请求数组和分页大小应遵循客户交付版本的服务端限制。\n\n## 相关页面\n\n- [接入准备](/docs/chat/platform-api/v3/prepare-to-use-api)\n- [${spec.module === 'meeting' ? '会议概述' : spec.module === 'timer' ? '定时任务概述' : '模块概述'}](${relatedOverview})\n- [错误码](/docs/chat/platform-api/v3/error-codes)\n`;
}

function renderStreamPutPage(spec) {
  return `${frontmatter({
    title: spec.title,
    description: `OpenIM 商业版 Platform API：${spec.summary}`,
    route: routePath(spec),
    template: 'api',
  })}\n\n${spec.summary} 此接口仅在 OpenIM 商业版中提供，适合将模型或业务系统持续产生的 UTF-8 文本写入同一条流式消息。\n\n## HTTP 请求\n\n\`\`\`bash\nPUT {API_ADDRESS}${spec.path}?conversationID={CONVERSATION_ID}&clientMsgID={CLIENT_MSG_ID}&operationID={OPERATION_ID}\n\`\`\`\n\n### 请求示例\n\n\`\`\`bash\ncurl --request PUT "\${API_ADDRESS}${spec.path}?conversationID=si_user_001_user_002&clientMsgID=client_msg_001&operationID=\${OPERATION_ID}" \\\n  --header "Content-Type: text/plain; charset=utf-8" \\\n  --header "token: \${TOKEN}" \\\n  --data-binary '正在生成回复内容'\n\`\`\`\n\n## 请求参数\n\n| 参数 | 位置 | 必填 | 类型 | 说明 |\n| ---- | ---- | ---- | ---- | ---- |\n| conversationID | Query 或 Header | 是 | string | OpenIM 会话 ID。 |\n| clientMsgID | Query 或 Header | 是 | string | 已创建流式消息的客户端消息 ID。 |\n| operationID | Query 或 Header | 是 | string | 本次请求的唯一链路追踪 ID。 |\n| token | Header | 是 | string | 有效的用户 Token 或管理员 Token。 |\n| body | Body | 是 | bytes | UTF-8 编码的流式消息分片。 |\n\n## 响应\n\n服务端以流式方式返回写入结果。调用方应处理网络中断和部分写入，不要在未确认消息状态时盲目重试同一分片。\n\n## 权限和限制\n\n- 仅在 OpenIM 商业版中提供。\n- 请求体必须是有效的 UTF-8 内容。\n- \`conversationID\` 和 \`clientMsgID\` 必须指向同一条可追加的流式消息。\n\n## 相关页面\n\n- [追加流式消息分片](/docs/chat/platform-api/v3/message/streaming-messages/append-stream-message)\n- [消息概述](/docs/chat/platform-api/v3/message/overview)\n`;
}

function frontmatter({ title, description, route, template }) {
  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nproduct: "platform-api"\ncontext: "chat/platform-api/v3"\ntemplate: "${template}"\nstatus: "published"\nlastUpdated: "2026-07-21"\nversion: "v3"\nedition: "enterprise"\nsourcePath: "${route}"\n---`;
}

function renderRequestTable(message) {
  if (!message?.fields.length) return '此接口不需要请求体字段。';
  const rows = message.fields.map((field) => [
    field.name,
    isRequired(field) ? '是' : '否',
    displayType(field),
    describeField(field),
  ]);
  return table(['参数名', '是否必填', '类型', '说明'], rows);
}

function renderResponseTable(message) {
  const rows = [
    ['errCode', 'int', '业务错误码，`0` 表示成功。'],
    ['errMsg', 'string', '错误简要信息，成功时通常为空。'],
    ['errDlt', 'string', '错误详细信息，成功时通常为空。'],
  ];
  for (const field of message?.fields ?? [])
    rows.push([`data.${field.name}`, displayType(field), describeField(field)]);
  return table(['参数名', '类型', '说明'], rows);
}

function renderResourceTable(message) {
  return table(
    ['字段', '类型', '说明'],
    message.fields.map((field) => [field.name, displayType(field), describeField(field)]),
  );
}

function table(headers, rows) {
  return `| ${headers.join(' | ')} |\n| ${headers.map(() => '----').join(' | ')} |\n${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

function sampleMessage(message, protocol, depth) {
  if (!message || depth > 3) return {};
  const value = {};
  for (const field of message.fields)
    value[field.name] = sampleField(field, message.package, protocol, depth + 1);
  return value;
}

function sampleField(field, currentPackage, protocol, depth) {
  const base = sampleScalar(field.name, field.type);
  let value = base;
  if (base === undefined) {
    const enumType = resolveEnum(protocol, currentPackage, field.type);
    if (enumType) value = enumType.values.find((item) => item.number !== 0)?.number ?? 0;
    else {
      const nested = resolveMessage(protocol, currentPackage, field.type);
      value = nested ? sampleMessage(nested, protocol, depth) : {};
    }
  }
  if (field.map) return { key: value };
  if (field.label === 'repeated') return [value];
  return value;
}

function sampleScalar(name, type) {
  const scalarType = unwrapType(type);
  if (scalarType === 'string' || scalarType === 'bytes') return sampleString(name);
  if (scalarType === 'bool') return false;
  if (/^(?:u?int|sint|fixed|sfixed|float|double)/.test(scalarType)) {
    if (/(?:Time|Date|At|Ms)$/i.test(name) && !/(?:Times|Timeout)$/i.test(name))
      return 1719800000000;
    if (/duration/i.test(name)) return 3600;
    if (/page|count|number|size|seq|order|status|type|index|retry|interval/i.test(name)) return 1;
    return 0;
  }
  if (scalarType.endsWith('Value')) {
    if (/BoolValue$/.test(scalarType)) return false;
    if (/StringValue$/.test(scalarType)) return sampleString(name);
    return 1;
  }
  return undefined;
}

function sampleString(name) {
  const values = [
    [/conversationGroupID/i, 'conversation_group_001'],
    [/conversationID/i, 'si_user_001_user_002'],
    [/repeatMeetingID/i, 'repeat_meeting_001'],
    [/meetingID/i, 'meeting_001'],
    [/roomID/i, 'room_001'],
    [/groupID/i, 'group_001'],
    [/taskID/i, 'task_001'],
    [/clientMsgID/i, 'client_msg_001'],
    [/userID|sendID|recvID|identity|creator|host|operator|participant|invitee/i, 'user_001'],
    [/token/i, 'token_value'],
    [/url/i, 'https://example.com/resource'],
    [/language/i, 'zh-CN'],
    [/title|name/i, '示例名称'],
    [/content|payload|text/i, '示例内容'],
    [/password/i, '123456'],
    [/status/i, 'scheduled'],
    [/taskCategory/i, 'reminder'],
    [/category/i, 'default'],
    [/ex|custom/i, '{}'],
  ];
  return values.find(([pattern]) => pattern.test(name))?.[1] ?? 'example';
}

function displayType(field) {
  let type = unwrapType(field.type);
  if (field.map) type = 'object';
  else if (/^(?:u?int|sint|fixed|sfixed)/.test(type)) type = 'int';
  else if (type === 'bytes') type = 'string';
  else if (type.includes('.')) type = type.split('.').at(-1);
  if (field.label === 'repeated') type += '[]';
  return type;
}

function unwrapType(type) {
  return type.replace(/^map<.*,$/, '').replace(/^openim\.protobuf\./, '');
}

function isRequired(field) {
  if (field.label === 'optional') return false;
  if (/Value$/.test(field.type)) return false;
  return true;
}

function describeField(field) {
  const typeName = field.type.split('.').at(-1);
  const resourceLink = resourceLinks[typeName];
  if (resourceLink)
    return `结构为[${resourceLink.label}的 \`${resourceLink.displayName ?? typeName}\`](${resourceLink.href}#${resourceLink.anchor ?? anchor(typeName)})。`;
  const enumLink = enumResourceLinks[typeName];
  if (enumLink) return `枚举值参见[会议模块的 \`${typeName}\`](${enumLink})。`;
  const enumType = resolveEnum(activeProtocol, field.package, field.type);
  if (enumType)
    return `枚举值：${enumType.values.map((item) => `\`${item.name}=${item.number}\``).join('、')}。`;
  const exact = fieldDescriptions[field.name];
  if (exact) return exact;
  const translated = field.comment ? translateComment(field.comment) : undefined;
  if (translated) return translated;
  if (!isScalar(field.type))
    return `结构为 \`${typeName}${field.label === 'repeated' ? '[]' : ''}\`。`;
  return `${humanize(field.name)}。`;
}

function translateComment(comment) {
  const known = [
    [/unique identifier for the user/i, '用户唯一标识。'],
    [/user who joins/i, '加入会议的用户 ID。'],
    [/user who leaves/i, '离开会议的用户 ID。'],
    [/status filter/i, '会议状态筛选条件。'],
    [/scheduled start time/i, '计划开始时间，Unix 毫秒时间戳。'],
    [/duration.*seconds/i, '会议持续时长，单位为秒。'],
    [/password required/i, '加入会议所需密码；无密码时可为空。'],
    [/download address/i, '资源下载地址。'],
    [/empty means/i, '为空时使用服务端默认行为。'],
  ];
  return known.find(([pattern]) => pattern.test(comment))?.[1];
}

function humanize(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('ID', ' ID')
    .trim();
}

function isScalar(type) {
  return sampleScalar('', type) !== undefined;
}

function resourceIntroduction(name) {
  return resourceDescriptions[name] ?? `\`${name}\` 是商业版接口使用的资源结构。`;
}

function getRpc(spec, protocol) {
  const moduleName =
    spec.protoModule ??
    (spec.module === 'timer' || spec.rpc === 'TranslateText'
      ? 'third'
      : spec.module === 'message'
        ? 'msg'
        : spec.module);
  const rpc = protocol.rpcs.get(`${moduleName}:${spec.rpc}`);
  if (!rpc) throw new Error(`RPC not found for ${spec.path}: ${moduleName}:${spec.rpc}`);
  return rpc;
}

function findMessage(protocol, packageName, name) {
  return protocol.messages.get(`${packageName}.${name}`);
}

function resolveMessage(protocol, currentPackage, type) {
  const normalized = type.replace(/^\./, '');
  if (protocol.messages.has(normalized)) return protocol.messages.get(normalized);
  if (protocol.messages.has(`${currentPackage}.${normalized}`))
    return protocol.messages.get(`${currentPackage}.${normalized}`);
  if (normalized.includes('.')) {
    const qualifiedSuffix = `.${normalized}`;
    const qualifiedCandidates = [...protocol.messages.entries()].filter(([key]) =>
      key.endsWith(qualifiedSuffix),
    );
    if (qualifiedCandidates.length === 1) return qualifiedCandidates[0][1];
  }
  const suffix = `.${normalized.split('.').at(-1)}`;
  const candidates = [...protocol.messages.entries()].filter(([key]) => key.endsWith(suffix));
  return candidates.length === 1 ? candidates[0][1] : undefined;
}

async function loadProtocol(directory) {
  const files = await listFiles(directory, '.proto');
  const messages = new Map();
  const enums = new Map();
  const rpcs = new Map();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const packageName = source.match(/\bpackage\s+([\w.]+)\s*;/)?.[1];
    if (!packageName) continue;
    const moduleName = relative(directory, dirname(file)).replaceAll('\\', '/');
    for (const message of parseBlocks(source, 'message', packageName))
      messages.set(`${packageName}.${message.name}`, message);
    for (const enumType of parseEnums(source, packageName))
      enums.set(`${packageName}.${enumType.name}`, enumType);
    const rpcPattern = /\brpc\s+(\w+)\s*\(\s*([\w.]+)\s*\)\s*returns\s*\(\s*([\w.]+)\s*\)/g;
    let match;
    while ((match = rpcPattern.exec(source))) {
      rpcs.set(`${moduleName}:${match[1]}`, {
        name: match[1],
        requestKey: qualify(packageName, match[2]),
        responseKey: qualify(packageName, match[3]),
      });
    }
  }
  return { messages, enums, rpcs };
}

function parseBlocks(source, keyword, packageName) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = new RegExp(`\\b${keyword}\\s+(\\w+)\\s*\\{`, 'g');
  const result = [];
  let match;
  while ((match = pattern.exec(clean))) {
    const open = pattern.lastIndex - 1;
    const close = closingBrace(clean, open);
    const body = clean.slice(open + 1, close);
    result.push({
      name: match[1],
      package: packageName,
      fields: parseFields(body).map((field) => ({ ...field, package: packageName })),
    });
    pattern.lastIndex = close + 1;
  }
  return result;
}

function parseEnums(source, packageName) {
  const result = [];
  for (const block of parseBlocks(source, 'enum', packageName)) {
    const open = source.indexOf(`enum ${block.name}`);
    const brace = source.indexOf('{', open);
    const close = closingBrace(source, brace);
    const values = [];
    const pattern = /\b(\w+)\s*=\s*(-?\d+)/g;
    let match;
    const body = source.slice(brace + 1, close);
    while ((match = pattern.exec(body))) values.push({ name: match[1], number: Number(match[2]) });
    result.push({ name: block.name, package: packageName, values });
  }
  return result;
}

function parseFields(body) {
  const fields = [];
  let depth = 0;
  let pendingComment = '';
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (depth === 0 && line.startsWith('//')) {
      pendingComment = `${pendingComment} ${line.slice(2).trim()}`.trim();
      continue;
    }
    if (depth === 0) {
      const field = line.match(
        /^(optional|required|repeated)?\s*(map<[^>]+>|[\w.]+)\s+(\w+)\s*=\s*(\d+)(?:\s*\[[^\]]+\])?\s*;?(?:\s*\/\/\s*(.*))?$/,
      );
      if (field) {
        fields.push({
          label: field[1] ?? '',
          type: field[2],
          name: field[3],
          number: Number(field[4]),
          comment: field[5]?.trim() || pendingComment,
          map: field[2].startsWith('map<'),
        });
        pendingComment = '';
      } else if (line && !line.startsWith('reserved')) {
        pendingComment = '';
      }
    }
    depth += [...line].filter((char) => char === '{').length;
    depth -= [...line].filter((char) => char === '}').length;
  }
  return fields;
}

function closingBrace(source, open) {
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error('Unclosed protobuf block.');
}

function qualify(packageName, type) {
  return type.includes('.') ? type.replace(/^\./, '') : `${packageName}.${type}`;
}

function resolveEnum(protocol, currentPackage, type) {
  if (!protocol?.enums) return undefined;
  const normalized = type.replace(/^\./, '');
  if (protocol.enums.has(normalized)) return protocol.enums.get(normalized);
  if (protocol.enums.has(`${currentPackage}.${normalized}`))
    return protocol.enums.get(`${currentPackage}.${normalized}`);
  if (normalized.includes('.')) {
    const qualifiedSuffix = `.${normalized}`;
    const qualifiedCandidates = [...protocol.enums.entries()].filter(([key]) =>
      key.endsWith(qualifiedSuffix),
    );
    if (qualifiedCandidates.length === 1) return qualifiedCandidates[0][1];
  }
  const suffix = `.${normalized.split('.').at(-1)}`;
  const candidates = [...protocol.enums.entries()].filter(([key]) => key.endsWith(suffix));
  return candidates.length === 1 ? candidates[0][1] : undefined;
}

function anchor(value) {
  return value.toLowerCase();
}

async function listFiles(directory, suffix) {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort();
}

async function updateGeneratedData(specs) {
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));
  const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
  const localized = JSON.parse(await readFile(localizedPath, 'utf8'));
  const retainedRoutes = routes.filter(
    (route) =>
      route.edition !== 'enterprise' &&
      !route.path.startsWith('/docs/chat/platform-api/v3/webhooks/'),
  );
  let id = Math.max(...retainedRoutes.map((route) => route.id)) + 1;
  const docs = [
    overviewRoute('timer', '概述', 750),
    overviewRoute('meeting', '概述', 770),
    ...specs.map(routeRecord),
  ];
  retainedRoutes.push({ id: id++, ...webhooksOverviewRoute(), locales: ['zh'] });
  for (const spec of webhookSpecs) {
    const route = webhookRouteRecord(spec);
    retainedRoutes.push({
      id: id++,
      ...route,
      ...(spec.edition === 'enterprise' ? { edition: 'enterprise' } : {}),
      locales: ['zh'],
    });
  }
  for (const doc of docs)
    retainedRoutes.push({ id: id++, ...doc, edition: 'enterprise', locales: ['zh'] });
  await writeFile(routesPath, `${JSON.stringify(retainedRoutes, null, 2)}\n`, 'utf8');

  const context = navigation.contexts.find((item) => item.key === 'chat/platform-api/v3');
  if (!context) throw new Error('Platform API navigation context not found.');
  removeEnterpriseNodes(context.nodes);
  addModuleFolder(context, 'user', 'account-governance', '账号治理', specs);
  appendCategoryPages(context, 'relation', 'managing-friend-requests', specs);
  appendCategoryPages(context, 'group', 'group-applications', specs);
  addModuleFolder(context, 'message', 'content-processing', '内容处理', specs);
  addModuleFolder(context, 'message', 'streaming-messages', '流式消息', specs);
  addModuleFolder(context, 'message', 'unread-count', '未读数管理', specs);
  addModuleFolder(context, 'message', 'read-status', '已读状态', specs);
  appendCategoryPages(context, 'message', 'managing-messages', specs);
  addModuleFolder(context, 'conversation', 'conversation-groups', '会话分组', specs);
  insertTopLevelModule(context, 'timer', '定时任务', specs, 'migration-to-openim');
  insertTopLevelModule(context, 'meeting', '会议', specs, 'migration-to-openim');
  insertWebhooksModule(context, webhookSpecs);
  context.pageCount = retainedRoutes.filter((route) => route.contextKey === context.key).length;
  await writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8');

  Object.assign(localized.navigationLabels, {
    'account-governance': '账号治理',
    'content-processing': '内容处理',
    'streaming-messages': '流式消息',
    'unread-count': '未读数管理',
    'conversation-groups': '会话分组',
    timer: '定时任务',
    'managing-tasks': '管理任务',
    meeting: '会议',
    webhooks: 'Webhooks',
    ...Object.fromEntries(
      Object.entries(webhookCategoryTitles).map(([segment, title]) => [
        `webhooks-${segment}`,
        title,
      ]),
    ),
    'meeting-management': '会议管理',
    'meeting-settings': '会议控制',
    'recurring-meetings': '重复会议',
    'meeting-records': '会议记录',
    'meeting-signaling': '实时通话',
    'meeting-chat': '会议聊天',
  });
  localized.generatedAt = '2026-07-21';
  await writeFile(localizedPath, `${JSON.stringify(localized, null, 2)}\n`, 'utf8');
}

function routeRecord(spec, index) {
  const path = routePath(spec);
  const navOrder = moduleBaseOrder[spec.module] + (index + 1) / 1000;
  return {
    path,
    relativePath: path.replace(/^\/docs\//, ''),
    sourcePath: path,
    title: spec.title,
    description: `OpenIM 商业版 Platform API：${spec.summary}`,
    product: 'platform-api',
    version: 'v3',
    platform: null,
    contextKey: 'chat/platform-api/v3',
    contextTitle: 'Platform API',
    template: 'api',
    status: 'published',
    sourceIndex: navOrder,
    contentFile: `content/zh${path}.mdx`,
    navOrder,
  };
}

function overviewRoute(module, title, navOrder) {
  const path = `/docs/chat/platform-api/v3/${module}/overview`;
  return {
    path,
    relativePath: path.replace(/^\/docs\//, ''),
    sourcePath: path,
    title,
    description: `OpenIM 商业版${module === 'timer' ? '定时任务' : '会议'}能力概览。`,
    product: 'platform-api',
    version: 'v3',
    platform: null,
    contextKey: 'chat/platform-api/v3',
    contextTitle: 'Platform API',
    template: 'overview',
    status: 'published',
    sourceIndex: navOrder,
    contentFile: `content/zh${path}.mdx`,
    navOrder,
  };
}

function webhooksOverviewRoute() {
  const path = '/docs/chat/platform-api/v3/webhooks/overview';
  return {
    path,
    relativePath: path.replace(/^\/docs\//, ''),
    sourcePath: path,
    title: '概述',
    description: 'OpenIM Webhooks 回调机制、配置方式和能力范围概览。',
    product: 'platform-api',
    version: 'v3',
    platform: null,
    contextKey: 'chat/platform-api/v3',
    contextTitle: 'Platform API',
    template: 'overview',
    status: 'published',
    sourceIndex: 780,
    contentFile: `content/zh${path}.mdx`,
    navOrder: 780,
  };
}

function webhookRouteRecord(spec) {
  const path = webhookRoute(spec);
  const categoryIndex = Object.keys(webhookCategoryTitles).indexOf(spec.category);
  const itemIndex = webhookSpecs.filter((item) => item.category === spec.category).indexOf(spec);
  const navOrder = webhookNavOrder(categoryIndex, itemIndex);
  return {
    path,
    relativePath: path.replace(/^\/docs\//, ''),
    sourcePath: path,
    title: spec.title,
    description: `OpenIM Webhooks：${spec.summary}`,
    product: 'platform-api',
    version: 'v3',
    platform: null,
    contextKey: 'chat/platform-api/v3',
    contextTitle: 'Platform API',
    template: 'api',
    status: 'published',
    sourceIndex: navOrder,
    contentFile: `content/zh${path}.mdx`,
    navOrder,
  };
}

function webhookNavOrder(categoryIndex, itemIndex = 0) {
  return Number((780.01 + categoryIndex / 100 + itemIndex / 10000).toFixed(4));
}

function removeEnterpriseNodes(nodes) {
  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index];
    if (
      node.edition === 'enterprise' ||
      node.id === 'timer' ||
      node.id === 'meeting' ||
      node.id === 'webhooks'
    )
      nodes.splice(index, 1);
    else removeEnterpriseNodes(node.children ?? []);
  }
}

function addModuleFolder(context, moduleID, category, title, specs) {
  const moduleNode = context.nodes.find((node) => node.id === moduleID);
  if (!moduleNode) throw new Error(`Navigation module not found: ${moduleID}`);
  const pages = specs.filter((item) => item.module === moduleID && item.category === category);
  if (!pages.length) return;
  moduleNode.children.push(folderNode(`${moduleID}/${category}`, category, title, pages));
}

function appendCategoryPages(context, moduleID, category, specs) {
  const moduleNode = context.nodes.find((node) => node.id === moduleID);
  const folder = moduleNode?.children.find((node) => node.segment === category);
  if (!folder) throw new Error(`Navigation category not found: ${moduleID}/${category}`);
  const pages = specs.filter((item) => item.module === moduleID && item.category === category);
  folder.children.push(...pages.map(pageNode));
}

function insertTopLevelModule(context, moduleID, title, specs, beforeID) {
  const pages = specs.filter((item) => item.module === moduleID);
  const grouped = Map.groupBy(pages, (item) => item.category);
  const children = [
    {
      id: `${moduleID}/overview`,
      segment: 'overview',
      title: '概述',
      href: `/docs/chat/platform-api/v3/${moduleID}/overview`,
      type: 'page',
      children: [],
      minIndex: moduleBaseOrder[moduleID],
      edition: 'enterprise',
      locales: ['zh'],
    },
    ...[...grouped.entries()].map(([category, items]) =>
      folderNode(`${moduleID}/${category}`, category, categoryTitles[category] ?? category, items),
    ),
  ];
  const node = {
    id: moduleID,
    segment: moduleID,
    title,
    href: null,
    type: 'folder',
    children,
    minIndex: moduleBaseOrder[moduleID],
    edition: 'enterprise',
    locales: ['zh'],
  };
  const index = context.nodes.findIndex((item) => item.id === beforeID);
  context.nodes.splice(index >= 0 ? index : context.nodes.length, 0, node);
}

function insertWebhooksModule(context, specs) {
  const categories = Object.entries(webhookCategoryTitles).map(([category, title], categoryIndex) => {
    const pages = specs.filter((item) => item.category === category);
    const enterpriseCategory = pages.every((item) => item.edition === 'enterprise');
    return {
      id: `webhooks/${category}`,
      segment: category,
      title,
      href: null,
      type: 'folder',
      children: pages.map((spec, itemIndex) => ({
        id: `webhooks/${category}/${spec.slug}`,
        segment: spec.slug,
        title: spec.title,
        href: webhookRoute(spec),
        type: 'page',
        children: [],
        minIndex: webhookNavOrder(categoryIndex, itemIndex),
        ...(spec.edition === 'enterprise' ? { edition: 'enterprise' } : {}),
        locales: ['zh'],
      })),
      minIndex: webhookNavOrder(categoryIndex),
      ...(enterpriseCategory ? { edition: 'enterprise' } : {}),
      locales: ['zh'],
    };
  });
  const node = {
    id: 'webhooks',
    segment: 'webhooks',
    title: 'Webhooks',
    href: null,
    type: 'folder',
    children: [
      {
        id: 'webhooks/overview',
        segment: 'overview',
        title: '概述',
        href: '/docs/chat/platform-api/v3/webhooks/overview',
        type: 'page',
        children: [],
        minIndex: 780,
        locales: ['zh'],
      },
      ...categories,
    ],
    minIndex: 780,
    locales: ['zh'],
  };
  const index = context.nodes.findIndex((item) => item.id === 'migration-to-openim');
  context.nodes.splice(index >= 0 ? index : context.nodes.length, 0, node);
}

function folderNode(id, segment, title, pages) {
  return {
    id,
    segment,
    title,
    href: null,
    type: 'folder',
    children: pages.map(pageNode),
    minIndex: moduleBaseOrder[pages[0].module],
    edition: 'enterprise',
    locales: ['zh'],
  };
}

function pageNode(spec) {
  return {
    id: `${spec.module}/${spec.category}/${spec.slug}`,
    segment: spec.slug,
    title: spec.title,
    href: routePath(spec),
    type: 'page',
    children: [],
    minIndex: moduleBaseOrder[spec.module],
    edition: 'enterprise',
    locales: ['zh'],
  };
}

function routePath(spec) {
  return `/docs/chat/platform-api/v3/${spec.module}/${spec.category}/${spec.slug}`;
}

function contentFile(spec) {
  return resolve(root, `content/zh${routePath(spec)}.mdx`);
}

async function writePage(file, body) {
  const output = resolve(root, file);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await format(body, { parser: 'mdx' }), 'utf8');
}

const moduleBaseOrder = {
  user: 624.1,
  relation: 639.1,
  group: 694.1,
  message: 725.1,
  conversation: 745.1,
  timer: 750,
  meeting: 770,
};

const categoryTitles = {
  'account-governance': '账号治理',
  'managing-friend-requests': '好友申请',
  'group-applications': '入群申请',
  'content-processing': '内容处理',
  'streaming-messages': '流式消息',
  'read-status': '已读状态',
  'managing-messages': '管理消息',
  'unread-count': '未读数管理',
  'conversation-groups': '会话分组',
  'managing-tasks': '管理任务',
  'meeting-management': '会议管理',
  'meeting-settings': '会议控制',
  'recurring-meetings': '重复会议',
  'meeting-records': '会议记录',
  'meeting-signaling': '实时通话',
  'meeting-chat': '会议聊天',
};

const timerEnumDocumentation = `## 枚举

### TimerTaskStatus

| 值 | 名称 | 说明 |
| --- | --- | --- |
| 0 | \`Pending\` | 等待执行。 |
| 1 | \`Processing\` | 正在执行。 |

### TimerTaskCallbackMethod

| 值 | 说明 |
| --- | --- |
| \`openim-message\` | 回调 OpenIM 消息能力。 |
| \`openim-http\` | 调用 HTTP 回调地址。 |
| \`openim-rpc\` | 调用预配置 RPC 能力。 |
| \`preset\` | 调用服务端预置处理逻辑。 |`;

const meetingEnumDocumentation = `## 枚举

### RepeatType

| 值 | 名称 | 说明 |
| --- | --- | --- |
| 0 | \`REPEAT_TYPE_NONE\` | 不重复。 |
| 1 | \`REPEAT_TYPE_DAILY\` | 每日重复。 |
| 2 | \`REPEAT_TYPE_WEEKLY\` | 每周重复。 |
| 3 | \`REPEAT_TYPE_WEEKDAY\` | 工作日重复。 |
| 4 | \`REPEAT_TYPE_MONTHLY\` | 每月重复。 |
| 5 | \`REPEAT_TYPE_YEARLY\` | 每年重复。 |
| 6 | \`REPEAT_TYPE_HOURLY\` | 每小时重复。 |

### DayOfWeek

| 值 | 名称 | 说明 |
| --- | --- | --- |
| 0 | \`SUNDAY\` | 星期日。 |
| 1 | \`MONDAY\` | 星期一。 |
| 2 | \`TUESDAY\` | 星期二。 |
| 3 | \`WEDNESDAY\` | 星期三。 |
| 4 | \`THURSDAY\` | 星期四。 |
| 5 | \`FRIDAY\` | 星期五。 |
| 6 | \`SATURDAY\` | 星期六。 |

### RepeatStatus

| 值 | 名称 | 说明 |
| --- | --- | --- |
| 0 | \`REPEAT_STATUS_UNKNOWN\` | 未知状态。 |
| 1 | \`REPEAT_STATUS_ACTIVE\` | 生效中。 |
| 2 | \`REPEAT_STATUS_COMPLETED\` | 已完成。 |

### RecordStatus

| 值 | 名称 | 说明 |
| --- | --- | --- |
| 0 | \`NotStarted\` | 未开始。 |
| 1 | \`Completed\` | 已完成。 |
| 2 | \`Failed\` | 失败。 |
| 3 | \`Processing\` | 进行中。 |`;

const resourceDescriptions = {
  LiveKit: '`LiveKit` 表示客户端加入会议所需的实时音视频访问地址和 Token。',
  CreatorDefinedMeetingInfo:
    '`CreatorDefinedMeetingInfo` 表示创建者可配置的会议标题、时间、密码、主持人和受邀用户。',
  MeetingSetting: '`MeetingSetting` 表示会议级摄像头、麦克风、屏幕共享、锁定和录制设置。',
  MeetingInfoSetting: '`MeetingInfoSetting` 汇总会议资料、会议设置和重复会议信息。',
  MeetingRepeatInfoReq: '`MeetingRepeatInfoReq` 表示创建或更新重复会议时提交的重复规则。',
  RepeatMeetingData: '`RepeatMeetingData` 表示重复会议定义、生成进度和下一次计划时间。',
  MeetingRecord: '`MeetingRecord` 表示会议录制文件、主持人、参会者和录制状态。',
  UserMeetingHistory: '`UserMeetingHistory` 表示用户参加过的会议及其起止时间和状态。',
  HostedMeeting: '`HostedMeeting` 表示用户主持过的会议及其起止时间和状态。',
  MeetingChatMessage: '`MeetingChatMessage` 表示会议聊天消息及其 Seq、发送者和接收范围。',
  InviteeInfo: '`InviteeInfo` 表示更新会议时需要替换的受邀用户列表。',
  InvitationInfo: '`InvitationInfo` 表示实时通话邀请、房间和参与者信息。',
  TimerTaskCallbackConfig:
    '`TimerTaskCallbackConfig` 表示定时任务执行时调用的业务回调地址、方法和请求头。',
  TimerTask: '`TimerTask` 表示服务端保存的定时任务及执行、重试和回调配置。',
};

const resourceLinks = Object.fromEntries([
  ...[
    'LiveKit',
    'SystemGeneratedMeetingInfo',
    'CreatorDefinedMeetingInfo',
    'MeetingInfo',
    'MeetingSetting',
    'MeetingInfoSetting',
    'MeetingRepeatInfoReq',
    'MeetingRepeatInfo',
    'RepeatMeetingData',
    'PersonalMeetingSetting',
    'MeetingUser',
    'FileRecord',
    'MeetingRecord',
    'UserMeetingHistory',
    'HostedMeeting',
    'MeetingChatMessage',
    'InviteeInfo',
    'InvitationInfo',
  ].map((name) => [
    name,
    { label: '会议模块', href: '/docs/chat/platform-api/v3/meeting/overview' },
  ]),
  ...['TimerTaskCallbackConfig', 'TimerTask'].map((name) => [
    name,
    { label: '定时任务模块', href: '/docs/chat/platform-api/v3/timer/overview' },
  ]),
  ...['ConversationGroup', 'ConversationGroupOrder'].map((name) => [
    name,
    { label: '会话模块', href: '/docs/chat/platform-api/v3/conversation/overview' },
  ]),
  ...['UserInfo', 'PublicUserInfo'].map((name) => [
    name,
    { label: '用户模块', href: '/docs/chat/platform-api/v3/user/overview' },
  ]),
  ...['GroupInfo', 'GroupRequestInfo'].map((name) => [
    name,
    { label: '群组模块', href: '/docs/chat/platform-api/v3/group/overview' },
  ]),
  [
    'GroupMemberFullInfo',
    {
      label: '群组模块',
      displayName: 'GroupMemberInfo',
      anchor: 'groupmemberinfo',
      href: '/docs/chat/platform-api/v3/group/overview',
    },
  ],
]);

const enumResourceLinks = {
  RepeatType: '/docs/chat/platform-api/v3/meeting/overview#repeattype',
  DayOfWeek: '/docs/chat/platform-api/v3/meeting/overview#dayofweek',
  RepeatStatus: '/docs/chat/platform-api/v3/meeting/overview#repeatstatus',
};

const fieldDescriptions = {
  userID: 'OpenIM 用户 ID。',
  userIDs: 'OpenIM 用户 ID 列表。',
  ownerUserID: '资源所属用户 ID。',
  creatorUserID: '创建者用户 ID。',
  operatorUserID: '执行操作的用户 ID。',
  updatingUserID: '更新会议的用户 ID。',
  participantUserID: '目标参会者用户 ID。',
  participantUserIDs: '目标参会者用户 ID 列表。',
  inviteeUserIDs: '受邀用户 ID 列表。',
  inviterUserID: '邀请发起者用户 ID。',
  fromUserID: '好友申请发起者用户 ID。',
  fromUserIDs: '好友申请发起者用户 ID 列表。',
  toUserID: '好友申请接收者用户 ID。',
  toUserIDs: '好友申请接收者用户 ID 列表。',
  groupID: 'OpenIM 群组 ID。',
  groupIDs: 'OpenIM 群组 ID 列表。',
  conversationID: 'OpenIM 会话 ID。',
  conversationIDs: 'OpenIM 会话 ID 列表。',
  conversationGroupID: '会话分组 ID。',
  conversationGroupIDs: '会话分组 ID 列表。',
  meetingID: '会议 ID。',
  meetingIDs: '会议 ID 列表。',
  repeatMeetingID: '重复会议 ID。',
  roomID: '会议或实时通话房间 ID。',
  roomIDs: '会议或实时通话房间 ID 列表。',
  taskID: '定时任务 ID。',
  taskName: '定时任务名称。',
  taskCategory: '定时任务业务分类。',
  categories: '任务分类筛选列表。',
  executeAt: '计划执行时间，Unix 毫秒时间戳。',
  executeBefore: '允许执行的最晚时间，Unix 毫秒时间戳。',
  maxRetry: '任务执行失败后的最大重试次数。',
  dedupKey: '业务幂等键，用于避免重复创建任务。',
  callbackConfig: '任务执行时使用的回调配置。',
  pagination: '分页参数。',
  pageCount: '页码，从 1 开始。',
  pageSize: '每页数量。',
  status: '状态筛选条件。',
  statuses: '状态筛选列表。',
  startTime: '起始时间，Unix 毫秒时间戳。',
  endTime: '结束时间，Unix 毫秒时间戳。',
  scheduledTime: '计划开始时间，Unix 毫秒时间戳。',
  meetingDuration: '会议持续时长，单位为秒。',
  title: '会议或资源标题。',
  password: '会议密码；无密码时可为空。',
  timeZone: '会议创建者指定的时区。',
  seq: '消息 Seq。',
  currentSeq: '客户端当前已拉取到的消息 Seq。',
  startIndex: '本次追加分片的起始索引。',
  packets: '流式消息分片列表。',
  end: '是否结束流式消息。',
  newContent: '修改后的消息内容。',
  oldContent: '修改前的消息内容，用于并发校验。',
  num: '需要设置的目标未读数。',
  unreadCount: '会话 ID 到未读数的映射。',
  maxVersion: '客户端当前会话分组最大版本。',
  full: '返回结果是否为全量数据。',
  order: '展示顺序。',
  orders: '会话分组顺序列表。',
  name: '资源名称。',
  ex: '业务扩展字段。',
  hidden: '是否隐藏会话分组。',
  content: '文本内容，具体格式由当前接口和内容类型决定。',
  sourceLanguageCode: '源语言 BCP 47 标签；为空时自动检测。',
  targetLanguageCode: '目标语言 BCP 47 标签。',
  translatedText: '翻译后的文本。',
  detectedLanguageCode: '检测到的源语言 BCP 47 标签。',
  count: '数量。',
  total: '符合条件的记录总数。',
  token: '访问 Token。',
  url: '服务访问地址。',
  jwt: '实时音视频访问 JWT。',
  liveURL: '实时音视频服务地址。',
  creatorNickname: '会议创建者昵称。',
  meetingName: '会议名称。',
  hostUserID: '会议主持人用户 ID。',
  hostUserNickname: '会议主持人昵称。',
  coHostUSerID: '联合主持人用户 ID 列表。',
  coHostUserIDs: '联合主持人用户 ID 列表。',
  canParticipantsEnableCamera: '是否允许参会者启用摄像头。',
  canParticipantsUnmuteMicrophone: '是否允许参会者取消麦克风静音。',
  canParticipantsShareScreen: '是否允许参会者共享屏幕。',
  disableCameraOnJoin: '加入会议时是否默认关闭摄像头。',
  disableMicrophoneOnJoin: '加入会议时是否默认关闭麦克风。',
  canParticipantJoinMeetingEarly: '是否允许参会者提前加入会议。',
  lockMeeting: '是否锁定会议；锁定后新用户不能加入。',
  audioEncouragement: '是否启用音频激励显示。',
  videoMirroring: '是否启用视频镜像。',
  recordOn: '是否按服务端录制策略录制会议。',
  endDate: '重复会议结束日期，Unix 毫秒时间戳。',
  repeatTimes: '重复会议计划生成次数。',
  repeatType: '重复规则类型，参见[会议模块的 `RepeatType`](/docs/chat/platform-api/v3/meeting/overview#repeattype)。',
  repeatDaysOfWeek: '重复星期，参见[会议模块的 `DayOfWeek`](/docs/chat/platform-api/v3/meeting/overview#dayofweek)。',
  interval: '重复规则间隔。',
  repeatDaysOfWeek: '每周重复日期列表。',
  repeatSequence: '当前会议在重复会议中的序号。',
  generatedCount: '已生成的会议实例数量。',
  nextScheduleTime: '下一次计划生成会议的时间。',
  cameraOnEntry: '进入会议时是否启用摄像头。',
  microphoneOnEntry: '进入会议时是否启用麦克风。',
  streamNotExistUserIDList: '未找到对应音视频流的用户 ID 列表。',
  successUserIDList: '操作成功的用户 ID 列表。',
  failedUserIDList: '操作失败的用户 ID 列表。',
  joinedUserIDs: '已出席用户 ID 列表。',
  absentUserIDs: '缺席用户 ID 列表。',
  joinedUsers: '参加会议的用户列表。',
  fileRecords: '会议录制文件列表。',
  fileURL: '录制文件地址。',
  size: '文件大小，格式以接口返回值为准。',
  egressID: '录制任务 ID。',
  downloadUrl: '录制文件下载地址。',
  egressUploading: '录制文件是否仍在上传。',
  recordStatus: '录制状态，参见[会议模块的 `RecordStatus`](/docs/chat/platform-api/v3/meeting/overview#recordstatus)。',
  videoFileSize: '录制视频文件大小，单位为字节。',
  videoCoverUrl: '录制视频封面地址。',
  videoName: '录制视频文件名。',
  createTime: '创建时间，Unix 毫秒时间戳。',
  createdAt: '创建时间，Unix 毫秒时间戳。',
  updatedAt: '更新时间，Unix 毫秒时间戳。',
  createTimeMs: '消息创建时间，Unix 毫秒时间戳。',
  srcUserID: '操作或消息发送者用户 ID。',
  dstUserIDs: '定向接收用户 ID 列表；为空时向会议全员广播。',
  sendID: '消息发送者用户 ID。',
  nickname: '用户展示名称。',
  faceURL: '用户头像地址。',
  contentType: '消息内容类型，参见[消息内容类型](/docs/chat/platform-api/v3/message/message-content-types)。',
  payload: '会议聊天消息内容。',
  type: '业务类型。',
  currentSeq: '客户端最后接收的消息 Seq。',
  initiateTime: '实时通话邀请发起时间。',
  timeout: '邀请超时时间。',
  mediaType: '实时通话媒体类型。',
  platformID: '发起端平台 ID，参见[用户模块的 `PlatformID`](/docs/chat/platform-api/v3/user/overview#platformid)。',
  sessionType: '实时通话会话类型，参见[会话模块的 `ConversationType`](/docs/chat/platform-api/v3/conversation/overview#conversationtype)。',
  busyLineUserIDList: '忙线用户 ID 列表。',
  inviteeUserIDList: '受邀用户 ID 列表。',
  customData: '实时通话邀请的业务扩展数据。',
  invitationInfo: '实时通话邀请信息。',
  invitation: '实时通话邀请信息。',
  offlinePushInfo: '离线推送配置。',
  participant: '通话参与者资料。',
  roomList: '实时通话房间列表。',
  callbackMethod: '任务回调方式，参见[定时任务模块的 `TimerTaskCallbackMethod`](/docs/chat/platform-api/v3/timer/overview#timertaskcallbackmethod)。',
  callbackPayload: '业务回调请求体。',
  callbackHeader: '业务回调请求头。',
  callbackURL: '业务回调地址。',
  maxVersion: '客户端当前已知最大版本。',
  version: '资源版本号。',
};

await main();
