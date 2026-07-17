# WASM Conversation 与 Group 信息架构实施计划

1. 为新页面树、API 覆盖矩阵、旧路由迁移和 unsupported 删除建立失败测试。
2. 新增 Conversation/Group 结构数据与 API 覆盖清单，更新路由、导航和中文标题。
3. 将现有 14 个 Channel 人工页拆分、合并为 20 个 Conversation/Group 人工页，补齐设置会话、草稿、已读状态、成员管理等缺失能力。
4. 将旧有效页面改为 `merge` 并配置永久重定向，将不存在能力页面改为 `remove` 并删除内容文件。
5. 更新逐页审核记录、OpenIM 固定来源、方法和事件，英文保持 `deferred`。
6. 同步搜索和中文打包派生文件，验证旧路径不再进入导航、搜索和 Sitemap。
7. 运行单元测试、`pnpm content:sync`、`pnpm check`、`pnpm build` 和本地浏览器冒烟。
