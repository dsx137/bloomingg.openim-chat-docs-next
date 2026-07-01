# OpenIM 品牌替换手册

## 1. 站点名称与外部链接

编辑 `src/config/site.ts`：

- `name`：浏览器标题模板与站点名。
- `productName`：产品导航显示名。
- `description`：站点默认描述。
- `primaryNavigation`：顶部主导航。
- GitHub、编辑链接优先通过环境变量配置。

## 2. Logo、Favicon 与分享图

| 资源               | 文件                         |
| ------------------ | ---------------------------- |
| 顶部 Logo mark     | `public/brand/logo-mark.svg` |
| Favicon            | `public/favicon.svg`         |
| 默认 Open Graph 图 | `public/og/default.svg`      |

可直接替换文件并保留路径，也可修改 `src/components/site/logo.tsx` 与 `app/layout.tsx` 指向新的资源。

不要把商业字体文件打包进仓库；优先使用系统字体、开源 Web 字体服务或团队有明确授权的字体加载方案。

## 3. 图标

通用图标集中在：

```text
src/components/ui/icons.tsx
```

这些图标是本项目自有的轻量 SVG React 组件。替换时保持组件名称和 `currentColor` 机制，可避免修改使用方。

MDX Landing 使用的图标映射位于：

```text
src/components/mdx/landing.tsx
```

## 4. 颜色与视觉 token

`app/globals.css` 顶部定义浅色与暗色 token。优先修改：

- `--accent` / `--accent-strong`
- `--surface` / `--surface-raised`
- `--text` / `--text-muted`
- `--border`
- `--code-bg`
- `--shadow-*`

组件样式使用这些 token，调整后会同步影响导航、按钮、卡片、代码块、侧栏和搜索弹窗。

## 5. 首页文案与视觉

编辑：

```text
content/docs/chat/index.mdx
src/components/mdx/landing.tsx
```

MDX 控制标题、介绍、卡片和链接；React 组件控制布局与右侧抽象聊天视觉。若替换为 OpenIM 产品截图，建议使用 `next/image` 并将图片放到 `public/images/docs/landing/`。

## 6. 产品、平台与版本名称

显示映射位于 `src/config/docs.ts`：

```ts
export const productLabels = {
  /* ... */
};
export const platformLabels = {
  /* ... */
};
```

这里只影响显示名称，不改变 URL 与导航上下文键。更改路由结构需按架构文档执行结构变更流程。

## 7. 页头与产品导航

- 全局页头：`src/components/site/global-header.tsx`
- 产品导航：`src/components/site/product-nav.tsx`
- Logo：`src/components/site/logo.tsx`
- 主题切换：`src/components/site/theme-toggle.tsx`

可在这些组件中接入 OpenIM 官网、控制台、社区、GitHub、语言切换或账号入口。

## 8. SEO 与域名

生产环境设置：

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-docs-domain.example
NEXT_PUBLIC_GITHUB_URL=https://github.com/openimsdk
NEXT_PUBLIC_EDIT_BASE_URL=https://github.com/your-org/your-repo/edit/main
```

上线前检查：

- `app/layout.tsx` 的 metadata 与图标。
- `app/robots.ts` 的抓取策略。
- `app/sitemap.ts` 是否包含应公开页面。
- 默认分享图是否符合 OpenIM 品牌规范。
