# Structure data

- `scope.json`：当前内容范围约束。默认只允许当前 SDK v4 指南和 Server API v3。
- `docsets.json`：手写的文档集来源绑定。每个 `key` 对应一套可追踪的文档上下文，绑定上游仓库、包名、当前源码 ref，以及用于发现最新 tag 的正则。
- `chat-pages.json`：已按当前范围裁剪的结构快照，用于追溯和批量重建。
- `report.json`：由 `npm run structure:report` 生成的结构统计。

运行时读取 `src/generated/routes.json` 与 `src/generated/navigation.json`。结构调整后应运行：

```bash
npm run content:sync
npm run structure:report
npm run content:check
```

上游自动更新提案依赖 `docsets.json` 中的这些字段：

- `key`：本地文档上下文，例如 `chat/sdk/v4/wasm`；本地目录按 `content/docs/${key}` 推导。
- `repoUrl`：上游 GitHub 仓库。
- `packageName`：可选，SDK 包名。
- `sourceRef`：当前文档对应的已同步 tag 或 commit；workflow 会在 PR 中把它更新到本次目标。若为 `null`，首次 diff 会把最新目标 ref 相对空 baseline 的全部内容作为初始导入。若它是 semver tag，版本号直接从 tag 推导，不再单独存 `semver`。
- `targetTagPattern`：用于匹配和解析上游正式发布 tags 的正则，应按每个上游仓库的实际 release tag 格式配置。正则必须提供 `major`、`minor`、`patch` 命名捕获组；脚本会用这些 groups 排序选择最新 tag。可选的 `build` 和 `revision` groups 用于支持 `patch.n`、`hotfix.n`、`x.y.z.n` 或 `+hotfix.n.m` 这类额外版本段排序。

GitHub Actions 每周或手动检查上游 docsets，并由 Pi 生成文档更新。随后 workflow 同步 `sourceRef` 并运行完整检查，全部通过才创建 PR；已有 `docsets-sync/` PR 时跳过。手动运行支持指定 docset 和 dry run。
