# WASM 中文审核基础设施设计

## 背景

当前 WASM 文档以 Sendbird Chat SDK v4 的页面层级为结构起点，共有 127 个活跃路由。项目已经存在 62 个手工中文 MDX，其余 65 个中文页面由 `scripts/build-wasm-sdk-zh-content.mjs` 根据英文草稿自动生成。这个回退机制让未审核页面看起来已经拥有完整正文，无法准确反映中文内容进度。

当前阶段以中文为唯一交付主线。英文内容保留为结构参考，但在中文全部完成前不进入发布验收。最终信息架构采用“Sendbird 基础组织 − 不适合 OpenIM 的页面 + OpenIM 专属增量”，而不是把 Sendbird 页面清单视为不可变的最终结构。

## 目标

第一阶段建立可持续的中文逐页审核基础设施：

1. 用结构化台账记录所有 WASM 页面槽位及 OpenIM 专属候选项。
2. 将人工中文 MDX 设为中文正文唯一事实源。
3. 将中文生成器收缩为纯派生数据打包器，不再自动创作页面正文。
4. 为中文和英文分别记录审核与发布状态，英文统一从 `deferred` 开始。
5. 建立发布门禁，使未完成内容不会进入公开搜索、Sitemap 或搜索引擎索引。
6. 保持现有侧栏结构可遍历，方便编辑人员继续逐页工作。

## 非目标

第一阶段不完成以下工作：

- 不重排当前可见导航。
- 不在本阶段拆分 `Channel` 为 `Groups` 和 `Conversations`。
- 不批量重写剩余 65 个中文页面。
- 不开始英文正文编辑。
- 不为所有 SDK 方法生成 API Reference。
- 不改变 Platform API、Guides 或其他 SDK 平台的内容工作流。

这些工作将在审核台账稳定后分别进入结构增量和逐页中文内容阶段。

## 事实源边界

### 审核与结构决策

`data/structure/wasm-content-audit.json` 是 WASM 页面审核和结构决策的唯一事实源。它记录：

- 当前活跃的 Sendbird 来源槽位；
- 已删除或已合并的历史槽位；
- 已确认但尚未加入导航的 OpenIM 专属页面；
- 页面保留、改写、合并、删除和新增决策；
- 官方内容来源；
- 固定的 WASM SDK 校验版本；
- 中文和英文各自的审核状态；
- 重定向和审核说明。

### 中文正文

`content/zh/docs/chat/sdk/v4/wasm/**/*.mdx` 是中文正文唯一事实源。生成脚本不得为缺失文件生成 OpenIM 语义、API 说明、后端替代方案或示例代码。

### 派生产物

`src/generated/wasm-sdk-zh-content.json` 继续作为运行时数据文件，但只能包含：

- 从人工中文 MDX 解析出的标题、描述、正文和目录；
- 中文导航标签；
- 审核台账中的页面状态摘要；
- 缺少人工正文的路径列表。

它不是可人工编辑的事实源。

### 固定 SDK 声明快照

`data/structure/wasm-sdk-api.json` 保存从固定 npm 包提取的公开方法、方法签名、事件和废弃标记。快照记录包名、版本、tarball URL 和 npm integrity。审核检查只读取这个本地文件，不在常规开发、检查或构建过程中访问网络。

显式刷新命令 `pnpm wasm:api:sync` 负责下载固定版本的 npm tarball、校验 integrity、提取声明并重建快照。刷新快照属于受审核的来源升级操作，必须与受影响页面的重新核验分开提交。

## 审核台账模型

台账顶层包含固定来源版本和页面数组：

```json
{
  "schemaVersion": 1,
  "sources": {
    "openimDocs": {
      "repository": "https://github.com/openimsdk/docs",
      "commit": "a177b296f1abe53ba2cf7d897acf86467a45e7c6"
    },
    "wasmSdk": {
      "package": "@openim/wasm-client-sdk",
      "version": "3.8.5-hotfix.0",
      "integrity": "sha512-JvUwGeTgUVgicS/88hJtJRkENWBzoPi/8TtQ8/JnqLWFIoLcpdHbs3fXsJ1ZE927v1tfTuwEaXausmsan70Quw=="
    }
  },
  "pages": []
}
```

单页记录使用以下结构：

```json
{
  "currentPath": "/docs/chat/sdk/v4/wasm/message/sending-a-message/send-a-message",
  "targetPath": "/docs/chat/sdk/v4/wasm/message/sending-a-message/send-a-message",
  "sourceKind": "sendbird",
  "disposition": "retain",
  "sendbirdSource": "https://sendbird.com/docs/chat/sdk/v4/javascript/message/sending-a-message/send-a-message",
  "openimSources": [
    "https://github.com/openimsdk/docs/blob/a177b296f1abe53ba2cf7d897acf86467a45e7c6/docs/sdks/api/message/sendMessage.md"
  ],
  "sdkMethods": ["createTextMessage", "sendMessage"],
  "sdkEvents": ["OnRecvNewMessages"],
  "locales": {
    "zh": {
      "reviewStatus": "written",
      "reviewer": null,
      "reviewedAt": null,
      "exampleVerification": {
        "status": "pending",
        "evidence": [],
        "reason": null
      }
    },
    "en": {
      "reviewStatus": "deferred",
      "reviewer": null,
      "reviewedAt": null,
      "exampleVerification": {
        "status": "pending",
        "evidence": [],
        "reason": null
      }
    }
  },
  "redirectTo": null,
  "notes": []
}
```

### 字段枚举

`sourceKind`：

- `sendbird`：由 Sendbird 结构导入的槽位。
- `openim-specific`：OpenIM 特有且需要补入结构的页面。

`disposition`：

- `undecided`：结构槽位尚未完成人工保留、改写、合并或删除决策。
- `retain`：主题与 OpenIM 能力直接对应，保留当前结构。
- `adapt`：保留页面位置，但标题、边界或组织需要改为 OpenIM 语义。
- `merge`：内容并入另一个目标页面。
- `remove`：不进入最终 OpenIM WASM 文档。
- `proposed`：OpenIM 专属候选项，等待结构阶段接入。

`reviewStatus`：

- `deferred`：当前语言尚未开始，英文第一阶段统一使用该状态。
- `structure-only`：只有页面槽位和初始结构信息。
- `mapped`：已确认 OpenIM 对应能力和官方来源。
- `written`：已有人工正文。
- `api-verified`：方法、参数、返回类型和事件已对照固定 SDK 版本核验。
- `example-verified`：示例已通过可重复的类型或运行验证。
- `published`：中文内容、技术信息和示例均达到公开发布条件。

状态按上述顺序单向推进；`removed` 和 `merge` 页面不要求进入语言发布状态。

`exampleVerification.status`：

- `pending`：尚未验证。
- `verified`：示例已经过类型检查、自动化用例或可重复的运行验证，`evidence` 保存命令、用例或演示项目位置。
- `not-applicable`：页面没有可执行示例，`reason` 必须说明该页为何属于概念、边界或纯索引内容。

## 初始台账范围

首次提交台账时应包含：

1. 当前工作树中的 127 个活跃 WASM 路由。
2. 当前工作树已经删除的 WASM `ban/unban` 与 `retrieve banned users` 槽位，记录为 `remove`，并指向 blacklist/block 相关页面或说明删除原因。
3. 已存在人工正文但尚未进入路由的 `transfer-group-owner`，记录为 `openim-specific + proposed`。
4. 已确认但尚未决定最终路由的 OpenIM 能力候选项，包括群成员时间筛选、群主和管理员查询、消息销毁以及 Signaling 能力组；这些记录保持 `proposed`，不在第一阶段修改导航。

现有 62 个手工中文 MDX 在补齐 Sendbird 结构来源、固定 commit 的 OpenIM 来源和初步 disposition 后标记为 `written`，不因方法名存在就自动升级为 `api-verified`。其余活跃槽位标记为 `structure-only + undecided`。如果某个人工页面在第一阶段无法确认来源或 disposition，则保留正文但台账状态降为 `structure-only`，直到来源完成审核。

## 中文内容构建流程

新流程如下：

```text
wasm-content-audit.json
        │
        ├── 校验路径、决策、来源和语言状态
        │
content/zh/**/*.mdx
        │
        ├── 仅解析实际存在的人工文件
        ▼
wasm-sdk-zh-content.json
        │
        ├── pages: 人工中文正文
        ├── pendingPaths: 尚无人工正文的活跃页面
        ├── reviewStates: 中文审核状态
        └── navigationLabels: 中文导航标签
```

`src/lib/localized-docs.ts` 对中文请求按以下规则处理：

1. 有人工中文页面：渲染人工正文。
2. 活跃路由但没有人工中文页面：渲染统一的“中文内容审核中”提示，不生成页面级技术结论。
3. `merge` 或 `remove` 页面：第一阶段仍保持当前路由行为，结构阶段接入重定向或删除。
4. OpenIM 专属 `proposed` 页面：在进入 routes/navigation 前不对外渲染。

统一提示只能包含审核状态和返回文档入口的链接，不包含 API、实现建议或替代方案。

## 发布门禁

### 中文发布条件

中文页面只有同时满足以下条件才能标记为 `published`：

- `disposition` 为 `retain` 或 `adapt`；
- 对应人工中文 MDX 存在；
- `openimSources` 至少包含一个固定到 commit 的官方文档或源码来源；
- `sdkMethods` 中的每个方法都存在于固定版本的 WASM SDK 声明中；
- `sdkEvents` 中的每个事件都存在于固定版本的 `CbEvents` 声明中；
- 中文审核状态已依次完成 `written`、`api-verified` 和 `example-verified`；
- `exampleVerification.status` 为 `verified`，或者为带明确原因的 `not-applicable`；
- `reviewer` 和 `reviewedAt` 已填写；
- 页面 frontmatter 与审核台账的路径和状态一致。

概念页可以没有 `sdkMethods`，但必须在 `notes` 中明确其为概念、浏览器运行时或边界说明页。

### 对外可见性

- 侧栏继续显示当前活跃结构，保证编辑遍历能力。
- 非 `published` 中文页面设置 `robots: noindex, nofollow`。
- 非 `published` 中文页面不进入中文搜索索引和 Sitemap。
- WASM 英文页面第一阶段全部视为 `deferred`，不进入英文 WASM 搜索和 Sitemap，并设置 `noindex`。
- 已发布中文页只声明真实可用的语言 alternate；英文未发布时不生成英文 alternate。

## 验证组件

新增独立的审核校验模块，供命令和测试共用：

- `scripts/lib/wasm-content-audit.mjs`：读取、规范化和校验台账。
- `scripts/check-wasm-content-audit.mjs`：结合 routes、人工中文 MDX 和固定 SDK 声明执行仓库级检查。
- `scripts/sync-wasm-sdk-api.mjs`：仅在显式执行时刷新固定 SDK 声明快照。
- `scripts/__tests__/wasm-content-audit.test.mjs`：使用 Node 内置测试运行器覆盖状态门禁和错误分支。

校验必须覆盖：

- 活跃 WASM route 在台账中恰好出现一次；
- 人工中文 MDX 必须有台账记录；
- `written` 及更高状态必须存在人工 MDX；
- `mapped` 及更高状态必须具有 OpenIM 来源；
- `sourceKind: sendbird` 的 `mapped` 及更高状态必须具有 Sendbird 结构来源；
- `api-verified` 及更高状态中的 SDK 方法必须存在；
- `api-verified` 及更高状态中的 SDK 事件必须存在；
- `published` 必须具备审核人、审核日期以及可验证或明确不适用的示例证据；
- `merge` 必须提供不同于自身的 `redirectTo`；
- `remove` 不得标记为 `published`；
- `undecided` 不得进入 `mapped` 或更高审核状态；
- `openim-specific + proposed` 可以没有活跃 route，但必须提供 OpenIM 来源或明确的 SDK 方法；
- 生成的中文页面集合必须与实际人工 MDX 集合一致，不允许自动正文混入。

## 搜索、Sitemap 和 Metadata

第一阶段建立语言级发布判断函数，供页面 Metadata、搜索索引和 Sitemap 共用，避免三处各自解释状态。

- 中文搜索索引只读取 `published` 的人工中文 MDX。
- 英文 WASM 页面在 `deferred` 阶段不进入公开搜索。
- Sitemap 根据 locale 的 `published` 状态分别生成 URL。
- 页面 Metadata 根据 locale 状态设置 robots 和 alternates。
- 非 WASM 页面保持当前行为，避免扩大第一阶段影响面。

## 错误处理

- 台账 JSON 无法解析、schemaVersion 不支持或存在重复路径时，检查和构建失败。
- 固定的 SDK 声明快照缺失、版本不符或来源 integrity 不匹配时，发布校验失败，不访问网络，也不回退到移动的 `latest`。
- 人工中文文件缺失时允许保持 `structure-only`，但禁止升级到 `written` 或更高状态。
- 官方来源暂时不可访问不影响本地构建；台账保存不可变 commit URL，本地检查只验证格式和映射，来源内容审核由逐页流程完成。
- 生成脚本不得因单页缺失而写入猜测正文。

## 测试策略

使用 Node 内置 `node:test`，避免为内容脚本新增测试框架依赖。测试分为三层：

1. 纯函数单元测试：枚举、重复路径、状态前置条件、merge/remove/proposed 约束。
2. 仓库契约测试：127 个活跃路由、人工中文文件和台账记录的集合一致性。
3. 构建集成测试：生成后确认 JSON 中 `pages` 只来自人工 MDX，缺失页面进入 `pendingPaths`。

现有 `pnpm check` 将加入审核台账检查和 Node 测试。生产构建继续通过 `prebuild` 生成派生 JSON，但生成过程不再改变人工正文或审核台账。

## 兼容与迁移

第一阶段不会删除现有 65 个自动生成页面对应的路由。部署后的变化是这些中文页面从自动技术正文变为统一审核中提示，并从搜索和 Sitemap 中移除。

现有 `src/generated/wasm-sdk-zh-content.json` 会在首次构建时大幅缩小，这是预期迁移结果。该文件仍提交到仓库，保证 standalone 部署不需要运行时访问源 MDX 以外的网络资源。

## 成功标准

第一阶段完成时必须满足：

- 台账覆盖所有活跃、已明确删除和已确认 OpenIM 专属候选页面。
- 62 个现有人工中文页面仍能正常渲染。
- 65 个缺少人工文件的页面不再展示自动生成的技术正文。
- 缺少审核证据的页面无法标记为 `published`。
- 中文和英文 WASM 发布状态彼此独立。
- 搜索、Sitemap 和 Metadata 使用同一发布判断。
- `pnpm check`、生产构建和关键中文页面运行时冒烟验证通过。
- 不覆盖或撤销当前工作树已有的页面删除与生成索引改动。
