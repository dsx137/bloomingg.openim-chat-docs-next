# MDX 文档模板

这些模板用于替换 `content/docs/**/*.mdx` 中的 scaffold 页面。复制对应模板到目标 MDX 文件后，先替换 frontmatter 和占位文本，再删除原来的 `<OverviewScaffold />`、`<DocScaffold />` 或 `<ApiScaffold />`。

## 选择模板

| 页面类型                                       | 使用模板                    |
| ---------------------------------------------- | --------------------------- |
| SDK 平台入口，如 iOS / Android / WASM overview | `sdk-overview.mdx`          |
| SDK 功能指南、接入步骤、最佳实践               | `sdk-guide.mdx`             |
| Platform API 入口、鉴权、约定说明              | `platform-api-overview.mdx` |
| 单个服务端接口页面                             | `platform-api-endpoint.mdx` |

## 通用规则

- frontmatter 的 `title`、`description`、`product`、`context`、`template`、`status` 必填。
- 页面正文从 `##` 开始，不写 `#`，页面标题由 frontmatter 渲染。
- `status` 从 `draft` 开始，技术和产品确认后改为 `published`。
- SDK 页面必须填写 `version` 和 `platform`；Platform API 页面必须填写 `version`。
- 内部链接使用 `/docs/chat/...` 绝对路径，不链接 `.mdx` 文件。
- 不确认的 API 字段、错误码、SDK 方法不要猜；先保留 TODO 或维持 `draft`。
- 示例代码必须能对应当前 OpenIM SDK 或服务端接口，不提交密钥、私有域名或真实用户数据。

## SDK 任务教程结构

以 `send-first-message` 为例，对照 Sendbird 的教程型页面，OpenIM SDK 文档应按“从环境到结果”的顺序写，而不是只列方法名。

| 章节                              | 必须写的内容                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `## Overview`                     | 说明这个教程完成什么、最终会发送哪类消息、适用单聊还是群聊。                                                     |
| `## How this maps to OpenIM`      | 把参考站概念映射到 OpenIM 概念，例如 Sendbird 的 user/channel/message 对应 OpenIM 的 user/conversation/message。 |
| `## Prerequisites`                | Server 地址、用户 ID、token、接收方 ID 或群 ID、SDK 包版本、浏览器/运行时要求。                                  |
| `## API signatures`               | 从当前 SDK 类型定义摘录真实公开方法签名；没有等价 API 的 Sendbird 功能必须写清“不支持/需服务端实现”。            |
| `## Install and load assets`      | 安装包、复制 WASM 静态资源、在应用入口加载 `wasm_exec.js`。                                                      |
| `## Initialize the SDK`           | `getSDK()` 或平台等价初始化；说明 WASM 路径、调试参数和客户端边界。                                              |
| `## Connect a user`               | 注册连接事件，调用 `login`，解释 `platformID`、`apiAddr`、`wsAddr`、token 来源。                                 |
| `## Listen for incoming messages` | 注册消息事件，说明发送成功后本端和对端如何收到消息。                                                             |
| `## Send a text message`          | 创建消息对象，再发送到 `recvID` 或 `groupID`；代码必须完整。                                                     |
| `## Verify the result`            | 如何确认连接成功、消息发送成功、对端收到消息、刷新或重连后仍可见。                                               |
| `## Troubleshooting`              | 常见错误：WASM 资源 404、token 无效、WebSocket 不通、收不到消息、平台 ID 不匹配。                                |
| `## Next steps`                   | 链到认证、频道/会话、收消息、错误码、Platform API 相关页面。                                                     |
