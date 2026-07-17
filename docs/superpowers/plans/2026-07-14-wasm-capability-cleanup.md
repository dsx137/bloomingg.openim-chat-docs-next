# WASM 全量能力清理实施计划

1. 为规范一级节、Message 新路径、unsupported 删除、永久重定向和完整 API 覆盖建立失败测试。
2. 新增全域 API/事件覆盖清单：可公开项目分配到唯一主页面，废弃方法以及 `Login`、`UnUsedEvent` 仅做内部排除记录。
3. 重建 WASM 路由与导航，移除 Application、Push notifications、Report、Local caching、Migration guide 和所有 unsupported Message 页面。
4. 将真实的认证、事件和 Message 内容迁入 OpenIM 规范路径，补齐 Calling、Events、Local data 及缺失 API 正文。
5. 更新逐页审核记录：有效历史页 `merge`，虚假能力 `remove`，新活跃页中文 `api-verified`、英文 `deferred`。
6. 删除旧中英文内容文件，更新全部站内链接、入口卡片、重定向配置和旧测试。
7. 同步路由、导航、中文打包和搜索派生文件，确认生成器不会恢复删除页面。
8. 运行 `pnpm check`、`pnpm build`、来源存在性检查、全量 HTTP 重定向/404 检查和 Playwright 冒烟。
