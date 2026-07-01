import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment, type ReactNode } from 'react';
import { ArticleHeader } from '@/src/components/docs/article-header';
import type { ContextOption } from '@/src/components/docs/context-picker';
import { DocsShell } from '@/src/components/docs/docs-shell';
import { ChevronRightIcon, ExternalLinkIcon } from '@/src/components/ui/icons';
import guidesContentData from '@/src/generated/guides-content.json';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import type { BreadcrumbItem, NavContext, NavNode, RouteRecord, TocItem } from '@/src/types/docs';

type GuideItem = {
  title: string;
  description: string;
  href: string;
  badge: string;
};

type GuideGroup = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: GuideItem[];
};

type GuidesCopy = {
  groups: GuideGroup[];
  heroDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  referenceLabel: string;
  referenceTitle: string;
  referenceDescription: string;
  sectionTitle: string;
  sectionDescription: string;
  openLabel: string;
};

type GuideSelection =
  | { kind: 'overview' }
  | { kind: 'group'; group: GuideGroup }
  | { kind: 'item'; group: GuideGroup; item: GuideItem };

type GuideContentRecord = {
  body: string;
  excerpt: string;
  headings: TocItem[];
  sourcePath: string;
  sourceUrl: string;
  title: string;
};

const guidesContent = guidesContentData as {
  records: Record<string, GuideContentRecord>;
};

const legacyBase = {
  en: 'https://docs.openim.io',
  zh: 'https://docs.openim.io/zh-Hans',
} satisfies Record<Locale, string>;

function legacy(locale: Locale, path: string) {
  return `${legacyBase[locale]}${path}`;
}

function guidesCopy(locale: Locale): GuidesCopy {
  if (locale === 'zh') {
    return {
      groups: [
        {
          id: 'quick-start',
          eyebrow: 'Quick Start',
          title: '快速开始',
          description: '建立产品模型、核心概念、开源能力和版本选择的基础认知。',
          items: [
            {
              title: 'OpenIMSDK 简介',
              description: '了解 OpenIMSDK 的定位、生态组件、私有化部署和典型使用场景。',
              href: legacy(locale, '/guides/introduction/product'),
              badge: 'Intro',
            },
            {
              title: '概念解释',
              description: '梳理普通用户、APP 管理员、通知号、群组等核心模型。',
              href: legacy(locale, '/guides/introduction/termDefinition'),
              badge: 'Concept',
            },
            {
              title: '开源功能明细',
              description: '确认开源版包含的组件、消息能力、服务端开放能力和容量边界。',
              href: legacy(locale, '/guides/introduction/features'),
              badge: 'Feature',
            },
            {
              title: '版本说明',
              description: '生产环境使用稳定 tag，明确 Server、ChatServer 和 SDK 版本来源。',
              href: legacy(locale, '/guides/introduction/version'),
              badge: 'Version',
            },
          ],
        },
        {
          id: 'quick-deployment',
          eyebrow: 'Deployment',
          title: '快速部署',
          description: '从环境要求到生产验证的部署路径，覆盖单机、内网、集群和运维检查。',
          items: [
            {
              title: '平台及组件',
              description: '确认服务器、操作系统和 MongoDB、Redis、Kafka、Etcd、MinIO 等依赖。',
              href: legacy(locale, '/guides/gettingStarted/env-comp'),
              badge: 'Env',
            },
            {
              title: 'Docker 部署',
              description: '使用 openim-docker 快速拉起 OpenIMServer、ChatServer 和依赖组件。',
              href: legacy(locale, '/guides/gettingStarted/dockerCompose'),
              badge: 'Docker',
            },
            {
              title: '源码部署',
              description: '面向生产单机部署，按稳定 tag 编译并启动 OpenIMServer 与 ChatServer。',
              href: legacy(locale, '/guides/gettingStarted/imSourceCodeDeployment'),
              badge: 'Source',
            },
            {
              title: '内网部署',
              description: '在联网构建机导出部署包，再复制到内网目标机运行。',
              href: legacy(locale, '/guides/gettingStarted/internalDeployment'),
              badge: 'Offline',
            },
            {
              title: '集群部署',
              description: '在多节点和 Nginx 反向代理场景中部署 OpenIMServer。',
              href: legacy(locale, '/guides/gettingStarted/cluster'),
              badge: 'Cluster',
            },
            {
              title: '端口开放',
              description: '配置防火墙、服务端口以及 SDK 访问地址。',
              href: legacy(locale, '/guides/gettingStarted/ports'),
              badge: 'Ports',
            },
            {
              title: '域名配置',
              description: '通过域名、证书和 Nginx 将 API 与 WebSocket 统一到生产入口。',
              href: legacy(locale, '/guides/gettingStarted/nginxDomainConfig'),
              badge: 'Domain',
            },
            {
              title: '生产环境',
              description: '理解外部组件和服务故障的影响、恢复顺序与恢复后验证。',
              href: legacy(locale, '/guides/gettingStarted/production'),
              badge: 'Prod',
            },
            {
              title: '快速验证',
              description: '验证 API、WebSocket、管理后台和基础消息链路是否可用。',
              href: legacy(locale, '/guides/gettingStarted/quickTestServer'),
              badge: 'Verify',
            },
            {
              title: '常见问题',
              description: '排查部署过程中的健康检查、配置和容器冲突问题。',
              href: legacy(locale, '/guides/gettingStarted/faq'),
              badge: 'FAQ',
            },
            {
              title: '运维系统',
              description: '启用 Prometheus、Alertmanager、Grafana 和 node-exporter。',
              href: legacy(locale, '/guides/gettingStarted/admin'),
              badge: 'Ops',
            },
          ],
        },
        {
          id: 'solutions',
          eyebrow: 'Solutions',
          title: '解决方案',
          description: '面向业务系统接入、二次开发、迁移、推送和对象存储等实施主题。',
          items: [
            {
              title: '二次开发',
              description: '基于 OpenIMServer 的 API、RPC、Storage 层扩展新业务能力。',
              href: legacy(locale, '/guides/solution/developNewFeatures'),
              badge: 'Dev',
            },
            {
              title: 'GoLand 调试',
              description: '在源码部署场景下对 openim-api 等服务进行单步调试。',
              href: legacy(locale, '/guides/solution/howToDebug'),
              badge: 'Debug',
            },
            {
              title: '业务系统集成',
              description: '将账号体系、业务后端和 OpenIM 的 API / Webhook 串起来。',
              href: legacy(locale, '/guides/solution/integrate'),
              badge: 'Integrate',
            },
            {
              title: '云服务迁移',
              description: '评估从现有云 IM 或自研系统迁移到 OpenIM 的接入路径。',
              href: legacy(locale, '/guides/solution/migrate'),
              badge: 'Migrate',
            },
            {
              title: '离线推送接入',
              description: '对接移动端离线推送链路，补齐消息通知体验。',
              href: legacy(locale, '/guides/solution/offlinePush'),
              badge: 'Push',
            },
            {
              title: 'S3 存储配置',
              description: '接入 MinIO、OSS、COS、Kodo 或 AWS S3 保存文件与媒体资源。',
              href: legacy(locale, '/guides/solution/s3'),
              badge: 'S3',
            },
            {
              title: 'S3 存储迁移',
              description: '在对象存储切换时规划配置、数据迁移和访问验证。',
              href: legacy(locale, '/guides/solution/s3convert'),
              badge: 'Storage',
            },
            {
              title: 'OpenClaw 接入',
              description: '通过 OpenClaw Gateway 接入 OpenIMServer 并验证第一条消息。',
              href: legacy(locale, '/guides/solution/openclaw'),
              badge: 'OpenClaw',
            },
          ],
        },
        {
          id: 'reliability',
          eyebrow: 'Reliability',
          title: '消息可靠性测试',
          description: '用于上线前容量评估、消息链路可靠性验证和压测工具配置。',
          items: [
            {
              title: '压力及可靠性测试报告',
              description: '使用测试程序模拟大量用户在线与消息收发，评估容量与链路稳定性。',
              href: legacy(locale, '/guides/benchmark/benchmark_test'),
              badge: 'Report',
            },
            {
              title: '压测程序使用说明',
              description: '了解压测程序的运行方式、参数和验证方法。',
              href: legacy(locale, '/guides/benchmark/benchmark_guide'),
              badge: 'Tooling',
            },
          ],
        },
      ],
      heroDescription:
        '汇总产品概念、部署路径、业务集成、存储和可靠性测试等指南，帮助团队按实施阶段查阅 OpenIM 文档。',
      heroEyebrow: '指南',
      heroTitle: 'OpenIM Guides',
      referenceLabel: '指南目录',
      referenceTitle: '按实施阶段查阅',
      referenceDescription:
        '从产品概念与能力边界开始，再进入部署、业务集成、存储配置和可靠性验证。',
      sectionTitle: '指南目录',
      sectionDescription:
        '按实施阶段组织常用 OpenIM 指南。每篇文档保留官方来源链接，便于核对原始说明。',
      openLabel: '官方来源',
    };
  }

  return {
    groups: [
      {
        id: 'quick-start',
        eyebrow: 'Quick Start',
        title: 'Quick Start',
        description:
          'Build the baseline context for the product model, concepts, open source scope, and release strategy.',
        items: [
          {
            title: 'Introduction to OpenIMSDK',
            description: 'Product positioning, ecosystem components, self-hosting, and use cases.',
            href: legacy(locale, '/guides/introduction/product'),
            badge: 'Intro',
          },
          {
            title: 'Concepts & Terminology',
            description: 'Core user, administrator, notification account, and group concepts.',
            href: legacy(locale, '/guides/introduction/termDefinition'),
            badge: 'Concept',
          },
          {
            title: 'Open Source Feature Details',
            description:
              'Included components, messaging features, server APIs, and capacity notes.',
            href: legacy(locale, '/guides/introduction/features'),
            badge: 'Feature',
          },
          {
            title: 'Version Notes',
            description: 'How to choose stable tags for Server, ChatServer, and client SDKs.',
            href: legacy(locale, '/guides/introduction/version'),
            badge: 'Version',
          },
        ],
      },
      {
        id: 'quick-deployment',
        eyebrow: 'Deployment',
        title: 'Quick Deployment',
        description:
          'Deployment paths from requirements to production validation, including single-node, air-gapped, and cluster setups.',
        items: [
          {
            title: 'Platform & Components',
            description: 'Review server, operating system, and dependency requirements.',
            href: legacy(locale, '/guides/gettingStarted/env-comp'),
            badge: 'Env',
          },
          {
            title: 'Docker Deployment',
            description: 'Start OpenIMServer, ChatServer, and dependencies with openim-docker.',
            href: legacy(locale, '/guides/gettingStarted/dockerCompose'),
            badge: 'Docker',
          },
          {
            title: 'Source Code Deployment',
            description: 'Build and run OpenIMServer and ChatServer from stable release tags.',
            href: legacy(locale, '/guides/gettingStarted/imSourceCodeDeployment'),
            badge: 'Source',
          },
          {
            title: 'Air-Gapped Deployment',
            description: 'Export deployment artifacts on an online builder and run them offline.',
            href: legacy(locale, '/guides/gettingStarted/internalDeployment'),
            badge: 'Offline',
          },
          {
            title: 'Cluster Deployment',
            description: 'Deploy OpenIMServer across multiple nodes behind Nginx.',
            href: legacy(locale, '/guides/gettingStarted/cluster'),
            badge: 'Cluster',
          },
          {
            title: 'Ports',
            description: 'Configure firewall rules, exposed ports, and SDK access addresses.',
            href: legacy(locale, '/guides/gettingStarted/ports'),
            badge: 'Ports',
          },
          {
            title: 'Domain Configuration',
            description: 'Route API and WebSocket traffic through production domains and TLS.',
            href: legacy(locale, '/guides/gettingStarted/nginxDomainConfig'),
            badge: 'Domain',
          },
          {
            title: 'Production',
            description: 'Understand runtime failures, recovery order, and post-recovery checks.',
            href: legacy(locale, '/guides/gettingStarted/production'),
            badge: 'Prod',
          },
          {
            title: 'Quick Verification',
            description: 'Verify APIs, WebSocket, admin console, and basic message delivery.',
            href: legacy(locale, '/guides/gettingStarted/quickTestServer'),
            badge: 'Verify',
          },
          {
            title: 'FAQ',
            description:
              'Troubleshoot health checks, configuration changes, and container conflicts.',
            href: legacy(locale, '/guides/gettingStarted/faq'),
            badge: 'FAQ',
          },
          {
            title: 'Operations System',
            description: 'Enable Prometheus, Alertmanager, Grafana, and node-exporter.',
            href: legacy(locale, '/guides/gettingStarted/admin'),
            badge: 'Ops',
          },
        ],
      },
      {
        id: 'solutions',
        eyebrow: 'Solutions',
        title: 'Solutions',
        description:
          'Implementation topics for business integration, extension work, migration, push, and object storage.',
        items: [
          {
            title: 'Extension Development',
            description: 'Extend OpenIMServer through API, RPC, and storage layers.',
            href: legacy(locale, '/guides/solution/developNewFeatures'),
            badge: 'Dev',
          },
          {
            title: 'Debug with GoLand',
            description: 'Debug openim-api and related services in a source deployment.',
            href: legacy(locale, '/guides/solution/howToDebug'),
            badge: 'Debug',
          },
          {
            title: 'Business System Integration',
            description: 'Connect account systems, backend services, APIs, and webhooks.',
            href: legacy(locale, '/guides/solution/integrate'),
            badge: 'Integrate',
          },
          {
            title: 'Cloud Service Migration',
            description: 'Plan migration from existing cloud IM or self-built messaging systems.',
            href: legacy(locale, '/guides/solution/migrate'),
            badge: 'Migrate',
          },
          {
            title: 'Offline Push',
            description: 'Connect mobile offline push for a complete notification experience.',
            href: legacy(locale, '/guides/solution/offlinePush'),
            badge: 'Push',
          },
          {
            title: 'S3 Storage',
            description: 'Connect MinIO, OSS, COS, Kodo, or AWS S3 for file and media storage.',
            href: legacy(locale, '/guides/solution/s3'),
            badge: 'S3',
          },
          {
            title: 'S3 Migration',
            description:
              'Plan configuration, data migration, and access checks when changing storage.',
            href: legacy(locale, '/guides/solution/s3convert'),
            badge: 'Storage',
          },
          {
            title: 'OpenClaw Integration',
            description:
              'Connect OpenIMServer through OpenClaw Gateway and verify the first message.',
            href: legacy(locale, '/guides/solution/openclaw'),
            badge: 'OpenClaw',
          },
        ],
      },
      {
        id: 'reliability',
        eyebrow: 'Reliability',
        title: 'Message Reliability Testing',
        description:
          'Capacity, latency, reliability, and pressure-test tooling material for pre-production validation.',
        items: [
          {
            title: 'Stress and Reliability Report',
            description:
              'Simulate many online users and message flows to evaluate system capacity.',
            href: legacy(locale, '/guides/benchmark/benchmark_test'),
            badge: 'Report',
          },
          {
            title: 'Test Program Usage',
            description:
              'Understand how to run the test tools, tune parameters, and verify results.',
            href: legacy(locale, '/guides/benchmark/benchmark_guide'),
            badge: 'Tooling',
          },
        ],
      },
    ],
    heroDescription:
      'Guides for product concepts, deployment paths, integration, storage, and reliability testing, organized by implementation stage.',
    heroEyebrow: 'GUIDES',
    heroTitle: 'OpenIM Guides',
    referenceLabel: 'Guide directory',
    referenceTitle: 'Browse by implementation stage',
    referenceDescription:
      'Start with product scope and core concepts, then move into deployment, integration, storage, and reliability validation.',
    sectionTitle: 'Guide directory',
    sectionDescription:
      'Guides are organized by implementation stage. Each imported article keeps its official source link for verification.',
    openLabel: 'Official source',
  };
}

export function GuidesPage({ locale = 'en' }: { locale?: Locale }) {
  const text = guidesCopy(locale);
  const currentPath = '/docs/guides';
  return <GuidesPageContent currentPath={currentPath} locale={locale} text={text} />;
}

export function GuidesSubPage({ locale = 'en', slug = [] }: { locale?: Locale; slug?: string[] }) {
  const text = guidesCopy(locale);
  const currentPath = guidePath(...slug);
  return <GuidesPageContent currentPath={currentPath} locale={locale} slug={slug} text={text} />;
}

export function getGuidePagePaths(locale: Locale = 'en') {
  const text = guidesCopy(locale);
  return [
    guidePath(),
    ...text.groups.flatMap((group) => [
      guidePath(group.id),
      ...group.items.map((item) => guidePath(group.id, guideItemSlug(item))),
    ]),
  ];
}

function GuidesPageContent({
  currentPath,
  locale,
  slug = [],
  text,
}: {
  currentPath: string;
  locale: Locale;
  slug?: string[];
  text: GuidesCopy;
}) {
  const context = createGuidesContext(text);
  const selection = getGuideSelection(text, slug);
  if (!selection) notFound();

  const content = selection.kind === 'item' ? getGuideContent(selection.item) : undefined;
  const route = createGuidesRoute(text, currentPath, selection, content);
  const breadcrumbs: BreadcrumbItem[] = [
    { title: locale === 'zh' ? '首页' : 'Home', href: toLocalizedPath('/docs/chat', locale) },
    selection.kind === 'overview'
      ? { title: text.heroTitle }
      : { title: text.heroTitle, href: toLocalizedPath('/docs/guides', locale) },
    ...(selection.kind === 'group'
      ? [{ title: selection.group.title }]
      : selection.kind === 'item'
        ? [
            {
              title: selection.group.title,
              href: toLocalizedPath(guidePath(selection.group.id), locale),
            },
            { title: selection.item.title },
          ]
        : []),
  ];
  const contextOptions: ContextOption[] = [
    {
      key: context.key,
      product: context.product,
      href: toLocalizedPath(currentPath, locale),
      pageCount: context.pageCount,
    },
  ];

  return (
    <DocsShell
      context={context}
      contextOptions={contextOptions}
      currentPath={currentPath}
      locale={locale}
      sidebarIntro={
        <div className="sidebar-intro-card">
          <span>{text.heroEyebrow}</span>
          <strong>{text.heroTitle}</strong>
          <p>{text.heroDescription}</p>
        </div>
      }
      showVersion={false}
      toc={content?.headings ?? []}
    >
      <ArticleHeader breadcrumbs={breadcrumbs} locale={locale} route={route} showVersion={false} />

      <GuidesBody content={content} locale={locale} selection={selection} text={text} />
    </DocsShell>
  );
}

function GuidesBody({
  content,
  locale,
  selection,
  text,
}: {
  content?: GuideContentRecord;
  locale: Locale;
  selection: GuideSelection;
  text: GuidesCopy;
}) {
  if (selection.kind === 'item') {
    const sourceMap = createGuideSourceMap(text);

    return (
      <div className="guides-docs-content">
        <GuideSourceStrip content={content} item={selection.item} text={text} />
        {content ? (
          <GuideMarkdown
            body={content.body}
            locale={locale}
            sourceMap={sourceMap}
            sourcePath={content.sourcePath}
          />
        ) : (
          <section className="guides-intro-panel">
            <h2>{selection.item.title}</h2>
            <p>{selection.item.description}</p>
          </section>
        )}
        <GuideGroupCard group={selection.group} locale={locale} />
      </div>
    );
  }

  const groups = selection.kind === 'group' ? [selection.group] : text.groups;

  return (
    <div className="guides-docs-content">
      {selection.kind === 'overview' ? (
        <section className="guides-intro-panel" aria-labelledby="guides-start">
          <h2 id="guides-start">{text.sectionTitle}</h2>
          <p>{text.sectionDescription}</p>
        </section>
      ) : null}

      <section className="guides-directory-section" aria-label={text.sectionTitle}>
        {groups.map((group) => (
          <GuideGroupCard group={group} key={group.id} locale={locale} />
        ))}
      </section>
    </div>
  );
}

function GuideSourceStrip({
  content,
  item,
  text,
}: {
  content?: GuideContentRecord;
  item: GuideItem;
  text: GuidesCopy;
}) {
  return (
    <a
      className="guide-source-strip"
      href={content?.sourceUrl ?? item.href}
      rel="noreferrer"
      target="_blank"
    >
      <span>{item.badge}</span>
      <strong>{text.openLabel}</strong>
      <p>{content?.sourceUrl ?? item.href}</p>
      <ExternalLinkIcon />
    </a>
  );
}

function GuideMarkdown({
  body,
  locale,
  sourceMap,
  sourcePath,
}: {
  body: string;
  locale: Locale;
  sourceMap: Map<string, string>;
  sourcePath: string;
}) {
  return (
    <div className="guide-markdown">
      {parseGuideMarkdown(body).map((block, index) => (
        <GuideMarkdownBlock
          block={block}
          index={index}
          key={`${block.type}-${index}`}
          locale={locale}
          sourceMap={sourceMap}
          sourcePath={sourcePath}
        />
      ))}
    </div>
  );
}

type GuideMarkdownBlock =
  | { type: 'blockquote'; lines: string[] }
  | { type: 'code'; code: string; language: string }
  | { type: 'heading'; depth: number; title: string }
  | { type: 'hr' }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] };

function GuideMarkdownBlock({
  block,
  index,
  locale,
  sourceMap,
  sourcePath,
}: {
  block: GuideMarkdownBlock;
  index: number;
  locale: Locale;
  sourceMap: Map<string, string>;
  sourcePath: string;
}) {
  if (block.type === 'heading') {
    const id = guideHeadingId(block.title);
    const level = Math.min(Math.max(block.depth, 2), 4);
    if (level === 2) {
      return <h2 id={id}>{renderInlineMarkdown(block.title, sourcePath, sourceMap, locale)}</h2>;
    }
    if (level === 3) {
      return <h3 id={id}>{renderInlineMarkdown(block.title, sourcePath, sourceMap, locale)}</h3>;
    }
    return <h4 id={id}>{renderInlineMarkdown(block.title, sourcePath, sourceMap, locale)}</h4>;
  }

  if (block.type === 'paragraph') {
    return <p>{renderInlineMarkdown(block.text, sourcePath, sourceMap, locale)}</p>;
  }

  if (block.type === 'blockquote') {
    return (
      <blockquote>
        {block.lines.map((line, lineIndex) => (
          <Fragment key={`${index}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInlineMarkdown(line, sourcePath, sourceMap, locale)}
          </Fragment>
        ))}
      </blockquote>
    );
  }

  if (block.type === 'code') {
    return (
      <pre>
        <code data-language={block.language}>{block.code}</code>
      </pre>
    );
  }

  if (block.type === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul';
    return (
      <Tag>
        {block.items.map((item, itemIndex) => (
          <li key={`${index}-${itemIndex}`}>
            {renderInlineMarkdown(item, sourcePath, sourceMap, locale)}
          </li>
        ))}
      </Tag>
    );
  }

  if (block.type === 'table') {
    const [headings = [], ...rows] = block.rows;
    return (
      <div className="guide-table-wrap">
        <table>
          {headings.length > 0 ? (
            <thead>
              <tr>
                {headings.map((cell, cellIndex) => (
                  <th key={`${index}-head-${cellIndex}`}>
                    {renderInlineMarkdown(cell, sourcePath, sourceMap, locale)}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${index}-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${rowIndex}-${cellIndex}`}>
                    {renderInlineMarkdown(cell, sourcePath, sourceMap, locale)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <hr />;
}

function parseGuideMarkdown(body: string): GuideMarkdownBlock[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks: GuideMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: 'code', code: code.join('\n'), language: fence[1] ?? 'text' });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(':::')) {
      const callout: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(':::')) {
        if (lines[index].trim()) callout.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ type: 'blockquote', lines: callout });
      index += 1;
      continue;
    }

    if (/^<\/?\w+/.test(trimmed)) {
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        depth: Math.max(heading[1].length, 2),
        title: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const rows: string[][] = [];
      rows.push(parseTableRow(lines[index]));
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    const listMatch = trimmed.match(/^(([-*+])|(\d+[.)]))\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[3]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^(([-*+])|(\d+[.)]))\s+(.+)$/);
        if (!item) break;
        items.push(item[4]);
        index += 1;
      }
      blocks.push({ type: 'list', items, ordered });
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quote.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'blockquote', lines: quote });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && isParagraphLine(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

function isParagraphLine(line: string) {
  const trimmed = line.trim();
  return (
    Boolean(trimmed) &&
    !trimmed.startsWith('```') &&
    !trimmed.startsWith(':::') &&
    !trimmed.startsWith('>') &&
    !trimmed.match(/^#{1,6}\s+/) &&
    !trimmed.match(/^(-{3,}|\*{3,})$/) &&
    !trimmed.match(/^(([-*+])|(\d+[.)]))\s+(.+)$/) &&
    !/^<\/?\w+/.test(trimmed)
  );
}

function isTableStart(lines: string[], index: number) {
  return (
    lines[index]?.includes('|') &&
    Boolean(lines[index + 1]?.match(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/))
  );
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function renderInlineMarkdown(
  value: string,
  sourcePath: string,
  sourceMap: Map<string, string>,
  locale: Locale,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /!\[([^\]]*)]\(([^)]+)\)|\[([^\]]+)]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
    if (match[1] !== undefined) {
      const href = resolveGuideHref(match[2], sourcePath, sourceMap, locale);
      nodes.push(
        <a href={href} key={`${match.index}-image`} rel="noreferrer" target="_blank">
          {match[1] || href}
        </a>,
      );
    } else if (match[3] !== undefined) {
      const href = resolveGuideHref(match[4], sourcePath, sourceMap, locale);
      const external = isExternalHref(href);
      nodes.push(
        <a
          href={href}
          key={`${match.index}-link`}
          rel={external ? 'noreferrer' : undefined}
          target={external ? '_blank' : undefined}
        >
          {renderInlineMarkdown(match[3], sourcePath, sourceMap, locale)}
        </a>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(<code key={`${match.index}-code`}>{match[5]}</code>);
    } else if (match[6] !== undefined) {
      nodes.push(
        <strong key={`${match.index}-strong`}>
          {renderInlineMarkdown(match[6], sourcePath, sourceMap, locale)}
        </strong>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

function resolveGuideHref(
  href: string,
  sourcePath: string,
  sourceMap: Map<string, string>,
  locale: Locale,
) {
  if (href.startsWith('#')) return href;
  if (isExternalHref(href)) return href;

  const base = `https://docs.openim.io/zh-Hans${sourcePath.replace(/\/[^/]+$/, '/')}`;
  const resolved = new URL(href, base).pathname.replace(/^\/zh-Hans/, '').replace(/\.md$/, '');
  const local = sourceMap.get(resolved);
  if (local) return toLocalizedPath(local, locale);
  return `https://docs.openim.io/zh-Hans${resolved}`;
}

function guideHeadingId(value: string) {
  return value
    .replace(/[>#*_`]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function GuideGroupCard({ group, locale }: { group: GuideGroup; locale: Locale }) {
  return (
    <article className="guide-group-card" id={group.id}>
      <header>
        <span>{group.eyebrow}</span>
        <h2>{group.title}</h2>
        <p>{group.description}</p>
      </header>
      <div className="guide-item-grid">
        {group.items.map((item) => (
          <GuideLink
            className="guide-item-link"
            href={guidePath(group.id, guideItemSlug(item))}
            key={item.href}
            locale={locale}
          >
            <span>{item.badge}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <ChevronRightIcon />
          </GuideLink>
        ))}
      </div>
    </article>
  );
}

function GuideLink({
  children,
  className,
  href,
  id,
  locale,
}: {
  children: ReactNode;
  className: string;
  href: string;
  id?: string;
  locale: Locale;
}) {
  if (isExternalHref(href)) {
    return (
      <a className={className} href={href} id={id} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={toLocalizedPath(href, locale)} id={id}>
      {children}
    </Link>
  );
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function createGuidesContext(text: GuidesCopy): NavContext {
  const overviewPath = guidePath();

  return {
    key: 'guides',
    title: text.heroTitle,
    rootPath: overviewPath,
    overviewPath,
    product: 'guides',
    nodes: [
      {
        id: 'guides-overview',
        segment: 'guides',
        title: text.sectionTitle,
        href: overviewPath,
        type: 'page',
        children: [],
        minIndex: 0,
      },
      ...text.groups.map<NavNode>((group, groupIndex) => ({
        id: group.id,
        segment: group.id,
        title: group.title,
        href: guidePath(group.id),
        type: 'folder',
        minIndex: groupIndex + 1,
        children: group.items.map<NavNode>((item, itemIndex) => ({
          id: guideItemNodeId(group, item),
          segment: guideItemSlug(item),
          title: item.title,
          href: guidePath(group.id, guideItemSlug(item)),
          type: 'page',
          children: [],
          minIndex: itemIndex,
        })),
      })),
    ],
    pageCount: countGuidePages(text),
  };
}

function createGuidesRoute(
  text: GuidesCopy,
  currentPath: string,
  selection: GuideSelection,
  content?: GuideContentRecord,
): RouteRecord {
  const title =
    selection.kind === 'item'
      ? selection.item.title
      : selection.kind === 'group'
        ? selection.group.title
        : text.heroTitle;
  const description =
    selection.kind === 'item'
      ? selection.item.description
      : selection.kind === 'group'
        ? selection.group.description
        : text.heroDescription;

  return {
    id: 0,
    path: currentPath,
    relativePath: currentPath.replace(/^\//, ''),
    sourcePath: content?.sourcePath ?? currentPath.replace(/^\//, ''),
    title,
    description,
    product: 'guides',
    contextKey: 'guides',
    contextTitle: text.heroTitle,
    template: 'guide',
    status: 'published',
    sourceIndex: 0,
    contentFile: 'guides',
    navOrder: 0,
  };
}

function getGuideContent(item: GuideItem) {
  return guidesContent.records[sourcePathFromHref(item.href)];
}

function createGuideSourceMap(text: GuidesCopy) {
  const map = new Map<string, string>();
  for (const group of text.groups) {
    for (const item of group.items) {
      map.set(sourcePathFromHref(item.href), guidePath(group.id, guideItemSlug(item)));
    }
  }
  return map;
}

function sourcePathFromHref(href: string) {
  return new URL(href).pathname.replace(/^\/zh-Hans/, '').replace(/\.md$/, '');
}

function countGuidePages(text: GuidesCopy) {
  return text.groups.reduce((sum, group) => sum + group.items.length + 1, 1);
}

function getGuideSelection(text: GuidesCopy, slug: string[]): GuideSelection | undefined {
  if (slug.length === 0) return { kind: 'overview' };
  if (slug.length > 2) return undefined;

  const group = text.groups.find((entry) => entry.id === slug[0]);
  if (!group) return undefined;
  if (slug.length === 1) return { kind: 'group', group };

  const item = group.items.find((entry) => guideItemSlug(entry) === slug[1]);
  if (!item) return undefined;

  return { kind: 'item', group, item };
}

function guidePath(...parts: string[]) {
  return ['/docs/guides', ...parts].join('/');
}

function guideItemNodeId(group: GuideGroup, item: GuideItem) {
  return `${group.id}-${slugify(item.badge || item.title)}`;
}

function guideItemSlug(item: GuideItem) {
  return slugify(item.badge || item.title);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
