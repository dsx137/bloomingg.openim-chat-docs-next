# 当前结构报告

- 页面总数：**1,735**
- 导航上下文：**9**
- 内容范围：**current-only**
- 生成时间：`2026-07-09T10:13:39.121Z`

## 当前保留范围

- Chat 文档入口。
- SDK v4 的当前指南页：iOS、Android、Flutter、uni-app、WASM、Electron、小程序、React Native。
- Platform API v3 的当前指南与接口页。
- 不包含 UIKit、SDK v3、旧兼容路由或手写 SDK Reference 占位页。

SDK Reference 应从代码注释或类型定义自动生成；Platform API 后续也可从 OpenAPI 规范生成，而不是预建无内容的参考页。

## 按产品分支

| 分支 | 页面数 | 占比 |
| --- | ---: | ---: |
| `chat` | 1 | 0.1% |
| `platform-api` | 109 | 6.3% |
| `sdk` | 1,625 | 93.7% |

## 按页面模板

| 模板 | 页面数 | 占比 |
| --- | ---: | ---: |
| `api` | 98 | 5.6% |
| `guide` | 1,554 | 89.6% |
| `landing` | 1 | 0.1% |
| `overview` | 82 | 4.7% |

## 导航上下文

| 上下文键 | 显示名称 | 页面数 |
| --- | --- | ---: |
| `chat/platform-api/v3` | Platform API | 109 |
| `chat/sdk/v4/ios` | SDKs · iOS · v4 | 232 |
| `chat/sdk/v4/android` | SDKs · Android · v4 | 232 |
| `chat/sdk/v4/flutter` | SDKs · Flutter · v4 | 232 |
| `chat/sdk/v4/uniapp` | SDKs · uni-app · v4 | 232 |
| `chat/sdk/v4/wasm` | SDKs · WASM · v4 | 232 |
| `chat/sdk/v4/electron` | SDKs · Electron · v4 | 232 |
| `chat/sdk/v4/miniprogram` | SDKs · Mini Program · v4 | 1 |
| `chat/sdk/v4/react-native` | SDKs · React Native · v4 | 232 |

## 说明

- 本报告由 `pnpm structure:report` 同时写入 Markdown 与 JSON。
- 页面正文迁移进度使用 `pnpm content:status` 查看。
- `data/structure/scope.json` 是结构范围约束；`pnpm content:check` 会阻止 UIKit、历史版本或 Reference 占位页重新混入当前结构。
