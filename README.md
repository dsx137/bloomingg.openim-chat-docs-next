# OpenIM Chat Docs — Next.js current-only starter

这是一个按 Sendbird Chat Docs 的页面组织方式重建、但已针对 OpenIM 做过范围裁剪的 Next.js 文档工程。项目默认只保留**当前版本**的 SDK 指南和 Server API；你接下来主要编辑 `content/docs/**/*.mdx` 即可。

## 当前结构

- **999 个 MDX 页面槽位**。
- **7 个导航上下文**：Server API，以及 Android、iOS、JavaScript、Flutter、Unity、.NET 六个 SDK 平台。
- 双层顶部导航、树形侧栏、面包屑、右侧目录、上下页、全文搜索、暗色主题和移动端适配。
- 每页独立 Metadata、Canonical、Open Graph、Sitemap 与内容状态。
- 内容完整性检查、范围约束、搜索索引、迁移统计、CI、Docker 与 standalone 部署。

当前模板统计：

| 模板       | 数量 | 用途                 |
| ---------- | ---: | -------------------- |
| `landing`  |    1 | Chat 文档入口        |
| `overview` |   32 | 产品或章节概览       |
| `guide`    |  695 | 概念、教程与任务指南 |
| `api`      |  271 | Server API 接口页    |

## 已主动删除的内容

本项目不再保留：

- 全部 UIKit 页面。
- SDK v3 等历史版本。
- Legacy Server API 与历史兼容路由。
- 手写 SDK API Reference 占位页，包括原结构中数量异常大的 Flutter Reference 分支。

SDK Reference 更适合从 TypeScript 类型、Dartdoc、Dokka、Jazzy 或代码注释自动生成；Server API 后续也可以接 OpenAPI 规范。当前工程保留生成器接入边界，但不预建成千上万个空 MDX 文件。

结构范围由 `data/structure/scope.json` 约束，`npm run content:check` 会阻止已删除分支被误加回来。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Fumadocs Core / UI / MDX
- Tailwind CSS
- Shiki
- ESLint、Prettier
- Node.js 22、npm 10

依赖版本锁定在 `package-lock.json` 中。

## 开始使用

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000/docs/chat`。

生产验证：

```bash
pnpm check
pnpm build
pnpm start
```

`pnpm start` 运行 `.next/standalone/server.js`。构建完成后，脚本会把运行所需静态资源复制到 standalone 目录。

## 你接下来只需编辑 MDX

URL 与内容文件保持直观对应：

```text
/docs/chat/sdk/v4/javascript/overview
└── content/docs/chat/sdk/v4/javascript/overview.mdx
```

占位页通常包含一个脚手架组件：

```mdx
<OverviewScaffold
  route="/docs/chat/sdk/v4/javascript/overview"
  context="SDKs · JavaScript · v4"
  sourceTitle="OpenIM SDK for JavaScript"
/>
```

删除该组件并按 `docs/templates` 里的 MDX 模板补充真实内容：

| 页面类型                    | 模板                                       |
| --------------------------- | ------------------------------------------ |
| SDK 平台入口                | `docs/templates/sdk-overview.mdx`          |
| SDK 功能指南                | `docs/templates/sdk-guide.mdx`             |
| Platform API 入口或资源概览 | `docs/templates/platform-api-overview.mdx` |
| Platform API 单接口页面     | `docs/templates/platform-api-endpoint.mdx` |

详细规则见 [内容编写手册](docs/CONTENT_AUTHORING.md)。

开发与构建前会自动：

1. 从 MDX frontmatter 同步标题、描述和状态。
2. 刷新侧栏标题与搜索索引。
3. 检查页面、路由、导航、搜索记录和内容范围是否一致。

编辑已有页面时，无需手工维护导航或搜索 JSON。

## 目录结构

```text
.
├── app/
│   ├── api/search/route.ts           # 搜索接口
│   ├── docs/[[...slug]]/page.tsx     # 文档统一动态路由
│   ├── globals.css                   # 主题 token 与文档壳样式
│   ├── layout.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── content/docs/                     # 999 个可编辑 MDX 页面
├── data/structure/
│   ├── scope.json                    # current-only 范围约束
│   ├── chat-pages.json               # 已裁剪结构快照
│   └── report.json                   # 自动生成的结构统计
├── docs/
│   ├── CONTENT_SCOPE.md              # 保留与删除范围
│   ├── CONTENT_AUTHORING.md          # 内容编写规范
│   ├── BRANDING.md                   # OpenIM 品牌替换点
│   ├── MIGRATION_MAP.md              # 内容迁移顺序
│   ├── ARCHITECTURE.md               # 技术架构
│   └── STRUCTURE_REPORT.md           # 当前页面与上下文清单
├── public/
│   ├── brand/
│   ├── images/docs/
│   └── og/
├── scripts/
│   ├── build-search-index.mjs
│   ├── check-content.mjs
│   ├── content-status.mjs
│   ├── import-structure.mjs
│   ├── prepare-standalone.mjs
│   ├── structure-report.mjs
│   └── sync-content-metadata.mjs
├── src/
│   ├── components/
│   ├── config/
│   ├── generated/
│   ├── lib/
│   └── types/
├── source.config.ts
├── next.config.mjs
├── Dockerfile
└── package.json
```

## 日常命令

| 命令                               | 作用                                   |
| ---------------------------------- | -------------------------------------- |
| `pnpm dev`                         | 同步内容元数据后启动开发服务           |
| `pnpm content:status`              | 查看已发布、草稿、脚手架和废弃页面数量 |
| `pnpm content:sync`                | 同步元数据并重建搜索索引               |
| `pnpm content:check`               | 检查页面、导航、搜索和范围约束         |
| `pnpm structure:report`            | 更新 JSON 与 Markdown 结构报告         |
| `pnpm structure:sync`              | 根据当前路由清单补齐缺失 MDX           |
| `pnpm structure:sync -- --dry-run` | 预览将补齐的页面                       |
| `pnpm check`                       | 内容同步、Lint、类型与完整性检查       |
| `pnpm build`                       | 生产构建并准备 standalone 输出         |

不要对已写入真实正文的项目执行 `pnpm structure:sync -- --force`，该参数会覆盖现有 MDX。

## 哪些文件应该编辑

日常维护：

- `content/docs/**/*.mdx`
- `public/images/docs/**`
- `src/config/site.ts`
- `src/config/docs.ts`
- `public/brand/logo-mark.svg`
- `public/favicon.svg`
- `public/og/default.svg`
- `app/globals.css` 顶部的 CSS token

通常不要手工编辑：

- `src/generated/routes.json`
- `src/generated/navigation.json`
- `src/generated/search-index.json`
- `.source/**`
- `.next/**`

需要新增、删除或移动信息架构节点时，按照 `docs/ARCHITECTURE.md` 的结构变更流程操作。

## 环境变量

```dotenv
NEXT_PUBLIC_SITE_URL=https://docs.example.com
NEXT_PUBLIC_GITHUB_URL=https://github.com/openimsdk
NEXT_PUBLIC_EDIT_BASE_URL=https://github.com/your-org/your-repo/edit/main
```

`NEXT_PUBLIC_EDIT_BASE_URL` 留空时不展示编辑入口。

## 部署

### Docker

```bash
docker compose up --build
```

### Node.js standalone

```bash
npm ci
npm run build
PORT=3000 HOSTNAME=0.0.0.0 npm start
```

### CI

`.github/workflows/ci.yml` 已配置安装依赖、生成 MDX 数据源、内容检查、Lint、TypeScript 和生产构建。

## 进一步阅读

- [内容范围](docs/CONTENT_SCOPE.md)
- [内容编写手册](docs/CONTENT_AUTHORING.md)
- [品牌替换手册](docs/BRANDING.md)
- [架构说明](docs/ARCHITECTURE.md)
- [迁移映射与实施顺序](docs/MIGRATION_MAP.md)
- [当前结构报告](docs/STRUCTURE_REPORT.md)
