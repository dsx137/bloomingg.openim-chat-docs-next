# Structure data

- `scope.json`：当前内容范围约束。默认只允许当前 SDK v4 指南和 Server API v3。
- `chat-pages.json`：已按当前范围裁剪的结构快照，用于追溯和批量重建。
- `report.json`：由 `npm run structure:report` 生成的结构统计。

运行时读取 `src/generated/routes.json` 与 `src/generated/navigation.json`。结构调整后应运行：

```bash
npm run content:sync
npm run structure:report
npm run content:check
```
