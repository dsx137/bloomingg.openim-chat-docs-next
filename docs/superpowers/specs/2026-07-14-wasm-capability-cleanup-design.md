# WASM 全量能力清理设计

## 决策

WASM 文档的活跃结构必须由 `@openim/wasm-client-sdk@3.8.5-hotfix.0` 的公开方法、事件和少量必要概念页决定。Sendbird 只作为页面组织方式参考，不能继续提供 OpenIM 不存在的产品领域、对象或功能页面。

当前 127 个活跃 WASM 路由中有 60 个没有任何固定 SDK 方法或事件证据，其中消息页面 45 个。仅删除这些页面仍会保留 `Application`、`group-channel`、`open-channel` 等错误领域，因此本轮采用完整语义迁移，而不是局部删页。

## 目标信息架构

活跃一级能力节只保留：

1. Getting started
2. User
3. Conversation
4. Group
5. Message
6. Calling
7. Events
8. Local data

根级参考页保留 WASM Overview、Error codes 和 Logger。Deprecated 不作为站点页面；废弃声明只在内部覆盖清单中保留，正文只说明当前替代 API 的能力。

以下 Sendbird 一级节从活跃结构删除：

- Application
- Push notifications
- Report
- Local caching / Collections
- Migration guide / Migrating to OpenIM

Application 中真实存在的初始化、登录、退出、token 和连接生命周期迁入 Getting started。Event handler 中的连接事件迁入认证页，用户、会话、群组和消息事件归各自领域页；Events 只保留事件注册、注销和同步边界概览。

## Message 结构

Message 页面按 OpenIM 任务重组为：

- Overview
- Sending messages
  - Send a message
  - Create media and rich messages
  - Upload files and track progress
- Receiving messages
  - Receive messages
- Retrieving messages
  - Retrieve a message list
  - Retrieve messages
- Searching messages
  - Search messages
- Composing messages
  - Add extra data to a message
  - Mention users in a message
  - Manage typing status
- Managing messages
  - Forward or merge a message
  - Delete or revoke a message
  - Insert a local message
  - Clear message history
- Managing read status
  - Manage group message read receipts

活跃 Message 路径、标题和导航不得包含 `channel`、`group-channel` 或 `open-channel`。

## 删除能力

以下主题在固定 WASM SDK 中没有直接能力，删除正文和活跃路由，不设置误导性重定向：

- 消息翻译和翻译引擎
- 消息投票
- 定时消息
- 消息置顶
- 消息线程
- 消息 reaction
- 开放频道消息
- 消息送达回执
- 标记消息未读
- 文件上传取消
- 加密文件分享
- iOS critical alert
- 管理员消息
- Smart throttling 和 spam flood protection
- Open Graph 自动解析
- 文件消息缩略图生成
- 消息 changelog
- Push notification 注册、偏好、模板和翻译
- Report
- Sendbird Collection 和 Collection migration
- Sendbird Rate limits 页面

应用可以在业务后端或 UI 层自行实现的行为，不能包装成 OpenIM WASM SDK 能力页。

## 合并和重定向

旧页面包含真实 OpenIM 能力时，迁移到新的规范页并设置永久重定向，包括：

- Application authentication -> Getting started session
- Connection event handler -> Getting started session
- User event handler -> 对应 User 页面或 Events 概览
- Channel event handler -> Conversation、Group、Message 同步页中的最接近主任务
- 含 group-channel 的消息发送、接收、搜索、已读和未读页 -> 新 Message 或 Conversation 规范页
- 清空群聊历史 -> Message clear history
- 重复的 mark-as-read 页面 -> Conversation read status 或 Message read receipts
- 自定义类型分类 -> Message extra data

纯虚假能力页面不设置重定向，访问返回 404。

## OpenIM 专属增量

补齐固定 SDK 已公开但当前没有页面的能力：

- Calling：邀请、接受、拒绝、取消、挂断、房间信息、启动时邀请恢复、自定义信令和相关事件。
- Local data：`exportDB()`。
- Message：URL 媒体消息、引用消息、`uploadFile()` 和 `fileMapSet()`。
- User：缺失的废弃好友入口、全局接收选项和声明缺口。

Calling 和部分声明缺口没有对应固定 OpenIM 文档页时，以固定 npm 声明和固定 SDK Core 提交作为不可变证据。

## API 覆盖门禁

覆盖清单扩展到固定包的全部 165 个公开 SDK 方法和 74 个事件。每一项必须具有明确状态：

- `documented`：当前规范页直接说明。
- `excluded-deprecated`：固定声明已废弃，不进入正文；内部清单记录承接该能力的当前 API 页面。
- `excluded-non-paginated`：非分页列表方法不进入正文；内部清单指向强制使用的分页 API 页面。
- `declaration-only`：声明存在但当前包装器不可可靠使用，正文记录缺口。
- `excluded`：不作为公开文档能力或事件，不分配页面。

活跃页面必须满足以下至少一项：

- 拥有覆盖清单中的方法；
- 拥有覆盖清单中的事件；
- 位于明确的概念页白名单，并记录边界说明。

生成器不得重新加入未在规范路由清单中的页面。覆盖清单遗漏、重复归属、引用不存在方法或活跃无证据页面时检查失败。

## 内容和审核

- 中文正文继续是唯一人工事实源。
- 已有人工中文内容迁移到规范路径后逐页核对，不重新生成。
- 新增 Calling、Events 和 Local data 中文页必须人工编写。
- 英文只创建结构骨架，审核状态保持 `deferred`。
- 旧有效页记录为 `merge` 并保存 `redirectTo`；虚假能力记录为 `remove` 且无重定向。
- 所有新活跃页记录 OpenIM 固定来源、SDK 方法、事件和逐页审核状态。

## 验收

- 活跃 WASM 路由、导航、中文打包和搜索中不存在 `application`、`push-notifications`、`report`、`local-caching`、`migration-guide`、`group-channel` 和 `open-channel`。
- 固定包 165 个方法、74 个事件全部完成分类；17 个废弃方法、2 个非分页列表方法以及 `Login`、`UnUsedEvent` 不进入正文，其余项目具有唯一主归属。
- 所有 unsupported 旧 URL 返回 404；所有有效迁移 URL 返回永久重定向。
- 中文规范页均有人工正文和审核记录；英文均为 `deferred`。
- `pnpm content:sync`、`pnpm check`、`pnpm build`、HTTP 和 Playwright 冒烟全部通过。
