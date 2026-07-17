import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeIcon, LayoutIcon, ServerIcon } from '@/src/components/ui/icons';
import rawNavigation from '@/src/generated/navigation.json';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import { shouldShowVersion, uniqueVersions } from '@/src/lib/version-visibility';
import type { NavigationData, NavContext } from '@/src/types/docs';

const navigation = rawNavigation as NavigationData;
const contexts = [...navigation.contexts].sort((a, b) => b.rootPath.length - a.rootPath.length);

interface ScaffoldProps {
  route: string;
  context: string;
  sourceTitle: string;
  locale?: Locale;
}

export function DocScaffold({ locale = 'en', ...props }: ScaffoldProps) {
  return (
    <ScaffoldFrame
      {...props}
      icon="guide"
      label={locale === 'zh' ? '指南页面' : 'Guide page'}
      locale={locale}
    >
      <section id="overview">
        <h2>{locale === 'zh' ? '概览' : 'Overview'}</h2>
        <p>
          {locale === 'zh'
            ? '在这里补充该页面对应的 OpenIM 概念、流程、前置条件和预期结果。'
            : 'Replace this section with the OpenIM concept, workflow, prerequisites, and expected outcome for this route.'}
        </p>
      </section>
      <section id="implementation">
        <h2>{locale === 'zh' ? '实现' : 'Implementation'}</h2>
        <p>
          {locale === 'zh'
            ? '在这里添加可用于生产的 OpenIM 示例、请求或 SDK 片段、边界情况和平台说明。'
            : 'Add production-ready OpenIM examples, request or SDK snippets, edge cases, and platform-specific notes here.'}
        </p>
        <CodePlaceholder />
      </section>
      <section id="next-steps">
        <h2>{locale === 'zh' ? '下一步' : 'Next steps'}</h2>
        <p>
          {locale === 'zh'
            ? '最终内容补齐后，将此页面连接到相关概念和任务型文档。'
            : 'Connect this page to related concepts and task-oriented documentation after the final copy is added.'}
        </p>
      </section>
    </ScaffoldFrame>
  );
}

export function OverviewScaffold({ locale = 'en', ...props }: ScaffoldProps) {
  return (
    <ScaffoldFrame
      {...props}
      icon="layout"
      label={locale === 'zh' ? '章节概览' : 'Section overview'}
      locale={locale}
    >
      <section id="what-you-can-build">
        <h2>{locale === 'zh' ? '可以构建什么' : 'What you can build'}</h2>
        <div className="scaffold-feature-grid">
          <Feature
            title={locale === 'zh' ? '核心能力' : 'Core capability'}
            text={
              locale === 'zh'
                ? '描述该章节代表的主要 OpenIM 能力。'
                : 'Describe the primary OpenIM capability represented by this section.'
            }
          />
          <Feature
            title={locale === 'zh' ? '集成路径' : 'Integration path'}
            text={
              locale === 'zh'
                ? '连接推荐的快速开始和生产集成流程。'
                : 'Link to the preferred quickstart and production integration sequence.'
            }
          />
          <Feature
            title={locale === 'zh' ? '运营模型' : 'Operational model'}
            text={
              locale === 'zh'
                ? '说明权限、数据流、生命周期和部署约束。'
                : 'Explain permissions, data flow, lifecycle, and deployment constraints.'
            }
          />
        </div>
      </section>
      <section id="recommended-path">
        <h2>{locale === 'zh' ? '推荐路径' : 'Recommended path'}</h2>
        <ol>
          <li>
            {locale === 'zh'
              ? '用 OpenIM 术语和架构替换此概览。'
              : 'Replace this overview with OpenIM terminology and architecture.'}
          </li>
          <li>
            {locale === 'zh'
              ? '链接读者应该先完成的第一个任务。'
              : 'Link the first task readers should complete.'}
          </li>
          <li>
            {locale === 'zh'
              ? '添加相关 API 参考和排障指南。'
              : 'Add related API references and troubleshooting guidance.'}
          </li>
        </ol>
      </section>
    </ScaffoldFrame>
  );
}

export function ApiScaffold({ locale = 'en', ...props }: ScaffoldProps) {
  return (
    <ScaffoldFrame
      {...props}
      icon="server"
      label={locale === 'zh' ? '服务端 API 端点' : 'Server API endpoint'}
      locale={locale}
    >
      <div className="endpoint-placeholder">
        <span className="method-badge">POST</span>
        <code>/v3/replace-with-openim-endpoint</code>
      </div>
      <section id="request">
        <h2>{locale === 'zh' ? '请求' : 'Request'}</h2>
        <p>
          {locale === 'zh'
            ? '替换端点、认证要求、路径参数、查询参数和请求体。'
            : 'Replace the endpoint, authentication requirements, path parameters, query parameters, and request body.'}
        </p>
        <div className="parameter-table" role="table" aria-label="Placeholder request parameters">
          <div role="row">
            <strong role="columnheader">{locale === 'zh' ? '名称' : 'Name'}</strong>
            <strong role="columnheader">{locale === 'zh' ? '类型' : 'Type'}</strong>
            <strong role="columnheader">{locale === 'zh' ? '描述' : 'Description'}</strong>
          </div>
          <div role="row">
            <code role="cell">example</code>
            <span role="cell">string</span>
            <span role="cell">
              {locale === 'zh'
                ? '替换为 OpenIM 请求字段。'
                : 'Replace with the OpenIM request field.'}
            </span>
          </div>
        </div>
      </section>
      <section id="response">
        <h2>{locale === 'zh' ? '响应' : 'Response'}</h2>
        <CodePlaceholder language="json" />
      </section>
      <section id="errors">
        <h2>{locale === 'zh' ? '错误' : 'Errors'}</h2>
        <p>
          {locale === 'zh'
            ? '记录端点特定的错误码、重试行为、速率限制和幂等性。'
            : 'Document endpoint-specific error codes, retry behavior, rate limits, and idempotency.'}
        </p>
      </section>
    </ScaffoldFrame>
  );
}

function ScaffoldFrame({
  route,
  context,
  sourceTitle,
  icon,
  label,
  locale = 'en',
  children,
}: ScaffoldProps & {
  icon: 'guide' | 'layout' | 'server' | 'code';
  label: string;
  locale?: Locale;
  children: ReactNode;
}) {
  const Icon = icon === 'layout' ? LayoutIcon : icon === 'server' ? ServerIcon : CodeIcon;
  const versionDisplay = getVersionDisplay(route);
  const displayContext =
    versionDisplay.version && !versionDisplay.showVersion
      ? stripContextVersion(context, versionDisplay.version)
      : context;
  const displayRoute =
    versionDisplay.version && !versionDisplay.showVersion
      ? stripRouteVersion(route, versionDisplay.version)
      : route;

  return (
    <div className="content-scaffold">
      <div className="scaffold-notice">
        <span className="scaffold-notice-icon">
          <Icon />
        </span>
        <div>
          <span>
            {label} · {displayContext}
          </span>
          <strong>
            {locale === 'zh'
              ? `“${sourceTitle}” 的内容位置已准备好`
              : `Content slot ready for “${sourceTitle}”`}
          </strong>
          <p>
            {locale === 'zh'
              ? '路由、导航位置、元数据、搜索记录、反馈区域以及上一篇/下一篇链接已经接好。'
              : 'The route, navigation placement, metadata, search record, feedback area, and previous/next links are already wired.'}
          </p>
        </div>
      </div>
      {children}
      <aside className="authoring-handoff">
        <strong>{locale === 'zh' ? '内容交接' : 'Authoring handoff'}</strong>
        <code>{displayRoute}</code>
        <Link href={toLocalizedPath('/', locale)}>
          {locale === 'zh' ? '查看文档入口' : 'Review the documentation entry point'}
        </Link>
      </aside>
    </div>
  );
}

function getVersionDisplay(route: string): { showVersion: boolean; version?: string | null } {
  const context = getContextForRoute(route);
  if (!context) return { showVersion: true };

  const versions = uniqueVersions(
    navigation.contexts
      .filter(
        (item) =>
          item.product === context.product &&
          (context.platform ? item.platform === context.platform : !item.platform),
      )
      .map((item) => item.version),
  );

  return {
    showVersion: shouldShowVersion(context.version, versions),
    version: context.version,
  };
}

function getContextForRoute(route: string): NavContext | undefined {
  return contexts.find(
    (context) => route === context.rootPath || route.startsWith(`${context.rootPath}/`),
  );
}

function stripContextVersion(context: string, version: string): string {
  return context.replace(new RegExp(`\\s*·\\s*${escapeRegExp(version)}\\b`, 'i'), '');
}

function stripRouteVersion(route: string, version: string): string {
  return route.replace(new RegExp(`/${escapeRegExp(version)}(?=/|$)`, 'i'), '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function CodePlaceholder({ language = 'ts' }: { language?: string }) {
  return (
    <pre className="code-placeholder" data-language={language}>
      <code>{`// Replace with an OpenIM example\nconst result = await openim.example();`}</code>
    </pre>
  );
}
