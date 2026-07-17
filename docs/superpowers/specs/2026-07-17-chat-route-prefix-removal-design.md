# Chat 文档公开路由去前缀设计

## 目标

移除全部 OpenIM Chat 文档公开地址中的 `/docs/chat` 前缀。SDK 使用 `/sdk/...`，Platform API 使用 `/platform-api/...`；中文地址分别使用 `/zh/sdk/...` 和 `/zh/platform-api/...`。

旧 `/docs/chat/**` 地址不增加兼容重定向，应直接返回 404。现有 WASM 页面合并关系可以继续在新 `/sdk/**` 地址空间内使用永久重定向，但其源和目标均不得保留旧前缀。

## 内容与结构

- `content/docs/chat/**` 和 `content/zh/docs/chat/**` 继续作为物理内容目录，不因公开 URL 调整而搬迁文件。
- 路由清单中的 `path`、`sourcePath`、`relativePath`，导航中的公开路径，以及 MDX frontmatter 的 `sourcePath` 统一迁移。
- 正文只对内部链接目标执行固定 URL 迁移，不修改说明文字、示例逻辑或 API 内容。
- WASM 审核记录、API/事件所有权、领域覆盖、侧边栏和历史页面合并映射同步迁移，以新路径继续保持逐页追溯关系。
- Sendbird、GitHub 和现有 OpenIM 文档的外部证据 URL 保持原样。

## 渲染

- 新增 `/sdk/[[...slug]]` 与 `/platform-api/[[...slug]]` 页面入口，以及相应中文入口。
- 渲染器分别接收公开路由路径和物理 MDX slug，避免旧 `/docs/chat/**` 动态路由复用新页面。
- 中文内容加载根据路由记录的 `contentFile` 定位物理文件，不再假设公开 URL 与 `content/zh` 目录一致。

## 验证

- 自动测试检查路由、结构、导航和重定向清单不存在旧公开前缀。
- 运行 `pnpm check` 与 `pnpm build`。
- 生产预览验证新英文、中文 SDK 与 Platform API 地址返回 200，旧地址返回无跳转的 404。
