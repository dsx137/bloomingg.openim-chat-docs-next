# WASM 能力准入、结构清理与 OpenIM 增量设计

## 背景

当前 WASM 文档树以 Sendbird Chat SDK v4 的页面组织为结构起点，共有 127 个活跃路由。上一阶段已经建立人工中文正文、逐页审核台账、固定 SDK 快照和发布门禁，但仍保留了大量 Sendbird 功能槽位。

其中部分页面并没有 OpenIM WASM SDK 对应能力，例如：

- `send-an-admin-message`；
- `cancel-an-in-progress-file-upload`；
- `share-an-encrypted-file`。

这些页面当前通过“改由后端实现”“应用自行加密”或“使用通用消息 API 组合”等方式填充。此做法会让读者误以为 OpenIM WASM SDK 覆盖了页面标题所描述的能力，也会让最终信息架构继续受 Sendbird 产品功能清单支配。

本阶段将执行已经确认的边界：WASM 文档只描述固定版本 `@openim/wasm-client-sdk` 公开能力，以及理解和使用这些能力所必需的概念。只能由后端、Platform API、原生推送、第三方服务或应用自定义逻辑实现的功能，不进入 WASM 文档树。

## 目标

1. 从活跃 WASM 信息架构中删除没有直接 SDK 能力支撑的 Sendbird 页面。
2. 对部分映射页面逐页判断核心用户结果，保留真实 OpenIM 工作流，删除仅有替代方案的页面。
3. 补齐 Sendbird 结构中不存在、但固定 WASM SDK 已公开的 OpenIM 能力。
4. 保留 Sendbird 的浏览层级作为结构基础，但不保留 Sendbird 独有产品能力。
5. 让审计台账成为能力准入和活跃路由集合的强制门禁。
6. 中文继续作为唯一内容交付主线；英文保持 `deferred`。

## 非目标

- 不把 WASM npm 包加入站点依赖或运行时产物。
- 不为每个 SDK 方法机械生成独立页面。
- 不在本阶段完成全部保留页面的中文正文和示例验证。
- 不同步清理 Android、iOS、Flutter 或 Unity 的同名页面；本阶段只处理 WASM。
- 不把整个站点重建成 OpenIM API Reference 分类树。
- 不为不支持的 Sendbird 功能保留单独的“如何自行实现”页面。

## 已确认的准入边界

“OpenIM 已覆盖”严格指固定版本 WASM SDK 的公开方法、事件和必要类型能够直接完成页面核心结果。

以下证据不能单独证明页面被覆盖：

- 页面只调用通用 `sendMessage()`，但标题描述的是管理员消息、定时消息、投票或翻译；
- 页面只建议调用业务后端或 Platform API；
- 页面只描述浏览器 API、第三方服务、APNs、Web Push 或业务层加密；
- 页面只复用了 `ex` 或 custom message 字段，但没有实现标题所承诺的完整产品能力；
- 页面正文出现了 `login()`、连接事件等公共前置代码。

## 覆盖状态模型

审核记录新增 `coverageStatus`：

- `unreviewed`：尚未按固定 SDK 逐页判断。
- `sdk-direct`：公开方法、事件或类型能够直接完成页面核心结果。
- `sdk-concept`：没有单一业务方法，但属于使用 WASM SDK 必需的概念页。
- `unsupported`：WASM SDK 不能直接完成页面核心结果。

`sdk-concept` 只允许用于以下类型：

- WASM 概览；
- 环境、资源加载和浏览器运行时准备；
- 登录、连接和生命周期说明；
- 事件订阅模型；
- 错误码、日志和废弃能力；
- 从 Sendbird 迁移时的差异说明；
- 本地存储、同步和浏览器运行时边界。

概念页必须有固定 OpenIM 官方来源，并在 `notes` 中说明保留理由。后端替代方案、第三方实现或不支持功能的介绍不能使用 `sdk-concept`。

## 覆盖状态与结构决策

结构决策必须满足：

| disposition | 允许的 coverageStatus                              | 活跃路由                           |
| ----------- | -------------------------------------------------- | ---------------------------------- |
| `retain`    | `sdk-direct`、`sdk-concept`                        | 是                                 |
| `adapt`     | `sdk-direct`、`sdk-concept`                        | 是                                 |
| `merge`     | 已完成判断，目标页为 `sdk-direct` 或 `sdk-concept` | 否                                 |
| `remove`    | `unsupported`                                      | 否                                 |
| `proposed`  | `sdk-direct`                                       | 否，直到补齐路由元数据并晋升       |
| `undecided` | `unreviewed`                                       | 过渡期间可预览，结构验收前必须归零 |

最终结构检查必须保证：

- 活跃 WASM 路由只包含 `retain` 和 `adapt`；
- `remove`、`merge`、`proposed` 和 `undecided` 不出现在活跃路由或导航；
- 每个活跃页都有 `sdk-direct` 或 `sdk-concept` 结论；
- 每个 `sdk-direct` 页面至少有一个与核心结果直接相关的 `sdkMethods` 或 `sdkEvents`；
- 每个 `sdk-concept` 页面有固定官方来源和明确保留原因；
- 泛用前置方法不得作为无关功能的覆盖证据。

## 当前页面分组

现有英文草稿中的 `Support status` 只能作为初始线索，不能替代人工审核。当前统计为：

- 54 页声称 WASM SDK 直接覆盖；
- 25 页声称部分覆盖；
- 24 页明确没有等价 WASM API；
- 16 页明确属于后端或 Platform API；
- 8 页为后续加入的 OpenIM 专属人工页面，没有旧状态声明。

第一轮确定动作：

1. 24 个“没有等价 API”页面标记为 `unsupported + remove`。
2. 16 个“后端或 Platform API”页面标记为 `unsupported + remove`。
3. 三个用户明确指出的页面直接进入上述删除集合。
4. 25 个部分映射页面逐页判断，不允许批量保留。
5. 54 个“直接覆盖”页面仍需核对核心方法，不能沿用草稿自我声明。
6. 8 个 OpenIM 专属页面按固定声明和官方来源核验。

## 部分映射页面的判断规则

部分映射页面按页面标题承诺的核心用户结果判断：

- OpenIM 使用不同对象或命名，但能够直接完成同一结果：`adapt`。
- 两个 Sendbird 页面在 OpenIM 中对应同一个工作流：`merge`。
- 只有标题中的一个附属步骤被支持，主要能力不支持：`remove`。
- 只能通过后端、第三方服务或应用自定义数据模型补齐：`remove`。
- OpenIM 有更原生的工作流：删除原页面，并新增或合并到 OpenIM 专属页面。

典型处理包括：

- 消息线程改为引用消息工作流，而不是保留 Sendbird thread 对象说明；
- 消息置顶页面删除，另保留真正存在的会话置顶能力；
- channel metadata/custom type 仅在能够准确表述 OpenIM 扩展字段时合并为扩展字段页面；
- Sendbird collection 页面合并为会话/消息查询与事件同步页面；
- 未读和已读页面按 OpenIM Conversation 和群消息读回执能力重新组织；
- 取消上传、消息加密、投票、定时消息、翻译和 metacounter 等无直接能力页面删除。

## OpenIM 专属增量

OpenIM 增量按用户工作流组织，不按 165 个方法逐个生成页面。首轮候选包括：

### 群组

- 转让群主：`transferGroupOwner`；
- 踢出群成员：`kickGroupMember`；
- 按入群时间筛选成员：`getGroupMemberListByJoinTimeFilter`；
- 获取群主和管理员：`getGroupMemberOwnerAndAdmin`；
- 群申请、成员角色和群资料等未被现有 Sendbird 页面准确覆盖的工作流。

### 会话

- 删除一个会话和清理本地会话：`deleteConversation`、`deleteAllConversationFromLocal`；
- 获取和设置会话收消息选项；
- 会话消息销毁、阅后即焚和私聊设置；
- 会话置顶、草稿和扩展字段使用当前非废弃统一入口表达。

### 消息

- 引用消息和高级引用消息：`createQuoteMessage`、`createAdvancedQuoteMessage`；
- URL 媒体消息能力并入现有媒体消息工作流；
- 文件上传：`uploadFile`、`fileMapSet`，只描述 SDK 实际公开的上传流程；
- 撤回、删除、本地插入、搜索、读回执等现有 OpenIM 工作流补齐。

### 浏览器运行时

- 数据库导出：`exportDB`；
- WASM 资源、IndexedDB、同步、断线恢复和多用户隔离等必要运行时说明。

### Signaling

- 固定 SDK 已公开的 signaling 方法和 12 个相关事件可组成一个能力组；
- 页面必须明确固定版本、事件生命周期和产品稳定性边界；
- 不扩写为 SDK 声明中不存在的完整音视频产品能力。

废弃方法不创建页面，也不在正文中列名；对应能力直接由当前替代 API 的参数和工作流说明。

## 信息架构策略

采用“Sendbird 基础组织减法 + OpenIM 增量”的方式：

1. 能直接映射的现有页面保留原浏览位置。
2. 标题中的 `channel`、`URL`、`operator` 等词在正文和导航中改为 OpenIM 的群组、会话、ID 和管理员语义。
3. 缺少自然 Sendbird 容器的会话和浏览器运行时能力使用 OpenIM 专属分支补入。
4. 好友和黑名单能力继续放在当前 User/Relation 相邻结构中，避免本阶段进行全站路径重命名。
5. 不支持页面直接从导航和活跃路由移除，不创建“替代实现”页面。

本阶段不强制把所有 `/channel/` 路径改名为 `/groups/`，但 `targetPath` 应记录未来 OpenIM 原生路径。路径重命名和重定向可在最终 IA 稳定后单独执行。

## 结构数据流

`wasm-content-audit.json` 继续保存逐页决策和历史记录。结构同步按以下顺序工作：

```text
固定 SDK 快照 + 官方来源
          │
          ▼
逐页 coverageStatus / disposition
          │
          ├── retain/adapt ──> 活跃 WASM 路由和导航
          ├── merge ─────────> 历史记录与目标路径
          ├── remove ────────> 历史记录，不生成路由
          └── proposed ──────> 补齐路由元数据后才能晋升
```

结构同步只允许修改：

- `data/structure/chat-pages.json` 中的 WASM 记录；
- `src/generated/routes.json` 中的 WASM 记录；
- `src/generated/navigation.json` 中的 WASM 上下文；
- 与结构变化对应的搜索和中文打包派生文件。

它不得生成或改写人工中文正文。

被删除页面的英文/中文 MDX 从站点内容目录删除，审核记录继续保留。无 OpenIM 等价能力的旧路径返回 404；`merge` 页面在后续重定向阶段指向 `redirectTo`。

## 校验与失败策略

所有发布和结构检查必须 fail closed：

- 活跃路由缺少审核记录时失败；
- 活跃路由仍为 `unreviewed` 或 `undecided` 时失败；
- `unsupported` 页面仍在路由、导航、搜索或 Sitemap 时失败；
- `sdk-direct` 页面没有核心方法或事件证据时失败；
- `sdk-concept` 页面没有固定来源或保留原因时失败；
- OpenIM 专属页面的方法或事件不在固定快照时失败；
- 被删除页面仍有可访问 MDX 时失败；
- 新增活跃页面没有中文结构标题时失败。

错误报告按路径排序并限制输出数量，完整记录数量仍显示在摘要中。

## 测试策略

实施遵循红、绿、重构：

1. 先为 coverage 与 disposition 约束增加失败测试。
2. 为 40 个确定不支持页面建立结构删除断言。
3. 为部分映射页面建立逐页决策清单测试。
4. 为 OpenIM 专属增量建立方法、事件和活跃路由覆盖测试。
5. 验证路由、导航、搜索、Sitemap 和中文打包集合一致。
6. 运行完整 `pnpm check`、`pnpm build` 和代表性运行时冒烟。

运行时冒烟至少验证：

- 三个明确不支持路径返回 404；
- 一个保留的人工中文页正常渲染；
- 一个新增 OpenIM 专属页进入中文待审核或人工正文流程；
- 搜索和 Sitemap 不包含删除路径；
- 非 WASM 文档行为保持不变。

## 完成标准

- 127 个原始 WASM 路由全部完成人工 coverage 和 disposition 判断。
- 活跃 WASM 路由中不存在 `unsupported`、`unreviewed`、`undecided`、`remove`、`merge` 或 `proposed`。
- 40 个已明确无 SDK/后端能力页面全部从活跃结构删除。
- 25 个部分映射页面都有逐页决定和理由。
- 固定 SDK 中确认需要文档化的 OpenIM 专属工作流已进入活跃结构或明确合并到现有页面。
- 中文正文仍只来自人工 MDX；英文继续 `deferred`。
- WASM npm 包不出现在站点依赖中。
- 全量检查、构建和运行时冒烟通过。
