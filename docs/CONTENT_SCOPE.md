# 当前内容范围

## 1. 默认策略

该工程使用 `current-only` 策略：只为当前需要维护的 OpenIM SDK 指南和 Server API 保留页面槽位，不把参考站的全部历史资产原样带入新项目。

范围约束位于：

```text
data/structure/scope.json
```

`npm run content:check` 会验证每条路由是否符合该文件的产品、版本、平台和模板约束。

## 2. 当前保留

| 分支                                | 当前范围                     |
| ----------------------------------- | ---------------------------- |
| `/docs/chat`                        | Chat 文档总入口              |
| `/docs/chat/sdk/v4/ios/**`          | iOS 当前 SDK 指南            |
| `/docs/chat/sdk/v4/android/**`      | Android 当前 SDK 指南        |
| `/docs/chat/sdk/v4/flutter/**`      | Flutter 当前 SDK 指南        |
| `/docs/chat/sdk/v4/uniapp/**`       | uni-app 当前 SDK 指南        |
| `/docs/chat/sdk/v4/wasm/**`         | WASM 当前 SDK 指南           |
| `/docs/chat/sdk/v4/electron/**`     | Electron 当前 SDK 指南       |
| `/docs/chat/sdk/v4/miniprogram/**`  | 小程序当前 SDK 指南          |
| `/docs/chat/sdk/v4/react-native/**` | React Native 当前 SDK 指南   |
| `/docs/chat/sdk/v4/unity/**`        | Unity 当前 SDK 指南          |
| `/docs/chat/platform-api/v3/**`     | 当前 Server API 指南与接口页 |

这里的 `v4` 与 `v3` 是当前结构中的 URL 版本段。正式写文档时，应把页面内的产品版本说明替换为 OpenIM 真实发布版本和兼容范围。

## 3. 当前删除

- 全部 `/docs/chat/uikit/**`。
- 全部 SDK v3 历史页面。
- `/docs/chat/v3/**` Legacy Server API 路由。
- `/docs/chat/v4/**` 历史兼容 Reference 路由。
- 所有 `template: reference` 的手写 SDK Reference 占位页。

这些分支不会出现在侧栏、搜索、Sitemap、迁移统计或构建产物中。

## 4. 为什么不预建 SDK Reference

SDK Reference 的数量通常由类、方法、参数、枚举和平台绑定自动决定。把参考站的 Reference 路由预先复制为 MDX，会产生大量与 OpenIM 代码不一致的空页面，并让后续维护出现双重事实源。

推荐做法：

- JavaScript/TypeScript：从类型声明或 TypeDoc 生成。
- Android：从 Kotlin/Java 注释生成 Dokka/Javadoc。
- iOS：从 Swift/Objective-C 注释生成 DocC/Jazzy。
- Flutter：从 Dart API 注释生成 Dartdoc。
- Web/WASM、Electron、小程序：保持核心 API 兼容，按运行环境补充打包、资源和生命周期差异。
- React Native、uni-app：按对应 SDK 类型、源码注释或示例工程生成。
- Unity：从 C# XML documentation 或专用生成器生成。

生成内容可以部署到独立 `/reference/**` 路由，也可以在构建阶段转换为 Fumadocs 可读取的数据。概念、流程、最佳实践和完整示例仍保留在当前 MDX 指南中。

## 5. Server API 的后续选择

当前保留 Server API 接口页，便于团队逐页替换。OpenIM 的 OpenAPI 规范稳定后，可以进一步改为：

1. MDX 只维护鉴权、概念、工作流和最佳实践。
2. 端点参数、Schema、请求与响应由 OpenAPI 自动生成。
3. 手写 MDX 为重点接口提供补充示例和业务说明。

这一步不是当前项目启动的前置条件。

## 6. 后续增加平台或版本

需要扩展范围时，同时修改：

1. `data/structure/scope.json`。
2. `src/generated/routes.json`。
3. `src/generated/navigation.json`。
4. 对应 `content/docs/**/*.mdx`。
5. `src/components/site/product-nav.tsx` 中的公开入口。

然后执行：

```bash
npm run content:sync
npm run structure:report
npm run check
npm run build
```
