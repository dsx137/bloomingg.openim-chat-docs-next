import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routes = JSON.parse(await readFile(resolve(root, 'src/generated/routes.json'), 'utf8'));
const navigation = JSON.parse(
  await readFile(resolve(root, 'src/generated/navigation.json'), 'utf8'),
);
const scope = JSON.parse(await readFile(resolve(root, 'data/structure/scope.json'), 'utf8'));
const byProduct = Object.fromEntries(
  [...groupCount(routes, (route) => route.product).entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  ),
);
const byTemplate = Object.fromEntries(
  [...groupCount(routes, (route) => route.template).entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  ),
);
const contexts = navigation.contexts.map((context) => ({
  key: context.key,
  title: context.title,
  pageCount: context.pageCount,
}));
const report = {
  generatedAt: new Date().toISOString(),
  scope: scope.mode,
  pageCount: routes.length,
  contextCount: contexts.length,
  byProduct,
  byTemplate,
  contexts,
};

await Promise.all([
  writeFile(resolve(root, 'data/structure/report.json'), `${JSON.stringify(report, null, 2)}\n`),
  writeFile(resolve(root, 'docs/STRUCTURE_REPORT.md'), renderMarkdown(report)),
]);
console.log(JSON.stringify(report, null, 2));

function groupCount(items, key) {
  const result = new Map();
  for (const item of items) result.set(key(item), (result.get(key(item)) ?? 0) + 1);
  return result;
}

function percentage(value, total) {
  return total === 0 ? '0.0%' : `${((value / total) * 100).toFixed(1)}%`;
}

function renderMarkdown(value) {
  const productRows = Object.entries(value.byProduct)
    .map(
      ([key, count]) =>
        `| \`${key}\` | ${count.toLocaleString()} | ${percentage(count, value.pageCount)} |`,
    )
    .join('\n');
  const templateRows = Object.entries(value.byTemplate)
    .map(
      ([key, count]) =>
        `| \`${key}\` | ${count.toLocaleString()} | ${percentage(count, value.pageCount)} |`,
    )
    .join('\n');
  const contextRows = value.contexts
    .map(
      (context) =>
        `| \`${context.key}\` | ${context.title} | ${context.pageCount.toLocaleString()} |`,
    )
    .join('\n');

  return `# 当前结构报告

- 页面总数：**${value.pageCount.toLocaleString()}**
- 导航上下文：**${value.contextCount.toLocaleString()}**
- 内容范围：**${value.scope}**
- 生成时间：\`${value.generatedAt}\`

## 当前保留范围

- Chat 文档入口。
- SDK v4 的当前指南页：iOS、Android、Flutter、uni-app、WASM、Electron、小程序、React Native。
- Platform API v3 的当前指南与接口页。
- 不包含 UIKit、SDK v3、旧兼容路由或手写 SDK Reference 占位页。

SDK Reference 应从代码注释或类型定义自动生成；Platform API 后续也可从 OpenAPI 规范生成，而不是预建无内容的参考页。

## 按产品分支

| 分支 | 页面数 | 占比 |
| --- | ---: | ---: |
${productRows}

## 按页面模板

| 模板 | 页面数 | 占比 |
| --- | ---: | ---: |
${templateRows}

## 导航上下文

| 上下文键 | 显示名称 | 页面数 |
| --- | --- | ---: |
${contextRows}

## 说明

- 本报告由 \`pnpm structure:report\` 同时写入 Markdown 与 JSON。
- 页面正文迁移进度使用 \`pnpm content:status\` 查看。
- \`data/structure/scope.json\` 是结构范围约束；\`pnpm content:check\` 会阻止 UIKit、历史版本或 Reference 占位页重新混入当前结构。
`;
}
