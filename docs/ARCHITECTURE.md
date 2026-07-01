# 技术架构

## 1. 目标

项目把页面结构与正文内容分离：作者主要维护 MDX，路由、导航、面包屑、上下页、搜索和 SEO 由统一数据层推导。

默认采用 `current-only` 范围，共 999 个页面和 7 个导航上下文。UIKit、历史版本、兼容路由与 SDK Reference 占位页均不参与运行和构建。Platform API 保持 Sendbird Platform API v3 的目录组织、侧栏层级和页面风格，内容、接口签名与使用细节映射到 OpenIM 官方 REST API 与 webhook 文档。

## 2. 请求链路

```text
浏览器请求 /docs/chat/...
        │
        ▼
app/docs/[[...slug]]/page.tsx
        │
        ├── src/generated/routes.json      定位页面结构记录
        ├── Fumadocs dynamic source        按需加载对应 MDX
        ├── src/generated/navigation.json  生成当前上下文侧栏
        └── MDX frontmatter                提供标题、描述、状态等内容元数据
        │
        ▼
DocsShell
├── GlobalHeader / ProductNav
├── ContextPicker
├── SidebarNav
├── ArticleHeader
├── MDX body
├── Feedback / Pagination
└── TableOfContents
```

文档入口 `/docs/chat` 使用同一动态路由；`template: landing` 会切换为宽屏 Landing 页面。

## 3. 数据源与职责

### `content/docs/**/*.mdx`

正文的唯一事实源。已有页面的标题、描述、状态、平台、版本和正文都从这里维护。

### `data/structure/scope.json`

当前结构范围约束。它定义允许出现的产品、版本、平台，以及是否允许 `reference` 模板。完整性检查会拒绝超出范围的路由。

### `src/generated/routes.json`

页面级结构清单，包含 URL、内容文件、上下文、模板、平台、版本和排序。同步脚本会从 frontmatter 更新可变字段。

### `src/generated/navigation.json`

7 个现行产品/平台上下文的树形侧栏。标题会从对应 MDX 刷新；层级和排序属于结构数据。

### `src/generated/search-index.json`

由 MDX 和路由元数据生成的搜索索引，不手工维护。

### `data/structure/chat-pages.json`

按当前范围裁剪的结构快照。它不是运行时依赖，主要用于审计和批量重建。

### `.source/dynamic.ts`

Fumadocs 自动生成的动态 MDX 导入表。该目录不提交，由安装或构建流程生成。

## 4. 动态 MDX

`source.config.ts` 为文档集合启用动态模式，使页面正文只在请求对应路由时编译和加载。这样在后续继续增加文档时，开发启动与构建不会被所有正文的静态导入放大。

导航、路由和搜索使用轻量 JSON 索引，因此侧栏、上下页和搜索不需要预编译全部正文。

## 5. 内容同步流程

`npm run content:sync` 执行：

1. `sync-content-metadata.mjs`：读取 MDX frontmatter，更新路由记录和导航标题。
2. `build-search-index.mjs`：根据最新路由和正文重建搜索索引。

`pnpm dev` 与 `pnpm build` 都配置了对应 pre-script，日常编辑已有文档无需手工同步。

## 6. 页面模板

| 模板       | 默认脚手架                   | 典型内容                                | 作者模板                                                                      |
| ---------- | ---------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `landing`  | `ChatHero`、`LandingSection` | 产品入口和能力导航                      | 暂无                                                                          |
| `overview` | `OverviewScaffold`           | 平台概览、模块概览和迁移入口            | `docs/templates/sdk-overview.mdx`、`docs/templates/platform-api-overview.mdx` |
| `guide`    | `DocScaffold`                | 概念、步骤、教程和最佳实践              | `docs/templates/sdk-guide.mdx`                                                |
| `api`      | `ApiScaffold`                | Server API 方法、路径、参数、响应和错误 | `docs/templates/platform-api-endpoint.mdx`                                    |

SDK Reference 不使用手写 MDX 模板，后续应由源码或类型定义生成。

## 7. 搜索

`/api/search?q=...&limit=...` 使用构建时生成的本地 JSON 索引，按标题、描述、上下文、关键词和正文计算权重。该实现无外部服务依赖，适合项目初期和中等规模访问。

后续可在不改变页面层的情况下替换为 Algolia、Meilisearch、Typesense 或自建服务。

## 8. 样式与品牌层

`app/globals.css` 负责：

- Tailwind CSS 与 Fumadocs CSS 导入。
- 浅色/深色 CSS token。
- 双层导航、三栏文档布局、Landing、搜索和移动端布局。
- MDX 正文、代码块、表格、提示块和脚手架样式。

核心视觉变量集中在文件顶部的 `:root` 与 `[data-theme='dark']`。

## 9. 结构变更

编辑已有页面时无需修改结构。新增、删除、移动 URL 或改变侧栏层级时：

1. 先确认 `data/structure/scope.json` 是否允许目标产品、版本和平台。
2. 修改 `src/generated/routes.json`。
3. 修改 `src/generated/navigation.json`。
4. 增删对应 MDX 文件。
5. 更新顶部公开入口（如需要）。
6. 执行：

```bash
npm run content:sync
npm run structure:report
npm run check
npm run build
```

批量补齐当前路由清单中的缺失文件：

```bash
npm run structure:sync -- --dry-run
npm run structure:sync
```

不要对已完成正文的仓库使用 `--force`。

## 10. API Reference 接入边界

SDK Reference 建议部署到独立生成目录或路由，例如 `/reference/sdk/<platform>/...`。生成器负责符号、签名、参数和类型；MDX 指南负责概念、工作流和完整示例。

Server API 可继续维护当前 MDX 端点页，也可逐步接入 OpenAPI。无论采用哪种方式，都应保证接口定义只有一个权威来源。

当前 Platform API 有两个输入来源：路由与侧栏结构来自 Sendbird Platform API v3，正文中的 API 签名、请求参数、响应和实现说明来自 OpenIM 官方文档仓库中的 `docs/restapi` Markdown。运行：

```bash
pnpm platform-api:sync
```

会重新生成 301 个 Sendbird 风格 Platform API 页面、结构索引、导航和搜索索引。不要把 Platform API 目录改回 OpenIM REST API 原始分组；如果 OpenIM 没有一一对应的接口，应在对应 Sendbird 风格页面中标明 partial 或 no direct endpoint。

Guides 使用独立的代码路由 `/docs/guides`，不写入 `src/generated/routes.json`。目录结构维护在 `src/components/docs/guides-page.tsx`，正文通过：

```bash
pnpm guides:sync
```

从 OpenIM 官方 `docs/guides` Markdown 同步到 `src/generated/guides-content.json`，页面渲染时只读取本地 JSON。

## 11. 生产构建

Next.js 使用 `output: 'standalone'`。`scripts/prepare-standalone.mjs` 会把 `public` 和 `.next/static` 复制到 standalone 目录：

```bash
npm run build
npm start
```

`outputFileTracingIncludes` 显式包含 `content/docs/**/*.mdx`，确保动态页面在 standalone 产物中可用。

## 12. 可替换边界

以下模块可独立替换而不影响 MDX 路由：

- 搜索：`src/lib/search.ts`、`app/api/search/route.ts`
- 页头与产品导航：`src/components/site/**`
- 上下文选择器：`src/components/docs/context-picker.tsx`
- 反馈：`src/components/docs/feedback.tsx`
- MDX 组件：`src/components/mdx-components.tsx`
- 视觉系统：`app/globals.css`
- SEO：`app/docs/[[...slug]]/page.tsx`、`app/sitemap.ts`
