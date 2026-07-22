import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { format } from 'prettier';
import { webhookCategoryTitles, webhookRoute, webhookSpecs } from './openim-webhook-specs.mjs';

const root = process.cwd();
const openSourceRoot =
  process.env.OPENIM_OPEN_SOURCE_SERVER ?? '/Users/gordon/GolandProjects/open-im-server';
const enterpriseRoot =
  process.env.OPENIM_ENTERPRISE_SERVER ?? '/Users/gordon/GolandProjects/open-im-server-enterprise';

const externalEmbeddedFields = {
  GroupInfo: [
    field('groupID', 'string'), field('groupName', 'string'), field('notification', 'string'),
    field('introduction', 'string'), field('faceURL', 'string'), field('ownerUserID', 'string'),
    field('createTime', 'int64'), field('memberCount', 'uint32'), field('ex', 'string'),
    field('status', 'int32'), field('creatorUserID', 'string'), field('groupType', 'int32'),
    field('needVerification', 'int32'), field('lookMemberInfo', 'int32'),
    field('applyMemberFriend', 'int32'), field('notificationUpdateTime', 'int64'),
    field('notificationUserID', 'string'),
    field('displayIsRead', 'bool', false, 'enterprise'),
    field('muteBypassUserIDs', '[]string', false, 'enterprise'),
  ],
  OfflinePushInfo: [
    field('title', 'string'), field('desc', 'string'), field('ex', 'string'),
    field('iOSPushSound', 'string'), field('iOSBadgeCount', 'bool'),
  ],
};

const descriptions = {
  callbackCommand: '回调命令，值与当前页面的回调命令一致。',
  operationID: 'OpenIM 操作的链路追踪 ID。',
  userID: '用户 ID。', ownerUserID: '会话或关系所属用户 ID。', fromUserID: '发起操作的用户 ID。',
  toUserID: '目标用户 ID。', friendUserID: '好友用户 ID。', blackUserID: '黑名单用户 ID。',
  friendUserIDs: '好友用户 ID 列表。', users: '用户资料列表，元素结构见用户模块的 `UserInfo`。',
  groupID: '群组 ID。', groupName: '群组名称。', groupType: '群组类型。', groupEx: '群组扩展字段。',
  initMemberList: '创建群组时提交的初始成员列表。', memberList: '待加入群组的成员列表。',
  memberCallbackList: '允许修改的群成员资料列表。', invitedUserIDs: '被邀请加入群组的用户 ID 列表。',
  refusedMembersAccount: '拒绝邀请的用户 ID 列表；这些用户不会加入群组。', kickedUserIDs: '被移出群组的用户 ID 列表。',
  oldOwnerUserID: '原群主用户 ID。', newOwnerUserID: '新群主用户 ID。', ownerID: '群主用户 ID。',
  sendID: '消息发送者用户 ID。', recvID: '消息接收者用户 ID；单聊时为对端用户 ID。', receiveID: '消息接收者用户 ID。',
  serverMsgID: 'OpenIM 服务端消息 ID。', clientMsgID: '客户端消息 ID。', conversationID: '会话 ID。',
  content: '消息内容；通常是与消息类型对应的 JSON 字符串。',
  contentType: '消息内容类型，参见[消息内容类型](/docs/chat/platform-api/v3/message/message-content-types)。',
  sessionType: '会话类型，参见[会话模块的 `ConversationType`](/docs/chat/platform-api/v3/conversation/overview#conversationtype)。',
  senderPlatformID: '发送端平台 ID，参见[用户模块的 `PlatformID`](/docs/chat/platform-api/v3/user/overview#platformid)。', senderNickname: '发送者昵称。',
  senderFaceURL: '发送者头像地址。', faceURL: '头像地址。', atUserList: '被 @ 的用户 ID 列表。',
  atUserIDList: '被 @ 的用户 ID 列表。', seq: '消息或连接序列号。', Seqs: '本次标记已读的消息 Seq 列表。',
  unreadMsgNum: '当前未读消息数量。', options: '消息发送选项。', offlinePushInfo: '离线推送配置。',
  attachedInfo: '附加信息。', reqMsg: '好友申请附言。', reqMessage: '入群申请或邀请说明。',
  reason: '操作原因。', remark: '好友备注。', ex: '业务扩展字段。', nickname: '用户昵称。', nickName: '用户昵称。',
  roleLevel: '群成员角色级别。', muteEndTime: '禁言结束时间，Unix 毫秒时间戳。',
  notification: '群公告。', introduction: '群简介。', creatorUserID: '群创建者用户 ID。',
  needVerification: '入群验证方式。', lookMemberInfo: '是否允许普通成员查看群成员资料。',
  applyMemberFriend: '是否允许普通成员添加群成员为好友。', notificationUpdateTime: '群公告更新时间。',
  notificationUserID: '最后更新群公告的用户 ID。',
  platformID: '客户端平台 ID，参见[用户模块的 `PlatformID`](/docs/chat/platform-api/v3/user/overview#platformid)。',
  platform: '客户端平台名称。',
  displayIsRead: '是否展示群消息已读状态。', muteBypassUserIDs: '全群禁言时仍可发送消息的用户 ID 列表。',
  userIDList: '目标用户 ID 列表。', isAppBackground: '客户端是否处于后台。', connID: '连接 ID。',
  title: '离线推送标题。', desc: '离线推送摘要。', iOSPushSound: 'iOS 推送提示音。',
  iOSBadgeCount: '是否更新 iOS 角标。', actionCode: '处理状态，参见[Webhooks 概述的 `CallbackAction`](/docs/chat/platform-api/v3/webhooks/overview#callbackaction)。',
  errCode: '业务错误码；拒绝前置操作时返回业务约定的非零错误码。', errMsg: '错误简要信息。',
  errDlt: '错误详细信息。', nextCode: '处理下一步，参见[Webhooks 概述的 `CallbackNextCode`](/docs/chat/platform-api/v3/webhooks/overview#callbacknextcode)。',
  owner_user_id: '会话所属用户 ID。', conversation_id: '会话 ID。', conversation_type: '会话类型。',
  user_id: '单聊对端用户 ID。', group_id: '群组 ID。', recv_msg_opt: '会话消息接收选项。',
  is_pinned: '是否置顶会话。', is_marked: '是否标记会话。', is_private_chat: '是否为阅后即焚会话。',
  burn_duration: '阅后即焚时长。', group_at_type: '群会话 @ 提醒类型。', attached_info: '会话附加信息。',
  keyVersion: '消息加密密钥版本号。',
};

async function main() {
  await validateSpecs();
  const openSourceStructs = await loadStructs(resolve(openSourceRoot, 'pkg/callbackstruct'));
  const enterpriseStructs = await loadStructs(resolve(enterpriseRoot, 'pkg/callbackstruct'));
  for (const spec of webhookSpecs) {
    const requestFields = expandStruct(
      spec.requestType,
      enterpriseStructs.has(spec.requestType) ? enterpriseStructs : openSourceStructs,
    );
    const responseFields = expandStruct(
      spec.responseType,
      enterpriseStructs.has(spec.responseType) ? enterpriseStructs : openSourceStructs,
    );
    if (spec.edition !== 'enterprise') {
      markEnterpriseFields(requestFields, expandStruct(spec.requestType, openSourceStructs));
      markEnterpriseFields(responseFields, expandStruct(spec.responseType, openSourceStructs));
    }
    if (!requestFields.length) throw new Error(`Webhook request struct not found: ${spec.requestType}`);
    if (!responseFields.length) throw new Error(`Webhook response struct not found: ${spec.responseType}`);
    const file = resolve(root, `content/zh${webhookRoute(spec)}.mdx`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, await format(renderPage(spec, requestFields, responseFields), { parser: 'mdx' }));
  }
  await linkOverviewEntries();
  console.log(`Wrote ${webhookSpecs.length} Chinese Webhook pages.`);
}

async function validateSpecs() {
  const constantSources = await Promise.all([
    readFile(resolve(openSourceRoot, 'pkg/callbackstruct/constant.go'), 'utf8'),
    readFile(resolve(enterpriseRoot, 'pkg/callbackstruct/constant.go'), 'utf8'),
  ]);
  const commands = new Set(
    constantSources.flatMap((source) =>
      [...source.matchAll(/=\s*"(callback[^"]+Command)"/g)].map((match) => match[1]),
    ),
  );
  const configSources = await Promise.all([
    readFile(resolve(openSourceRoot, 'config/webhooks.yml'), 'utf8'),
    readFile(resolve(enterpriseRoot, 'config/webhooks.yml'), 'utf8'),
  ]);
  for (const spec of webhookSpecs) {
    if (!commands.has(spec.command)) throw new Error(`Webhook command not found: ${spec.command}`);
    if (!configSources.some((source) => new RegExp(`^${spec.key}:`, 'm').test(source)))
      throw new Error(`Webhook config not found: ${spec.key}`);
  }
}

async function linkOverviewEntries() {
  const file = resolve(root, 'content/zh/docs/chat/platform-api/v3/webhooks/overview.mdx');
  let source = await readFile(file, 'utf8');
  for (const spec of webhookSpecs) {
    const linked = `[${spec.key}](${webhookRoute(spec)})`;
    source = source.replace(new RegExp(`(?<=\\| )(?:\\[)?${spec.key}(?:\\]\\([^)]*\\))?`), linked);
  }
  await writeFile(file, await format(source, { parser: 'mdx' }));
}

function renderPage(spec, requestFields, responseFields) {
  const enterprise = spec.edition === 'enterprise';
  const timing = spec.timing === 'before' ? '前置回调' : '后置回调';
  const requestSample = Object.fromEntries(requestFields.map((item) => [item.name, sample(item, spec)]));
  const responseSample = Object.fromEntries(responseFields.map((item) => [item.name, sampleResponse(item)]));
  const behavior = spec.timing === 'before'
    ? '- OpenIM 同步等待业务服务端响应。\n- 返回 `nextCode: 0` 时继续原流程；返回 `nextCode: 1` 时，OpenIM 使用响应中的错误信息终止本次操作。\n- 请求失败或超时后的行为由该回调的 `failedContinue` 配置决定。\n- 响应中的业务字段仅在对应字段存在时覆盖 OpenIM 即将处理的数据。'
    : '- 事件发生后，OpenIM 异步调用该地址。\n- 回调响应不能改变已经完成的 OpenIM 操作。\n- 接收方应快速返回成功状态，再异步执行耗时业务。\n- 接收方应按业务主键或 `operationID` 做幂等处理。';
  return `---
title: ${JSON.stringify(spec.title)}
description: ${JSON.stringify(`OpenIM Webhooks：${spec.summary}`)}
product: "platform-api"
context: "chat/platform-api/v3"
template: "api"
status: "published"
lastUpdated: "2026-07-21"
version: "v3"
${enterprise ? 'edition: "enterprise"\n' : ''}sourcePath: "${webhookRoute(spec)}"
---

${spec.summary}${enterprise ? ' 此回调仅在 OpenIM 商业版中提供。' : ''}

## 触发时机

| 项目 | 说明 |
| --- | --- |
| 类型 | ${timing} |
| 配置项 | \`${spec.key}\` |
| 回调命令 | \`${spec.command}\` |

## HTTP 请求

\`\`\`http
POST {WEBHOOK_ADDRESS}/${spec.command}
Content-Type: application/json
operationID: {OPERATION_ID}
\`\`\`

` + codeBlock('json', requestSample) + `

### 请求体参数

${fieldTable(requestFields, true)}

## 响应

业务服务端应返回 HTTP 成功状态和 JSON 响应体。

` + codeBlock('json', responseSample) + `

### 响应参数

${fieldTable(responseFields, false)}

## 处理规则

${behavior}

## 相关页面

- [Webhooks 概述](/docs/chat/platform-api/v3/webhooks/overview)
- [${webhookCategoryTitles[spec.category]}模块概述](${moduleOverview(spec.category)})
`;
}

function fieldTable(fields, request) {
  const header = request ? '| 参数名 | 是否必填 | 类型 | 说明 |\n| --- | --- | --- | --- |' : '| 参数名 | 类型 | 说明 |\n| --- | --- | --- |';
  const rows = fields.map((item) => {
    const name = `${item.name}${item.edition === 'enterprise' ? ' <span className="enterprise-field-badge">商业版</span>' : ''}`;
    return request
      ? `| ${name} | ${item.optional ? '否' : '是'} | ${displayType(item)} | ${describe(item)} |`
      : `| ${name} | ${displayType(item)} | ${describe(item)} |`;
  });
  return `${header}\n${rows.join('\n')}`;
}

function moduleOverview(category) {
  const moduleID = category === 'push' ? 'message' : category;
  return `/docs/chat/platform-api/v3/${moduleID}/overview`;
}

function codeBlock(language, value) {
  return `\`\`\`${language}\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

async function loadStructs(directory) {
  const structs = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.go')) continue;
    const source = await readFile(resolve(directory, entry.name), 'utf8');
    for (const item of parseStructs(source)) structs.set(item.name, item.fields);
  }
  return structs;
}

function parseStructs(source) {
  const result = [];
  const pattern = /\btype\s+(\w+)\s+struct\s*\{/g;
  let match;
  while ((match = pattern.exec(source))) {
    const open = pattern.lastIndex - 1;
    const close = closingBrace(source, open);
    const fields = [];
    for (const rawLine of source.slice(open + 1, close).split(/\r?\n/)) {
      const line = rawLine.trim().replace(/\s*\/\/.*$/, '');
      if (!line) continue;
      const named = line.match(/^(\w+)\s+(.+?)\s+`[^`]*json:"([^",]+)[^"]*"[^`]*`/);
      if (named) {
        fields.push(field(named[3], named[2], named[2].includes('*')));
        continue;
      }
      const embedded = line.match(/^\*?([\w.]+)(?:\s+`[^`]*json:"([^",]+)[^"]*"[^`]*`)?/);
      if (embedded) fields.push({ embedded: basenameType(embedded[1]), name: embedded[2] });
    }
    result.push({ name: match[1], fields });
    pattern.lastIndex = close + 1;
  }
  return result;
}

function expandStruct(name, structs, stack = []) {
  if (stack.includes(name)) return [];
  const source = structs.get(name) ?? externalEmbeddedFields[name] ?? [];
  const fields = [];
  for (const item of source) {
    if (!item.embedded) {
      fields.push(item);
      continue;
    }
    if (item.name) fields.push(field(item.name, item.embedded));
    else fields.push(...expandStruct(item.embedded, structs, [...stack, name]));
  }
  return unique(fields);
}

function unique(fields) {
  const seen = new Set();
  return fields.filter((item) => !seen.has(item.name) && seen.add(item.name));
}

function markEnterpriseFields(fields, openSourceFields) {
  const openSourceNames = new Set(openSourceFields.map((item) => item.name));
  for (const item of fields) {
    if (!openSourceNames.has(item.name)) item.edition = 'enterprise';
  }
}

function closingBrace(source, open) {
  let depth = 0;
  for (let index = open; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}' && --depth === 0) return index;
  }
  throw new Error('Unclosed Go struct.');
}

function field(name, type, optional = false, edition) {
  return { name, type: type.trim(), optional, ...(edition ? { edition } : {}) };
}

function basenameType(type) {
  return type.replace(/^\*/, '').split('.').at(-1);
}

function displayType(item) {
  let type = item.type.replaceAll('*', '').trim();
  const array = type.startsWith('[]');
  type = type.replace(/^\[\]/, '');
  type = basenameType(type);
  if (type === 'CallbackCommand') type = 'string';
  if (/^(?:u?int\d*|float\d*)$/.test(type)) type = 'int';
  else if (type === 'StringValue') type = 'string';
  else if (type === 'Int32Value' || type === 'Int64Value') type = 'int';
  else if (type === 'BoolValue') type = 'boolean';
  else if (type === 'bool') type = 'boolean';
  else if (type.startsWith('map[')) type = 'object';
  else if (!['string', 'int', 'boolean'].includes(type)) type = 'object';
  return `${type}${array ? '[]' : ''}`;
}

function sample(item, spec) {
  if (item.name === 'callbackCommand') return spec.command;
  const type = displayType(item);
  if (type.endsWith('[]')) {
    if (type === 'string[]') return [sampleString(item.name)];
    if (item.name === 'users') return [{ userID: 'user_001', nickname: 'Alice', faceURL: 'https://example.com/alice.png', ex: '' }];
    if (item.name === 'initMemberList') return [{ userID: 'user_001', roleLevel: 100 }];
    if (item.name === 'memberList') return [{ userID: 'user_002', ex: '' }];
    return [{}];
  }
  if (type === 'boolean') return false;
  if (type === 'int') return /time/i.test(item.name) ? 1719800000000 : 1;
  if (type === 'object') return {};
  return sampleString(item.name);
}

function sampleResponse(item) {
  if (item.name === 'actionCode' || item.name === 'nextCode' || item.name === 'errCode') return 0;
  if (item.name === 'errMsg' || item.name === 'errDlt') return '';
  return sample(item, { command: '' });
}

function sampleString(name) {
  const samples = [
    [/operationID/i, 'operation_001'], [/conversation/i, 'si_user_001_user_002'],
    [/group/i, 'group_001'], [/serverMsg/i, 'server_msg_001'], [/clientMsg/i, 'client_msg_001'],
    [/user|send|recv|owner|friend|black|member|apply|inviter/i, 'user_001'],
    [/faceURL/i, 'https://example.com/avatar.png'], [/content/i, '{"text":"hello"}'],
    [/nick|name/i, 'Alice'], [/remark/i, '同事'], [/reqMsg|reqMessage|reason/i, '申请说明'],
  ];
  return samples.find(([pattern]) => pattern.test(name))?.[1] ?? '';
}

function describe(item) {
  if (descriptions[item.name]) return descriptions[item.name];
  const type = basenameType(item.type.replace(/^\[\]\*?/, ''));
  const links = {
    UserInfo: '[用户模块的 `UserInfo`](/docs/chat/platform-api/v3/user/overview#userinfo)',
    GroupAddMemberInfo: '[群组模块的成员资料](/docs/chat/platform-api/v3/group/overview#groupmemberinfo)',
    OfflinePushInfo: '[消息模块的离线推送信息](/docs/chat/platform-api/v3/message/overview)',
  };
  if (links[type]) return `结构为${links[type]}。`;
  return `${item.name} 字段。`;
}

await main();
