# WASM API Event Feedback Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 逐页人工统一 59 个 WASM 中文页面中的 API 调用结果、事件反馈、状态合并和事件监听说明。

**Architecture:** API 页面负责说明调用影响，事件归属页面负责唯一的完整 `OpenIM.on()` / `OpenIM.off()` 实现。正文只能在完整阅读单页上下文后使用独立 `apply_patch` 手工修改；脚本仅用于只读盘点、测试、索引和确定性结构数据。

**Tech Stack:** MDX、Node.js 内容校验脚本、`data/structure/wasm-api-ownership.json`、`data/structure/wasm-content-audit.json`、Next.js 文档站。

---

## 执行约束

- 不创建新的 worktree，不清理当前共享工作区，不提交用户已有改动。
- 不使用脚本、正则或批量替换修改任何 `content/zh/**/*.mdx` 正文。
- 每个页面先完整读取，再使用针对该文件的独立 `apply_patch`。
- 每页修改后立即检查事件所有权、相关链接和该页审核记录。
- 只有固定结构字段、所有权清单、审核清单和生成产物可以通过现有脚本更新。

## 统一正文结构

状态修改 API 页面使用以下结构，根据页面上下文人工调整措辞：

```md
## 调用后的状态变化

`setConversation()` 成功后，本次会话设置已经提交。相关状态通过
`CbEvents.OnConversationChanged` 同步；事件的 `data` 是
`ConversationItem[]`，客户端应按 `conversationID` 合并。完整监听方式见
[获取会话列表](/docs/chat/sdk/v4/wasm/conversation/retrieving-conversations/retrieve-conversation-list)。
```

事件归属页面使用以下结构，根据真实事件载荷人工编写：

```ts
const handleConversationChanged = ({ data }) => {
  mergeConversationsByID(data);
};

OpenIM.on(CbEvents.OnConversationChanged, handleConversationChanged);

function removeConversationListener() {
  OpenIM.off(CbEvents.OnConversationChanged, handleConversationChanged);
}
```

纯查询、消息对象创建和本地操作不机械添加事件小节；只有容易误解作用范围时才说明“以返回值为准”或“不会产生共享事件”。

### Task 1: 增加事件写作一致性测试

**Files:**
- Modify: `scripts/__tests__/wasm-full-capability-structure.test.mjs`
- Modify: `scripts/__tests__/wasm-channel-content.test.mjs`

- [ ] **Step 1: 为事件唯一归属添加失败测试**

读取全部 59 个中文页面，提取 `OpenIM.on(CbEvents.X)`，断言每个事件只在 `wasm-api-ownership.json` 指定页面注册。

- [ ] **Step 2: 为事件清理添加失败测试**

断言每个包含 `OpenIM.on()` 的页面都具有相同事件名的 `OpenIM.off()`，并继续要求稳定函数引用。

- [ ] **Step 3: 为已移除同步页面添加回归测试**

断言活动路由和中文正文不再包含 `synchronize-conversation-data`、`synchronize-group-data` 或 `synchronize-call-events` 链接。

- [ ] **Step 4: 运行测试并记录当前失败页面**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-full-capability-structure.test.mjs scripts/__tests__/wasm-channel-content.test.mjs`

Expected: 新增约束在正文统一前准确列出重复监听、错误归属或失效链接；既有测试继续通过。

### Task 2: 逐页审核用户领域

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/overview-user.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-users.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-a-list-of-friends.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-friend-information.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/managing-friends/manage-friend-requests.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/managing-friends/update-or-delete-friends.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/moderating-a-user/retrieve-a-list-of-blocked-users.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/moderating-a-user/block-and-unblock-other-members.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/retrieving-and-updating-user-information/retrieve-the-online-status-of-a-user.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/user/retrieving-and-updating-user-information/update-user-profile.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核用户概览和三个查询页面**

逐页确认查询返回值负责快照，不把查询 API 写成触发好友、黑名单或用户资料事件。概览页只保留事件能力导航，不包含监听代码。

- [ ] **Step 2: 审核好友申请页面**

逐项说明 `addFriend()`、`acceptFriendApplication()`、`refuseFriendApplication()` 和 `deleteFriendRequests()` 的 Promise 结果与申请事件；完整监听代码只保留在该页，按申请记录的参与者标识幂等合并。

- [ ] **Step 3: 审核好友更新和删除页面**

说明 `updateFriends()` 与 `deleteFriend()` 对 `OnFriendInfoChanged`、`OnFriendAdded`、`OnFriendDeleted` 的关系；完整监听代码只保留在该页，以 `userID` 更新或移除缓存。

- [ ] **Step 4: 审核黑名单页面**

查询页只说明返回快照；操作页说明 `addBlack()`、`removeBlack()` 与 `OnBlackAdded`、`OnBlackDeleted`，以 `userID` 更新状态。

- [ ] **Step 5: 审核在线状态和个人资料页面**

在线状态页区分主动查询、订阅结果和 `OnUserStatusChanged` 增量；个人资料页说明 `setSelfInfo()` 与 `OnSelfInfoUpdated`，并区分返回值、事件和重新查询。

- [ ] **Step 6: 更新十页审核记录并运行用户测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-user-content.test.mjs`

Expected: 用户页面事件处理器归属唯一，所有 `on/off` 成对，用户审核测试通过。

### Task 3: 逐页审核会话领域

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/overview-conversation.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/retrieving-conversations/retrieve-conversations.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/retrieving-conversations/retrieve-conversation-list.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversations/set-conversation.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversations/set-conversation-draft.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversations/manage-read-status.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversations/hide-or-archive-conversation.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversations/delete-or-clear-conversation.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/conversation/managing-conversation-groups/manage-conversation-groups.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核概览、获取会话和会话列表**

概览保持概念导航；`getOneConversation()`、`getConversationIDBySessionType()`、`getMultipleConversation()` 只说明查询结果；会话列表页继续作为 `OnNewConversation` 和 `OnConversationChanged` 的唯一监听归属。

- [ ] **Step 2: 审核 setConversation 页面**

为 `setConversation()` 增加“调用后的状态变化”，明确 `OnConversationChanged` 的 `data` 为 `ConversationItem[]`，按 `conversationID` 合并置顶、接收选项、私聊、销毁、标记、备注和扩展字段，并链接会话列表页。

- [ ] **Step 3: 审核草稿和已读状态**

草稿页说明 `setConversationDraft()` 与 `OnConversationChanged`；已读页区分 `markConversationMessageAsRead()`、`getTotalUnreadMsgCount()`、`OnConversationChanged` 和 `OnTotalUnreadMessageCountChanged`，完整总未读监听只保留在该页。

- [ ] **Step 4: 审核隐藏、归档、删除和清空**

分别说明本地会话状态变化、重新出现条件和 `OnConversationChanged` 校准方式；不得把删除会话写成删除好友、退出群组或删除他人数据。

- [ ] **Step 5: 审核会话分组页面**

逐项说明创建、更新、排序、删除、添加成员关系和移除成员关系对应的五个分组事件，完整监听实现只保留在该页，以 `conversationGroupID` 合并。

- [ ] **Step 6: 更新九页审核记录并运行会话测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-channel-content.test.mjs scripts/__tests__/wasm-conversation-group-structure.test.mjs`

Expected: 会话事件归属唯一，所有调用影响说明准确，测试通过。

### Task 4: 逐页审核群组领域

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/overview-group.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/creating-and-updating-groups/create-or-update-a-group.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/retrieving-groups/retrieve-and-search-groups.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/joining-and-leaving-groups/join-leave-or-dismiss-a-group.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/managing-group-applications/manage-group-applications.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/retrieving-group-members/retrieve-group-members.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/managing-group-members/invite-or-remove-group-members.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/managing-group-members/update-group-member-info.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/managing-group-members/transfer-group-owner.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/group/moderating-groups/mute-a-group-or-member.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核概览、创建和更新群组**

概览保持概念导航；创建和更新页说明返回的 `GroupItem`、`OnGroupInfoChanged` 和按 `groupID` 合并方式，不重复监听代码。

- [ ] **Step 2: 审核群组查询和生命周期**

群组查询页作为 `OnJoinedGroupAdded`、`OnJoinedGroupDeleted`、`OnGroupInfoChanged`、`OnGroupDismissed` 的唯一监听归属；加入、退出和解散页只说明条件触发关系并链接查询页。

- [ ] **Step 3: 审核群申请页面**

区分提交申请、处理申请、删除记录和清除角标；完整处理五个群申请事件，以申请参与者和 `groupID` 幂等合并。

- [ ] **Step 4: 审核群成员查询和管理页面**

群成员查询页作为新增、删除和资料变化事件的唯一监听归属；邀请、移除、更新资料和转让群主页只说明 API 结果与事件影响，按 `groupID:userID` 合并。

- [ ] **Step 5: 审核禁言页面**

说明整体禁言通过 `OnGroupInfoChanged` 校准，成员禁言通过 `OnGroupMemberInfoChanged` 校准；保留秒和毫秒时间戳归一化规则。

- [ ] **Step 6: 更新十页审核记录并运行群组测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-channel-content.test.mjs scripts/__tests__/wasm-user-content.test.mjs`

Expected: 群组事件归属唯一，状态合并键准确，测试通过。

### Task 5: 逐页审核消息收发、查询和搜索

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/overview-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/sending-messages/send-a-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/sending-messages/create-media-and-rich-messages.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/sending-messages/upload-files-and-track-progress.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/receiving-messages/receive-messages.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/retrieving-messages/retrieve-message-list.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/retrieving-messages/retrieve-messages.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/searching-messages/search-messages.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核消息概览和发送消息**

概览只解释两步发送模型和导航；发送页区分创建 `MessageItem`、`sendMessage()` 返回值和接收端事件，不在发送页重复注册接收事件。

- [ ] **Step 2: 审核媒体创建和上传**

媒体创建页说明工厂方法本身不完成投递；上传页作为 `OnProgress` 和 `UploadComplete` 的唯一归属，说明上传标识与 `clientMsgID` 的关联和清理。

- [ ] **Step 3: 审核接收消息**

接收页保持六个消息接收事件的唯一归属，统一单条和复数事件边界，按 `clientMsgID` 去重，并链接撤回、会话未读和历史查询页面。

- [ ] **Step 4: 审核历史、定位和搜索页面**

三个页面只把查询结果作为快照；需要处理新消息、撤回或同步完成时引用相应事件归属页面，不重复注册处理器。

- [ ] **Step 5: 更新八页审核记录并运行消息结构测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-full-capability-structure.test.mjs`

Expected: 消息接收和上传事件没有重复归属，查询页面没有虚构触发关系。

### Task 6: 逐页审核消息编排、管理和已读状态

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/composing-messages/add-extra-data-to-a-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/composing-messages/manage-typing-status.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/composing-messages/mention-users-in-a-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/composing-messages/transcribe-audio.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-messages/clear-message-history.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-messages/forward-or-merge-a-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-messages/delete-or-revoke-a-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-messages/pin-conversation-messages.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-messages/insert-a-local-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/message/managing-read-status/manage-group-message-read-receipts.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核扩展数据、@、输入状态和语音转文字**

区分消息创建、发送、服务端自定义通知、本地 `localEx` 和语音识别返回值；输入状态页保留 `OnConversationUserInputStatusChanged` 的唯一监听代码。

- [ ] **Step 2: 审核清理、转发和本地插入**

说明清理操作与会话事件、转发消息与接收事件、本地插入与共享投递之间的边界；纯本地操作不得写成会同步给其他用户。

- [ ] **Step 3: 审核删除、撤回和修改消息**

逐项说明本地删除、服务端删除、撤回、修改和按用户清理对应的事件；完整监听只保留在该页，以 `clientMsgID` 和 `conversationID` 更新。

- [ ] **Step 4: 审核置顶消息和已读回执**

置顶页保持 `OnChangedPinnedMsg` 唯一归属；已读页区分群消息成员列表、群回执和单聊回执，完整监听代码覆盖所有归属事件并提供清理。

- [ ] **Step 5: 更新十页审核记录并运行消息结构测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-full-capability-structure.test.mjs`

Expected: 消息修改类 API 都有准确事件说明，纯本地能力没有虚构共享事件。

### Task 7: 逐页审核音视频通话

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/calling/overview-calling.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/calling/managing-calls/start-or-handle-a-call.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/calling/retrieving-call-information/retrieve-call-information.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/calling/sending-custom-signals/send-a-custom-signal.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核通话概览和查询页面**

概览只解释信令与媒体引擎边界；查询页只说明启动恢复、群房间和 token 查询结果，不把查询写成通话状态事件。

- [ ] **Step 2: 审核通话生命周期页面**

逐项说明邀请、接受、拒绝、取消和挂断的 Promise 结果与十一种通话事件；完整监听代码只保留在该页，以 `roomID` 和用户 ID 合并并释放媒体资源。

- [ ] **Step 3: 审核自定义信令页面**

说明 `signalingSendCustomSignal()` 和 `OnReceiveCustomSignal` 的发送端、接收端边界，保持唯一监听和对应清理。

- [ ] **Step 4: 更新四页审核记录并运行所有权测试**

Run: `node --experimental-strip-types --test scripts/__tests__/wasm-full-capability-structure.test.mjs`

Expected: 通话事件全部归属活动页面，所有监听均有清理。

### Task 8: 逐页审核基础页面

**Files:**
- Modify: `content/zh/docs/chat/sdk/v4/wasm/overview.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/getting-started/send-first-message.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/getting-started/authenticate-and-manage-session.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/getting-started/environment-specific-implementation.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/events/overview-events.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/error-codes.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/logger.mdx`
- Modify: `content/zh/docs/chat/sdk/v4/wasm/local-data/export-local-database.mdx`
- Modify: `data/structure/wasm-content-audit.json`

- [ ] **Step 1: 审核总览和入门页面**

总览只负责领域导航；首条消息页面允许展示最小端到端事件链路，但必须链接到正式归属页面；认证页面保持连接事件唯一归属；环境页面不得重复注册连接事件。

- [ ] **Step 2: 审核事件概览**

事件概览只负责全局注册原则、服务端同步事件和领域归属导航；普通消息、连接和业务事件不在该页重复监听。

- [ ] **Step 3: 审核错误码和日志**

错误码页说明错误事件与业务 API 错误的区别，不重复注册连接和同步事件；日志页只保留 `OnUploadLogsProgress` 唯一监听，其他事件以链接说明。

- [ ] **Step 4: 审核本地数据库导出**

说明 `exportDB()` 的本地作用范围和返回结果，不添加共享业务事件。

- [ ] **Step 5: 更新八页审核记录并运行基础页面测试**

Run: `node --experimental-strip-types --test scripts/__tests__/*.test.mjs`

Expected: 全局页面不再与业务归属页面重复注册事件。

### Task 9: 全量所有权、审核和构建验证

**Files:**
- Modify: `data/structure/wasm-api-ownership.json`
- Modify: `data/structure/wasm-content-audit.json`
- Modify: `data/structure/wasm-domain-api-coverage.json` only if an event owner changes
- Generated: `src/generated/wasm-sdk-zh-content.json`
- Generated: `src/generated/search-index.json`
- Generated: `src/generated/search-index-zh.json`

- [ ] **Step 1: 只读扫描正文事件监听**

列出所有 `OpenIM.on(CbEvents.X)` 及其文件，人工对照所有权清单。扫描只读取正文，不修改正文。

- [ ] **Step 2: 核对 59 条活动审核记录**

确认每个页面的 `sdkMethods`、`sdkEvents`、证据、中文审核状态和本轮逐页审核说明与最终正文一致。

- [ ] **Step 3: 运行全量检查**

Run: `pnpm check`

Expected: 74 项及新增测试全部通过，59 个活动中文页面、0 个待审核活动页面，内容完整性检查通过。

- [ ] **Step 4: 运行生产构建**

Run: `pnpm build`

Expected: Next.js 生产构建成功，所有静态页面和动态路由完成生成。

- [ ] **Step 5: 恢复 next-env.d.ts**

确认文件包含：

```ts
import "./.next/dev/types/routes.d.ts";
```

- [ ] **Step 6: 最终人工抽查**

逐域抽查至少一个查询页、一个状态修改页和一个事件归属页，确认没有脚本化模板痕迹、重复监听、错误触发关系或生硬中文。
