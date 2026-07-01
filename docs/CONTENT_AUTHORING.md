# 内容编写手册

## 1. 找到页面

URL 与 MDX 文件一一对应：

```text
/docs/chat/platform-api/v3/user/creating-users/create-a-user
content/docs/chat/platform-api/v3/user/creating-users/create-a-user.mdx
```

根页面使用 `index.mdx`：

```text
/docs/chat
content/docs/chat/index.mdx
```

查找路由：

```bash
rg '"/docs/chat/sdk/v4/wasm/overview"' src/generated/routes.json
```

## 2. Frontmatter

每页至少保留：

```yaml
---
title: '页面标题'
description: '用于搜索摘要和 SEO 的一句话描述。'
product: 'sdk'
context: 'chat/sdk/v4/wasm'
template: 'guide'
status: 'draft'
lastUpdated: '2026-06-24'
version: 'v4'
platform: 'wasm'
sourcePath: '/docs/chat/sdk/v4/wasm/original-structure-path'
---
```

| 字段          | 是否必填 | 说明                                           |
| ------------- | -------- | ---------------------------------------------- |
| `title`       | 是       | 页面标题、侧栏标题和搜索标题                   |
| `description` | 是       | SEO 与搜索摘要，建议 40–160 字                 |
| `product`     | 是       | `chat`、`sdk` 或 `platform-api`                |
| `context`     | 是       | 所属导航上下文，已有页面不要随意修改           |
| `template`    | 是       | `landing`、`overview`、`guide` 或 `api`        |
| `status`      | 是       | `scaffold`、`draft`、`published`、`deprecated` |
| `lastUpdated` | 建议     | `YYYY-MM-DD`                                   |
| `version`     | 条件必填 | 版本化页面使用                                 |
| `platform`    | 条件必填 | SDK 平台页面使用                               |
| `sourcePath`  | 建议保留 | 结构来源追踪，不显示在正文中                   |

状态含义：

- `scaffold`：尚未开始，仍是占位页。
- `draft`：正在编写，不应视为最终规范。
- `published`：已通过产品与技术审核。
- `deprecated`：当前范围内仍需暂时保留，但已提供替代路径。

## 3. 替换脚手架

占位页通常只有：

```mdx
<DocScaffold route="/docs/chat/..." context="SDKs · WASM · v4" sourceTitle="..." />
```

正式写作时删除该组件，改为普通 Markdown/MDX。不要把真实正文写入 `src/components/mdx/scaffolds.tsx`，否则所有同类占位页都会显示相同内容。

## 4. MDX 模板

新增或替换页面时优先从 `docs/templates` 复制模板：

| 页面类型                    | 模板                                       |
| --------------------------- | ------------------------------------------ |
| SDK 平台入口                | `docs/templates/sdk-overview.mdx`          |
| SDK 功能指南                | `docs/templates/sdk-guide.mdx`             |
| Platform API 入口或资源概览 | `docs/templates/platform-api-overview.mdx` |
| Platform API 单接口页面     | `docs/templates/platform-api-endpoint.mdx` |

使用方式：

1. 复制对应模板内容到目标 `content/docs/**/*.mdx`。
2. 替换 frontmatter 中的 `title`、`description`、`context`、`sourcePath`、`version` 和 `platform`。
3. 删除原来的 `<OverviewScaffold />`、`<DocScaffold />` 或 `<ApiScaffold />`。
4. 用真实 OpenIM SDK 或 Server API 内容替换所有占位符。
5. 初稿使用 `status: 'draft'`；完成技术和产品审核后再改为 `published`。

页面正文必须从 `##` 开始，不写 `#`。页面标题由 frontmatter 渲染。

## 5. SDK 页面结构

SDK 页面分两类：

- `template: 'overview'`：平台入口页，说明安装、初始化、兼容性和核心工作流。
- `template: 'guide'`：任务型页面，说明一个功能如何接入、处理错误并验证结果。

SDK guide 固定章节：

- `## Overview`
- `## How this maps to OpenIM`
- `## Prerequisites`
- `## Install and configure`
- `## Initialize the SDK`
- `## Implement the task`
- `## Verify the result`
- `## Troubleshooting`
- `## Next steps`

要求：

- 必须填写 `version` 和 `platform`。
- 示例使用对应平台真实语言，例如 JavaScript 用 `ts`，iOS 用 `swift`，Android 用 `kotlin`。
- 代码示例给出必要 import、初始化状态、异步错误处理和资源清理。
- 不要手写大量 SDK Reference 页面；方法签名可在指南中引用，后续由源码或类型定义生成 Reference。

## 6. Guides 页面结构

Guides 是独立入口，不混入 SDKs 或 Platform API 的生成路由。目录结构在 `src/components/docs/guides-page.tsx` 中维护，正文来自 OpenIM 官方文档仓库的 `docs/guides`：

```bash
pnpm guides:sync
```

该命令会把当前 Guides 目录中引用的官方 Markdown 同步到 `src/generated/guides-content.json`。页面仍使用本项目的两栏文档布局、左侧侧栏和右侧目录；每个侧栏条目都是本项目内的独立页面，官方原文只作为来源链接保留。

要求：

- 新增 Guides 条目时，先在 `src/components/docs/guides-page.tsx` 增加目录项和官方 `legacy(locale, '/guides/...')` 路径。
- 执行 `pnpm guides:sync` 生成本地正文。
- 不要在页面请求时动态抓取官方站点。
- 官方 Markdown 中的相对 Guides 链接应优先解析到本项目内的 `/docs/guides/...` 页面。

## 7. Platform API 页面结构

Platform API 页面分两类：

- `template: 'overview'`：API 区域入口，说明鉴权、请求约定、响应格式和错误处理。
- `template: 'api'`：单接口页面，说明请求、响应、错误、幂等性和示例。

当前 Platform API 保持 Sendbird Platform API v3 的目录组织、侧栏层级和页面风格；正文中的接口签名、请求参数、响应字段和使用细节来自 OpenIM 官方文档仓库的 `docs/restapi`：

```bash
pnpm platform-api:sync
```

该命令会抓取 Sendbird 风格的 Platform API v3 路由清单，再拉取 OpenIM 官方 REST API 与 webhook Markdown，重建 `content/docs/chat/platform-api/v3`、`src/generated/routes.json`、`src/generated/navigation.json`、`src/generated/search-index.json` 和 `data/structure/chat-pages.json`。手工修改批量导入页面前，先确认这些修改是否应该回写到导入脚本或官方源。

API endpoint 固定章节：

- `## Overview`
- `## Endpoint`
- `## Authentication`
- `## Request`
- `## Response`
- `## Errors`
- `## Idempotency and side effects`
- `## Permissions and limits`
- `## Verify`
- `## Related pages`

要求：

- 必须填写 `version`，不填写 `platform`。
- 请求方法、路径、参数、响应字段和错误码必须以 OpenIM 当前真实接口定义为准。
- 没有 path/query/body 参数时写 `Not applicable.`，不要删除章节。
- 说明接口是否幂等、是否会触发 Webhook 或 SDK 事件。
- 不要仅根据 Sendbird 风格栏目名推断请求方法或字段；请求方法、路径、参数和响应必须以 OpenIM 官方源为准。
- OpenIM REST API 使用 `operationID` 追踪请求，默认认证使用 `token` header；不要写成 `Authorization: Bearer`。
- 标准响应包含 `errCode`、`errMsg`、`errDlt`，成功时 `errCode` 为 `0`。
- 当前官方文档说明所有 array 请求参数最大长度为 `1000`。

## 8. SDK Reference

当前项目没有预建 SDK Reference MDX 页面。Reference 应由源码、类型定义或代码注释生成；手写指南通过稳定链接引用生成内容。

生成器接入前，可以在指南中直接给出关键签名和最小示例，但不要另建大量空 Reference 页面。

## 9. 标题与目录

页面标题来自 frontmatter，正文从 `##` 开始。右侧目录自动读取二级及更深标题：

```md
## Authentication

### Create a token

### Refresh a token
```

避免同一页面出现重复标题文本。

## 10. 内部链接

内部链接使用绝对文档路径：

```md
[初始化 SDK](/docs/chat/sdk/v4/wasm/getting-started/send-first-message)
```

不要链接 `.mdx` 文件路径。

## 10. 图片与下载资源

建议目录：

```text
public/images/docs/<product>/<platform>/<topic>.webp
public/downloads/<filename>
```

MDX 中使用站点绝对路径：

```mdx
![OpenIM conversation lifecycle](/images/docs/sdk/javascript/conversation-lifecycle.webp)
```

要求：

- 文件名使用小写 kebab-case。
- 截图不包含真实用户隐私、密钥和内部域名。
- 流程图保留可维护源文件，并输出 SVG/WebP。
- 所有图片提供准确替代文本。
- 不直接提交未压缩的大尺寸 PNG。

## 11. 代码块

使用语言标识启用 Shiki 高亮：

````md
```ts
const config = {
  /* ... */
};
```
````

示例应：

- 使用真实包名与方法名。
- 给出必要 import。
- 不包含可用密钥。
- 明确客户端和服务端边界。
- 对异步错误、清理和重连给出最低限度处理。

## 12. 编辑后的命令

开发模式会自动同步：

```bash
pnpm dev
```

提交前：

```bash
pnpm content:status
pnpm check
pnpm build
```

查看未迁移页面：

```bash
pnpm content:status -- --status scaffold --limit 50
```

## 13. 内容验收清单

- 标题、描述和术语使用 OpenIM 真实命名。
- 代码已在声明的 SDK/Server 版本上验证。
- 页面状态已从 `scaffold` 或 `draft` 更新为 `published`。
- 版本、平台和前置条件明确。
- 所有内部链接可访问。
- 图片无敏感信息并有 alt。
- API 参数、响应和错误来自真实实现或规范。
- 不支持的页面已删除或合并，而不是填入虚构内容。
- `pnpm check` 与 `pnpm build` 均通过。
