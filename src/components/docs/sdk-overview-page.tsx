import Link from 'next/link';
import { Breadcrumbs } from '@/src/components/docs/breadcrumbs';
import { ChevronRightIcon } from '@/src/components/ui/icons';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';
import type { BreadcrumbItem, RouteRecord } from '@/src/types/docs';

type OverviewCard = {
  description: string;
  href: string;
  title: string;
  visual: 'migration' | 'unread' | 'receipt' | 'message' | 'events' | 'history';
};

type FeatureCard = {
  description: string;
  href: string;
  title: string;
};

type ResourceLink = {
  description: string;
  href: string;
  title: string;
};

const copy = {
  en: {
    eyebrow: 'Version 4',
    intro:
      'OpenIM Chat for WASM brings users, conversations, groups, messages, calling signals, realtime events, and local storage to browser applications. Start with the runtime setup, then connect each capability to your application state through the SDK APIs and events.',
    mostPopular: 'Most popular',
    recommended: 'Recommended features',
    resources: 'Resources',
    popular: [
      {
        title: 'Manage conversations',
        description: 'Configure conversation state, drafts, unread counts, hiding, and deletion.',
        href: '/sdk/wasm/conversation/overview-conversation',
        visual: 'migration',
      },
      {
        title: 'Unread message count',
        description: 'Keep conversation lists and app badges in sync with unread counts.',
        href: '/sdk/wasm/conversation/managing-conversations/manage-read-status',
        visual: 'unread',
      },
      {
        title: 'Read receipts',
        description: 'Show who has read group messages and update receipt state from SDK events.',
        href: '/sdk/wasm/message/managing-read-status/manage-group-message-read-receipts',
        visual: 'receipt',
      },
      {
        title: 'Send a message',
        description: 'Create text, file, and custom messages, then send them to users or groups.',
        href: '/sdk/wasm/message/sending-messages/send-a-message',
        visual: 'message',
      },
      {
        title: 'Receive messages',
        description: 'Subscribe to message events and merge new messages into your UI state.',
        href: '/sdk/wasm/message/receiving-messages/receive-messages',
        visual: 'events',
      },
      {
        title: 'Message history',
        description: 'Page through local and synced history with stable message cursors.',
        href: '/sdk/wasm/message/retrieving-messages/retrieve-message-list',
        visual: 'history',
      },
    ],
    features: [
      {
        title: 'Authentication',
        description: 'Sign in with backend-issued tokens and handle connection lifecycle events.',
        href: '/sdk/wasm/getting-started/authenticate-and-manage-session',
      },
      {
        title: 'Calling',
        description: 'Coordinate call invitations, room credentials, custom signals, and events.',
        href: '/sdk/wasm/calling/overview-calling',
      },
      {
        title: 'Events',
        description: 'Register connection and domain events through the shared SDK instance.',
        href: '/sdk/wasm/events/overview-events',
      },
    ],
    links: [
      {
        title: 'Send your first message',
        description: 'Install, initialize, sign in, choose a target, and send a message.',
        href: '/sdk/wasm/getting-started/send-first-message',
      },
      {
        title: 'Environment setup',
        description: 'Place WASM assets correctly for browser, SSR, and Electron runtimes.',
        href: '/sdk/wasm/getting-started/environment-specific-implementation',
      },
      {
        title: 'Logging and diagnostics',
        description: 'Capture errCode, errMsg, and operationID for client and server diagnostics.',
        href: '/sdk/wasm/logger',
      },
    ],
  },
  zh: {
    eyebrow: 'Version 4',
    intro:
      'OpenIM WASM SDK 为浏览器应用提供用户、会话、群组、消息、通话信令、实时事件和本地存储能力。先完成运行环境与登录配置，再通过 SDK API 和事件把各项能力接入应用状态。',
    mostPopular: '热门主题',
    recommended: '推荐功能',
    resources: '资源',
    popular: [
      {
        title: '管理会话',
        description: '设置会话状态、草稿、未读数、隐藏和删除等客户端会话能力。',
        href: '/sdk/wasm/conversation/overview-conversation',
        visual: 'migration',
      },
      {
        title: '未读消息数',
        description: '读取会话未读数，并同步聊天列表、角标和全局未读状态。',
        href: '/sdk/wasm/conversation/managing-conversations/manage-read-status',
        visual: 'unread',
      },
      {
        title: '已读回执',
        description: '查询群消息已读成员，并通过回执事件更新消息气泡状态。',
        href: '/sdk/wasm/message/managing-read-status/manage-group-message-read-receipts',
        visual: 'receipt',
      },
      {
        title: '发送消息',
        description: '创建文本、文件或自定义消息，并发送给单聊用户或群组。',
        href: '/sdk/wasm/message/sending-messages/send-a-message',
        visual: 'message',
      },
      {
        title: '接收消息',
        description: '订阅新消息事件，把增量消息稳定合并到应用状态。',
        href: '/sdk/wasm/message/receiving-messages/receive-messages',
        visual: 'events',
      },
      {
        title: '历史消息',
        description: '使用会话 ID 和消息游标读取本地及同步后的历史消息。',
        href: '/sdk/wasm/message/retrieving-messages/retrieve-message-list',
        visual: 'history',
      },
    ],
    features: [
      {
        title: '用户认证',
        description: '使用后端签发的 token 登录，并处理连接、过期和被踢下线事件。',
        href: '/sdk/wasm/getting-started/authenticate-and-manage-session',
      },
      {
        title: '音视频通话',
        description: '处理通话邀请、房间凭据、自定义信令和通话事件。',
        href: '/sdk/wasm/calling/overview-calling',
      },
      {
        title: '事件',
        description: '在同一个 SDK 实例上注册连接事件和各领域增量事件。',
        href: '/sdk/wasm/events/overview-events',
      },
    ],
    links: [
      {
        title: '发送第一条消息',
        description: '完成安装、初始化、登录、选择目标并发送消息。',
        href: '/sdk/wasm/getting-started/send-first-message',
      },
      {
        title: '运行环境配置',
        description: '在浏览器、SSR 和 Electron 中正确放置 WASM 资源。',
        href: '/sdk/wasm/getting-started/environment-specific-implementation',
      },
      {
        title: '日志与诊断',
        description: '记录 errCode、errMsg 和 operationID，串联客户端与服务端诊断。',
        href: '/sdk/wasm/logger',
      },
    ],
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    features: FeatureCard[];
    intro: string;
    links: ResourceLink[];
    mostPopular: string;
    popular: OverviewCard[];
    recommended: string;
    resources: string;
  }
>;

export function SdkOverviewPage({
  breadcrumbs,
  locale = 'en',
  route,
  showVersion,
}: {
  breadcrumbs: BreadcrumbItem[];
  locale?: Locale;
  route: RouteRecord;
  showVersion: boolean;
}) {
  const text = copy[locale];

  return (
    <div className="sdk-overview-page">
      <header className="sdk-overview-header">
        {showVersion ? <span className="sdk-overview-version">{text.eyebrow}</span> : null}
        <Breadcrumbs items={breadcrumbs} />
        <h1>{route.title}</h1>
        <p>{text.intro}</p>
      </header>

      <section className="sdk-overview-section" aria-labelledby="sdk-overview-popular">
        <h2 id="sdk-overview-popular">{text.mostPopular}</h2>
        <div className="sdk-overview-popular-grid">
          {text.popular.map((item) => (
            <PopularCard item={item} key={item.href} locale={locale} />
          ))}
        </div>
      </section>

      <section className="sdk-overview-section" aria-labelledby="sdk-overview-recommended">
        <h2 id="sdk-overview-recommended">{text.recommended}</h2>
        <div className="sdk-overview-feature-grid">
          {text.features.map((item) => (
            <FeatureCardView item={item} key={item.href} locale={locale} />
          ))}
        </div>
      </section>

      <section className="sdk-overview-section" aria-labelledby="sdk-overview-resources">
        <h2 id="sdk-overview-resources">{text.resources}</h2>
        <div className="sdk-overview-resource-list">
          {text.links.map((item) => (
            <ResourceLinkView item={item} key={item.href} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PopularCard({ item, locale }: { item: OverviewCard; locale: Locale }) {
  return (
    <Link className="sdk-overview-popular-card" href={toLocalizedPath(item.href, locale)}>
      <span className="sdk-overview-card-visual" data-visual={item.visual} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <strong>{item.title}</strong>
      <span>{item.description}</span>
    </Link>
  );
}

function FeatureCardView({ item, locale }: { item: FeatureCard; locale: Locale }) {
  return (
    <Link className="sdk-overview-feature-card" href={toLocalizedPath(item.href, locale)}>
      <strong>{item.title}</strong>
      <span>{item.description}</span>
    </Link>
  );
}

function ResourceLinkView({ item, locale }: { item: ResourceLink; locale: Locale }) {
  return (
    <Link className="sdk-overview-resource-link" href={toLocalizedPath(item.href, locale)}>
      <span>
        <strong>{item.title}</strong>
        <small>{item.description}</small>
      </span>
      <ChevronRightIcon />
    </Link>
  );
}
