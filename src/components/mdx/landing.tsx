import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeIcon, LayoutIcon, ServerIcon } from '@/src/components/ui/icons';
import type { Locale } from '@/src/lib/i18n';
import { toLocalizedPath } from '@/src/lib/i18n';

type HomeCard = {
  title: string;
  href: string;
  description: string;
  meta?: string;
  related?: {
    href: string;
    title: string;
  }[];
};

type FeatureGroup = {
  title: string;
  description: string;
  links: HomeCard[];
};

const landingCopy = {
  en: {
    apiAction: 'Open API overview',
    apiDescription:
      'Use server-side APIs for application control, user lifecycle, channel administration, message workflows, webhooks, and operations.',
    apiEyebrow: 'SERVER',
    apiHeroCta: 'Start with the API overview',
    apiHeroDescription:
      'The Platform API section organizes operational tasks by resource so backend teams can move from application setup to production automation without switching products.',
    apiHeroKicker: 'REST API v3',
    apiHeroTitle: 'Control the chat system from trusted services.',
    apiTitle: 'Platform API',
    featureDescription:
      'Review the product capabilities OpenIM Chat already documents, then jump to the client or server guide that implements each capability.',
    featureEyebrow: 'CAPABILITIES',
    featureTitle: 'Features',
    featuredDescription:
      'A few high-signal implementation paths for validating the integration surface before you fill out product-specific documentation.',
    featuredEyebrow: 'COMMON PATHS',
    featuredTitle: 'Featured samples',
    heroDescription:
      'Start with the client platform, move into server-side control, or jump straight to sample-driven workflows for messages, channels, users, moderation, and notifications.',
    heroEyebrow: 'OPENIM CHAT',
    heroPrimary: 'Explore SDKs',
    heroSecondary: 'Open Platform API',
    heroTitle: 'Build chat products with SDKs, APIs, and implementation paths in one place.',
    sampleDescription:
      'Open the maintained demo repositories under the openimsdk GitHub organization and compare real app wiring across platforms.',
    sampleEyebrow: 'STARTERS',
    sampleTitle: 'Sample apps',
    sdkAction: 'Browse Web-compatible SDK',
    sdkDescription:
      'Choose the client runtime first. WASM, Electron, and Mini Program share one Web-compatible core API surface, while their platform entries document runtime differences.',
    sdkEyebrow: 'CLIENT',
    sdkTitle: 'SDKs',
  },
  zh: {
    apiAction: '查看 API 概览',
    apiDescription:
      '通过服务端 API 管理应用、用户生命周期、频道管理、消息工作流、Webhook 和运营能力。',
    apiEyebrow: '服务端',
    apiHeroCta: '从 API 概览开始',
    apiHeroDescription:
      'Platform API 按资源组织服务端能力，便于后端团队从应用设置扩展到生产自动化。',
    apiHeroKicker: 'REST API v3',
    apiHeroTitle: '在可信服务中控制聊天系统。',
    apiTitle: 'Platform API',
    featureDescription:
      '按产品能力查看 OpenIM Chat 已覆盖的功能特性，并进入对应 SDK 或 Platform API 文档。',
    featureEyebrow: '功能特性',
    featureTitle: '功能特性',
    featuredDescription: '常用实现路径，用来快速验证集成面并连接到更完整的功能文档。',
    featuredEyebrow: '常用示例',
    featuredTitle: '精选示例',
    heroDescription:
      '从客户端平台开始，进入服务端控制，或直接查看围绕消息、频道、用户、审核和通知的示例路径。',
    heroEyebrow: 'OPENIM CHAT',
    heroPrimary: '查看 SDKs',
    heroSecondary: '查看 Platform API',
    heroTitle: '在一个入口中构建聊天产品、SDK 集成和服务端能力。',
    sampleDescription: '直接打开 openimsdk GitHub 组织下维护的 Demo 仓库，对照真实应用接入方式。',
    sampleEyebrow: '示例应用',
    sampleTitle: '示例应用',
    sdkAction: '查看 Web 兼容 SDK',
    sdkDescription:
      '先选择客户端运行时。WASM、Electron 和小程序共用 Web 兼容核心 API，平台入口只补充运行环境差异。',
    sdkEyebrow: '客户端',
    sdkTitle: 'SDKs',
  },
} satisfies Record<Locale, Record<string, string>>;

const sdkCards: HomeCard[] = [
  {
    title: 'iOS',
    href: '/docs/chat/sdk/v4/ios/overview',
    description:
      'Ship native chat on Apple platforms with channel, message, and notification guides.',
    meta: 'Swift',
  },
  {
    title: 'Android',
    href: '/docs/chat/sdk/v4/android/overview',
    description: 'Integrate Android messaging, authentication, users, groups, and delivery states.',
    meta: 'Kotlin / Java',
  },
  {
    title: 'Flutter',
    href: '/docs/chat/sdk/v4/flutter/overview',
    description: 'Use one integration path for cross-platform mobile and desktop chat experiences.',
    meta: 'Dart',
  },
  {
    title: 'uni-app',
    href: '/docs/chat/sdk/v4/uniapp/overview',
    description: 'Build one OpenIM integration for App, H5, and supported mini-app targets.',
    meta: 'Vue / uni-app',
  },
  {
    title: 'Web-compatible',
    href: '/docs/chat/sdk/v4/wasm/overview',
    description:
      'Maintain one shared API path for WASM, Electron, and Mini Program, then handle runtime setup per platform.',
    meta: 'Shared API',
    related: [
      { title: 'WASM', href: '/docs/chat/sdk/v4/wasm/overview' },
      { title: 'Electron', href: '/docs/chat/sdk/v4/electron/overview' },
      { title: 'Mini Program', href: '/docs/chat/sdk/v4/miniprogram/overview' },
    ],
  },
  {
    title: 'React Native',
    href: '/docs/chat/sdk/v4/react-native/overview',
    description: 'Add OpenIM messaging to React Native apps with native mobile runtime guidance.',
    meta: 'RN',
  },
  {
    title: 'Unity',
    href: '/docs/chat/sdk/v4/unity/overview',
    description:
      'Connect in-game communities with channels, real-time messages, and user profiles.',
    meta: 'C#',
  },
];

const apiTopics: HomeCard[] = [
  {
    title: 'API setup',
    href: '/docs/chat/platform-api/v3/prepare-to-use-api',
    description: 'Prepare base URLs, headers, admin tokens, and request conventions.',
  },
  {
    title: 'Users',
    href: '/docs/chat/platform-api/v3/user/creating-users/create-a-user',
    description: 'Create users, query user records, update profiles, and issue session tokens.',
  },
  {
    title: 'Channels',
    href: '/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel',
    description: 'Create group conversations, update group data, manage members, and invite users.',
  },
  {
    title: 'Messages',
    href: '/docs/chat/platform-api/v3/message/messaging-basics/send-a-message',
    description: 'Send messages from trusted services and migrate historical message data.',
  },
];

const sampleApps: HomeCard[] = [
  {
    title: 'H5 demo',
    href: 'https://github.com/openimsdk/openim-h5-demo',
    description: 'Explore the browser-oriented demo app for OpenIM Chat integration.',
    meta: 'GitHub / H5',
  },
  {
    title: 'Electron demo',
    href: 'https://github.com/openimsdk/openim-electron-demo',
    description: 'Review the desktop demo for Electron packaging and runtime setup.',
    meta: 'GitHub / Electron',
  },
  {
    title: 'Mini Program demo',
    href: 'https://github.com/openimsdk/openim-miniprogram-demo',
    description: 'Use the mini program demo as the starting point for platform-specific setup.',
    meta: 'GitHub / Mini Program',
  },
  {
    title: 'iOS demo',
    href: 'https://github.com/openimsdk/openim-ios-demo',
    description: 'Inspect the native iOS sample app and its OpenIM SDK integration path.',
    meta: 'GitHub / iOS',
  },
  {
    title: 'Android demo',
    href: 'https://github.com/openimsdk/open-im-android-demo',
    description: 'Inspect the native Android demo app for login, conversations, and messages.',
    meta: 'GitHub / Android',
  },
  {
    title: 'Flutter demo',
    href: 'https://github.com/openimsdk/openim-flutter-demo',
    description: 'Start from the Flutter demo when one codebase needs mobile coverage.',
    meta: 'GitHub / Flutter',
  },
  {
    title: 'uni-app demo',
    href: 'https://github.com/openimsdk/open-im-uniapp-demo',
    description: 'Review the uni-app demo for App, H5, and supported mini-app targets.',
    meta: 'GitHub / uni-app',
  },
  {
    title: 'React Native demo',
    href: 'https://github.com/openimsdk/openim-reactnative-demo',
    description: 'Use the React Native demo to validate mobile runtime integration.',
    meta: 'GitHub / RN',
  },
  {
    title: 'Unity demo',
    href: 'https://github.com/openimsdk/open-im-unity-demo',
    description: 'Review the Unity demo for game and interactive app chat scenarios.',
    meta: 'GitHub / Unity',
  },
];

const featuredSamples: HomeCard[] = [
  {
    title: 'Send your first message',
    href: '/docs/chat/sdk/v4/wasm/getting-started/send-first-message',
    description: 'Authenticate, connect, and send a message from a client SDK.',
    meta: 'SDK',
  },
  {
    title: 'Create a group channel',
    href: '/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel',
    description: 'Provision a group channel from the server side and prepare it for members.',
    meta: 'API',
  },
  {
    title: 'Issue a session token',
    href: '/docs/chat/platform-api/v3/user/managing-session-tokens/issue-a-session-token',
    description: 'Generate user login credentials from a trusted backend service.',
    meta: 'Auth',
  },
  {
    title: 'Block a user',
    href: '/docs/chat/platform-api/v3/moderation/blocking-users/block-users',
    description: 'Apply moderation controls from the server side when safety rules require it.',
    meta: 'Moderation',
  },
];

const featureGroups: FeatureGroup[] = [
  {
    title: 'User identity and access',
    description:
      'Provision chat identities, keep profile data current, and control how users enter the chat system.',
    links: [
      {
        title: 'User provisioning',
        href: '/docs/chat/platform-api/v3/user/creating-users/create-a-user',
        description: 'Create chat users from a trusted backend before they sign in.',
        meta: 'Users',
      },
      {
        title: 'User directory',
        href: '/docs/chat/platform-api/v3/user/listing-users/list-users',
        description: 'Query user records and keep business profiles aligned with chat identity.',
        meta: 'Users',
      },
      {
        title: 'User profiles',
        href: '/docs/chat/platform-api/v3/user/managing-users/update-a-user',
        description: 'Update display names, avatars, and profile fields from the backend.',
        meta: 'Profile',
      },
      {
        title: 'Client authentication',
        href: '/docs/chat/sdk/v4/wasm/application/authenticating-a-user/authentication',
        description: 'Initialize the client SDK, log in, and handle token lifecycle events.',
        meta: 'SDK',
      },
    ],
  },
  {
    title: 'Conversations and groups',
    description:
      'Create conversation spaces, maintain group metadata, and manage the member lifecycle.',
    links: [
      {
        title: 'Create group conversations',
        href: '/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel',
        description: 'Create group conversations from the Platform API.',
        meta: 'Groups',
      },
      {
        title: 'Group profile and lifecycle',
        href: '/docs/chat/platform-api/v3/channel/managing-a-channel/update-a-group-channel',
        description: 'Update or delete group conversation records as product state changes.',
        meta: 'Groups',
      },
      {
        title: 'List group members',
        href: '/docs/chat/platform-api/v3/channel/listing-users/list-members-of-a-group-channel',
        description: 'Read group membership from the backend for admin tools and sync jobs.',
        meta: 'Members',
      },
      {
        title: 'Join and leave flows',
        href: '/docs/chat/platform-api/v3/channel/managing-a-channel/join-a-channel',
        description: 'Let users join or leave group conversations from trusted services.',
        meta: 'Members',
      },
    ],
  },
  {
    title: 'Messaging and history',
    description:
      'Send messages, receive realtime updates, read conversation history, and import legacy data.',
    links: [
      {
        title: 'Send messages',
        href: '/docs/chat/platform-api/v3/message/messaging-basics/send-a-message',
        description: 'Send server-side text and custom messages into one-to-one or group sessions.',
        meta: 'Message',
      },
      {
        title: 'Message history',
        href: '/docs/chat/sdk/v4/wasm/message/retrieving-messages/retrieve-a-list-of-messages',
        description: 'Load conversation history and page through older messages from the SDK.',
        meta: 'History',
      },
      {
        title: 'Receive realtime messages',
        href: '/docs/chat/sdk/v4/wasm/message/receiving-messages-through-event-handler/receive-messages-in-a-group-channel',
        description: 'Subscribe to SDK message events and merge updates into the UI.',
        meta: 'Realtime',
      },
      {
        title: 'Search message history',
        href: '/docs/chat/sdk/v4/wasm/message/searching-messages-in-a-group-channel/search-messages-by-a-keyword',
        description: 'Search historical messages by keyword for in-app search and support tools.',
        meta: 'Search',
      },
    ],
  },
  {
    title: 'Message state and UX',
    description:
      'Keep unread badges, read state, typing indicators, and message-level product data in sync.',
    links: [
      {
        title: 'Unread counts',
        href: '/docs/chat/sdk/v4/wasm/message/retrieving-unread-counts-in-a-group-channel/unread-messages',
        description: 'Power conversation badges and global unread summaries.',
        meta: 'Unread',
      },
      {
        title: 'Read receipts',
        href: '/docs/chat/sdk/v4/wasm/message/managing-read-status-in-a-group-channel/get-read-status',
        description: 'Show read state and inspect who has read group messages.',
        meta: 'Read',
      },
      {
        title: 'Typing indicators',
        href: '/docs/chat/sdk/v4/wasm/message/managing-a-message/send-typing-indicators-to-other-members',
        description: 'Display active typing state in the current conversation.',
        meta: 'Typing',
      },
      {
        title: 'Message metadata',
        href: '/docs/chat/sdk/v4/wasm/message/adding-extra-data-to-a-message/add-extra-data-to-a-message',
        description: 'Attach extra data to messages for product-specific rendering.',
        meta: 'Data',
      },
    ],
  },
  {
    title: 'Moderation and governance',
    description:
      'Apply user-level and conversation-level controls when product policy or operations require them.',
    links: [
      {
        title: 'Block users',
        href: '/docs/chat/platform-api/v3/moderation/blocking-users/block-users',
        description: 'Block unwanted users and remove blocks when policy allows.',
        meta: 'Block',
      },
      {
        title: 'Mute group members',
        href: '/docs/chat/platform-api/v3/moderation/muting-a-user/mute-a-member-in-a-group-channel',
        description: 'Mute or unmute members inside a group conversation.',
        meta: 'Mute',
      },
      {
        title: 'List blocked users',
        href: '/docs/chat/platform-api/v3/moderation/listing-blocked-and-blocking-users/list-blocked-and-blocking-users',
        description: 'Review block relationships for support, safety, and admin workflows.',
        meta: 'Audit',
      },
      {
        title: 'Freeze group conversations',
        href: '/docs/chat/sdk/v4/wasm/channel/moderating-a-channel/freeze-and-unfreeze-a-channel',
        description: 'Control whether a group conversation can accept new messages.',
        meta: 'Freeze',
      },
    ],
  },
  {
    title: 'Cross-platform SDKs and operations',
    description:
      'Use the documented cross-platform client runtimes and prepare the server-side API foundation.',
    links: [
      {
        title: 'Web-compatible SDKs',
        href: '/docs/chat/sdk/v4/wasm/overview',
        description: 'Use the shared WASM, Electron, and Mini Program API surface.',
        meta: 'Web',
      },
      {
        title: 'uni-app',
        href: '/docs/chat/sdk/v4/uniapp/overview',
        description: 'Reuse one integration path across App, H5, and supported mini-app targets.',
        meta: 'uni-app',
      },
      {
        title: 'React Native',
        href: '/docs/chat/sdk/v4/react-native/overview',
        description: 'Bring OpenIM messaging into React Native mobile runtime environments.',
        meta: 'RN',
      },
      {
        title: 'API setup',
        href: '/docs/chat/platform-api/v3/prepare-to-use-api',
        description: 'Configure base URLs, headers, admin tokens, and request conventions.',
        meta: 'API',
      },
      {
        title: 'Error codes',
        href: '/docs/chat/platform-api/v3/error-codes',
        description: 'Diagnose REST and SDK responses with consistent error fields.',
        meta: 'Errors',
      },
    ],
  },
];

const zhCardText: Record<string, Pick<HomeCard, 'title' | 'description'> & { meta?: string }> = {
  'Admin messages': {
    title: '管理员消息',
    description: '发送系统消息，用于公告、通知和自动化场景。',
    meta: '系统',
  },
  Announcements: {
    title: '公告',
    description: '广播重要消息，并查看公告触达与互动数据。',
    meta: '广播',
  },
  Android: {
    title: 'Android',
    description: '集成 Android 消息、认证、用户、群组和送达状态。',
    meta: 'Kotlin / Java',
  },
  Applications: {
    title: '应用',
    description: '管理应用设置、令牌、速率限制和 Webhook 投递状态。',
  },
  Bots: {
    title: '机器人',
    description: '创建机器人、加入频道，并发送机器人消息或流式消息。',
    meta: '机器人',
  },
  'Channel membership': {
    title: '频道成员',
    description: '支持邀请、成员、参与者、管理员、加入、离开和隐藏流程。',
    meta: '成员',
  },
  'Channel metadata': {
    title: '频道元数据',
    description: '为频道添加自定义数据和计数器，承载产品状态。',
    meta: '数据',
  },
  Channels: {
    title: '频道',
    description: '创建、列出、邀请、隐藏和审核群组频道或开放频道。',
  },
  'Create a group channel': {
    title: '创建群组频道',
    description: '通过服务端创建群组频道，并为成员加入做好准备。',
    meta: 'API',
  },
  'Data export': {
    title: '数据导出',
    description: '调度并查看消息、频道和用户的数据导出任务。',
    meta: '导出',
  },
  'Delivery receipts': {
    title: '送达回执',
    description: '标记并查看群组频道消息是否已送达。',
    meta: '送达',
  },
  'Error codes': {
    title: '错误码',
    description: '使用结构化错误引用诊断平台响应。',
    meta: '错误',
  },
  'Event handlers': {
    title: '事件处理器',
    description: '响应客户端侧的用户、频道和消息事件。',
    meta: '事件',
  },
  Flutter: {
    title: 'Flutter',
    description: '通过一套集成路径覆盖跨平台移动和桌面聊天体验。',
    meta: 'Dart',
  },
  'File upload progress': {
    title: '文件上传进度',
    description: '跟踪媒体和其他文件消息附件的上传状态。',
    meta: '文件',
  },
  'Game chat starter': {
    title: '游戏聊天示例',
    description: '围绕连接、用户和第一条频道消息构建 Unity 示例。',
    meta: 'Unity',
  },
  'Group channels': {
    title: '群组频道',
    description: '用于一对一或多人聊天的私有成员制会话。',
    meta: '频道',
  },
  iOS: {
    title: 'iOS',
    description: '在 Apple 平台交付原生聊天，覆盖频道、消息和通知指南。',
    meta: 'Swift',
  },
  Invitations: {
    title: '邀请',
    description: '在客户端邀请用户并管理群组频道成员关系。',
    meta: 'SDK',
  },
  'Issue a session token': {
    title: '签发会话 Token',
    description: '从可信后端服务生成用户登录凭证。',
    meta: '认证',
  },
  'Block a user': {
    title: '屏蔽用户',
    description: '当安全策略要求时，从服务端执行管控操作。',
    meta: '管控',
  },
  Electron: {
    title: 'Electron',
    description: '在桌面端渲染进程复用 WASM 兼容 API，并处理 Electron 打包资源路径。',
    meta: 'Desktop',
  },
  Messages: {
    title: '消息',
    description: '发送、列出、更新、搜索、翻译、置顶、定时和导出消息。',
  },
  'Message metadata': {
    title: '消息元数据',
    description: '添加自定义类型和附加数据，支持产品自定义渲染。',
    meta: '数据',
  },
  'Message search': {
    title: '消息搜索',
    description: '按关键词和筛选条件搜索消息归档和会话历史。',
    meta: '搜索',
  },
  'Message threading': {
    title: '消息线程',
    description: '支持在父消息下回复，形成结构化讨论。',
    meta: '线程',
  },
  'Message translation': {
    title: '消息翻译',
    description: '手动翻译消息，或通过配置的翻译引擎自动处理。',
    meta: '翻译',
  },
  'Mobile chat starter': {
    title: '移动端聊天示例',
    description: '当示例需要同时覆盖 iOS 和 Android 时，可从 Flutter 路径开始。',
    meta: 'Flutter',
  },
  Moderation: {
    title: '审核与管控',
    description: '控制封禁、禁言、冻结、运营者和受限行为。',
    meta: '安全',
  },
  'Native Android starter': {
    title: 'Android 原生示例',
    description: '先走通 Android 设置流程，再补充生产级频道能力。',
    meta: 'Android',
  },
  'Open channels': {
    title: '开放频道',
    description: '适合社区、直播活动和广播的大型公开会话空间。',
    meta: '频道',
  },
  'Pinned messages': {
    title: '置顶消息',
    description: '置顶重要消息，帮助成员快速找到关键上下文。',
    meta: '置顶',
  },
  Polls: {
    title: '投票',
    description: '创建投票、选项、投票记录、投票人列表和关闭状态。',
    meta: '投票',
  },
  Privacy: {
    title: '隐私',
    description: '支持隐私相关控制和数据处理要求。',
    meta: '隐私',
  },
  'Push notifications': {
    title: '推送通知',
    description: '通过偏好设置和模板投递消息提醒。',
    meta: '推送',
  },
  'Reactions and emojis': {
    title: '表情回应',
    description: '启用表情目录、消息回应和消息级表达能力。',
    meta: '表情',
  },
  'Read receipts': {
    title: '已读回执',
    description: '展示消息已读人员，并维护已读状态计数。',
    meta: '已读',
  },
  Reports: {
    title: '举报',
    description: '允许用户举报消息、用户或会话以供审核。',
    meta: '举报',
  },
  'Scheduled messages': {
    title: '定时消息',
    description: '创建、更新、取消和立即发送延迟消息。',
    meta: '定时',
  },
  'Search message history': {
    title: '搜索消息历史',
    description: '为支持团队和用户工具添加可搜索的会话归档。',
    meta: '搜索',
  },
  'Send your first message': {
    title: '发送第一条消息',
    description: '使用客户端 SDK 完成认证、连接并发送消息。',
    meta: 'SDK',
  },
  Statistics: {
    title: '统计分析',
    description: '跟踪活跃用户、连接数和高级分析指标。',
    meta: '统计',
  },
  'Subscribe to webhook events': {
    title: '订阅 Webhook 事件',
    description: '使用事件投递同步消息、审核事件和频道变化。',
    meta: 'Webhook',
  },
  'Text and file messages': {
    title: '文本和文件消息',
    description: '在支持的频道类型中发送文本消息和文件消息。',
    meta: '消息',
  },
  'Typing indicators': {
    title: '输入状态',
    description: '在活跃会话中显示实时输入状态。',
    meta: '输入中',
  },
  Unity: {
    title: 'Unity',
    description: '用频道、实时消息和用户资料连接游戏社区。',
    meta: 'C#',
  },
  'Mini Program': {
    title: '小程序',
    description: '在支持的小程序环境中接入 OpenIM，并沿用 WASM 兼容的核心 API 模型。',
    meta: '小程序',
  },
  'React Native': {
    title: 'React Native',
    description: '在 React Native 应用中接入 OpenIM 消息能力，并处理移动端运行时差异。',
    meta: 'RN',
  },
  'Unread counts': {
    title: '未读数',
    description: '驱动角标、收件箱计数和单频道未读摘要。',
    meta: '未读',
  },
  'User metadata': {
    title: '用户元数据',
    description: '随聊天用户存储自定义资料或产品数据。',
    meta: '数据',
  },
  'User profiles': {
    title: '用户资料',
    description: '从后端更新昵称、头像和用户资料字段。',
    meta: '资料',
  },
  Users: {
    title: '用户',
    description: '创建用户、更新资料、管理元数据并配置未读数。',
  },
  'Web chat starter': {
    title: 'Web 聊天示例',
    description: '从 WASM 应用路径开始，登录用户并发送第一条消息。',
    meta: 'WASM',
  },
  'Web-compatible': {
    title: 'Web 兼容 SDK',
    description: 'WASM、Electron 和小程序共用一套 API 文档，再分别处理运行环境配置。',
    meta: '共享 API',
  },
  'Web-compatible SDKs': {
    title: 'Web 兼容 SDK',
    description: 'WASM、Electron 和小程序共用一套核心 API 能力。',
    meta: 'Web',
  },
  WASM: {
    title: 'WASM',
    description: '使用 WebAssembly SDK 在浏览器中接入本地存储、实时事件和 TypeScript API。',
    meta: 'Web',
  },
  'uni-app': {
    title: 'uni-app',
    description: '用一套 OpenIM 集成覆盖 App、H5 和支持的小程序目标。',
    meta: 'Vue / uni-app',
  },
  'Android demo': {
    title: 'Android Demo',
    description: '查看 Android 原生 Demo 中的登录、会话和消息接入方式。',
    meta: 'GitHub / Android',
  },
  'API setup': {
    title: 'API 接入准备',
    description: '配置基础地址、请求头、管理员 token 和请求约定。',
    meta: 'API',
  },
  'Block users': {
    title: '屏蔽用户',
    description: '屏蔽不受欢迎的用户，并在策略允许时解除屏蔽。',
    meta: '屏蔽',
  },
  'Client authentication': {
    title: '客户端认证',
    description: '初始化客户端 SDK、完成登录，并处理 token 生命周期事件。',
    meta: 'SDK',
  },
  'Create group conversations': {
    title: '创建群组会话',
    description: '通过 Platform API 从服务端创建群组会话。',
    meta: '群组',
  },
  'Electron demo': {
    title: 'Electron Demo',
    description: '查看 Electron 桌面端 Demo 的打包和运行环境配置。',
    meta: 'GitHub / Electron',
  },
  'Flutter demo': {
    title: 'Flutter Demo',
    description: '当一套代码需要覆盖移动端时，可以从 Flutter Demo 开始。',
    meta: 'GitHub / Flutter',
  },
  'Freeze group conversations': {
    title: '冻结群组会话',
    description: '控制群组会话是否允许继续发送新消息。',
    meta: '冻结',
  },
  'Group profile and lifecycle': {
    title: '群组资料与生命周期',
    description: '在产品状态变化时更新或删除群组会话记录。',
    meta: '群组',
  },
  'H5 demo': {
    title: 'H5 Demo',
    description: '查看面向浏览器的 OpenIM Chat Demo 应用。',
    meta: 'GitHub / H5',
  },
  'iOS demo': {
    title: 'iOS Demo',
    description: '查看 iOS 原生 Demo 及其 OpenIM SDK 接入路径。',
    meta: 'GitHub / iOS',
  },
  'Join and leave flows': {
    title: '加入与退出流程',
    description: '从可信服务中处理用户加入或退出群组会话。',
    meta: '成员',
  },
  'List blocked users': {
    title: '查询屏蔽关系',
    description: '为客服、安全和后台管理流程查看用户屏蔽关系。',
    meta: '审计',
  },
  'List group members': {
    title: '查询群组成员',
    description: '从后端读取群组成员列表，用于后台管理和数据同步。',
    meta: '成员',
  },
  Logging: {
    title: '日志',
    description: '记录 operationID 和 SDK 日志，用于客户端与服务端联合排查。',
    meta: '日志',
  },
  'Members and invitations': {
    title: '成员与邀请',
    description: '邀请成员，并处理接受或拒绝邀请的流程。',
    meta: '成员',
  },
  'Message history': {
    title: '历史消息',
    description: '通过 SDK 读取会话历史，并按页加载更早消息。',
    meta: '历史',
  },
  'Message migration': {
    title: '消息迁移',
    description: '从其他系统迁移时导入历史消息。',
    meta: '迁移',
  },
  'Mobile SDKs': {
    title: '移动端 SDK',
    description: '通过原生、Flutter、uni-app 或 React Native 路径交付移动端聊天。',
    meta: '移动端',
  },
  'Mini Program demo': {
    title: '小程序 Demo',
    description: '从小程序 Demo 开始处理平台相关的接入配置。',
    meta: 'GitHub / 小程序',
  },
  'Mute group members': {
    title: '禁言群组成员',
    description: '在群组会话中禁言或解除禁言成员。',
    meta: '禁言',
  },
  'Receive realtime messages': {
    title: '接收实时消息',
    description: '订阅 SDK 消息事件，并把增量消息合并到界面状态。',
    meta: '实时',
  },
  'React Native demo': {
    title: 'React Native Demo',
    description: '使用 React Native Demo 验证移动端运行环境接入。',
    meta: 'GitHub / RN',
  },
  'Send messages': {
    title: '发送消息',
    description: '从可信服务端流程发送文本消息和自定义消息。',
    meta: '消息',
  },
  'Session tokens': {
    title: '会话 Token',
    description: '从服务端为用户签发 token，并在需要时注销会话。',
    meta: '认证',
  },
  'Unity demo': {
    title: 'Unity Demo',
    description: '查看 Unity Demo，适用于游戏和互动应用聊天场景。',
    meta: 'GitHub / Unity',
  },
  'uni-app demo': {
    title: 'uni-app Demo',
    description: '查看 uni-app Demo，覆盖 App、H5 和支持的小程序目标。',
    meta: 'GitHub / uni-app',
  },
  'User directory': {
    title: '用户目录',
    description: '查询用户记录，并让业务资料与聊天身份保持一致。',
    meta: '用户',
  },
  'User provisioning': {
    title: '创建用户',
    description: '在用户登录前，由可信后端创建聊天用户。',
    meta: '用户',
  },
  Webhooks: {
    title: 'Webhooks',
    description: '订阅服务端事件，用于同步、审计和工作流自动化。',
    meta: 'Hooks',
  },
};

const zhFeatureGroupText: Record<string, Pick<FeatureGroup, 'title' | 'description'>> = {
  'User identity and access': {
    title: '用户与访问',
    description: '创建聊天身份、维护用户资料，并控制用户进入聊天系统的方式。',
  },
  'Conversations and groups': {
    title: '会话与群组',
    description: '创建会话空间、维护群组资料，并管理成员生命周期。',
  },
  'Messaging and history': {
    title: '消息与历史',
    description: '发送消息、接收实时更新、读取会话历史，并导入旧系统数据。',
  },
  'Message state and UX': {
    title: '消息状态与体验',
    description: '同步未读数、已读回执、输入状态和消息附加数据。',
  },
  'Moderation and governance': {
    title: '安全与管控',
    description: '在产品策略或运营需要时，执行用户级和会话级控制。',
  },
  'Cross-platform SDKs and operations': {
    title: '跨端 SDK 与接入',
    description: '使用已整理的跨端客户端运行时，并准备服务端 API 接入基础。',
  },
};

function localizeCards(cards: HomeCard[], locale: Locale): HomeCard[] {
  if (locale === 'en') return cards;
  return cards.map((card) => ({
    ...card,
    ...(zhCardText[card.title] ?? {}),
    related: card.related?.map((item) => ({
      ...item,
      title: zhCardText[item.title]?.title ?? item.title,
    })),
  }));
}

function localizeFeatureGroups(groups: FeatureGroup[], locale: Locale): FeatureGroup[] {
  if (locale === 'en') return groups;
  return groups.map((group) => ({
    ...group,
    ...(zhFeatureGroupText[group.title] ?? {}),
    links: localizeCards(group.links, locale),
  }));
}

function SectionIntro({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <header className="docs-home-section-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link className="docs-home-section-link" href={actionHref}>
          {actionLabel}
          <b aria-hidden="true">→</b>
        </Link>
      ) : null}
    </header>
  );
}

function CardLink({
  card,
  className,
  cta = 'Open docs',
  locale = 'en',
}: {
  card: HomeCard;
  className: string;
  cta?: string;
  locale?: Locale;
}) {
  const href = toLocalizedPath(card.href, locale);
  const external = isExternalHref(href);

  return (
    <Link
      className={className}
      href={href}
      rel={external ? 'noreferrer' : undefined}
      target={external ? '_blank' : undefined}
    >
      {card.meta ? <span>{card.meta}</span> : null}
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      {card.related ? (
        <div
          className="sdk-card-related"
          aria-label={locale === 'zh' ? '平台入口' : 'Platform entries'}
        >
          {card.related.map((item) => (
            <span key={item.href}>{item.title}</span>
          ))}
        </div>
      ) : null}
      <strong>
        {cta}
        <b aria-hidden="true">→</b>
      </strong>
    </Link>
  );
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href);
}

export function ChatHero({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  locale = 'en',
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  locale?: Locale;
}) {
  const copy = landingCopy[locale];
  const hero =
    locale === 'zh'
      ? {
          eyebrow: copy.heroEyebrow,
          title: copy.heroTitle,
          description: copy.heroDescription,
          primaryLabel: copy.heroPrimary,
          primaryHref,
          secondaryLabel: copy.heroSecondary,
          secondaryHref,
        }
      : { eyebrow, title, description, primaryLabel, primaryHref, secondaryLabel, secondaryHref };

  return (
    <section className="chat-hero">
      <div className="chat-hero-copy">
        <span className="chat-eyebrow">{hero.eyebrow}</span>
        <h1>{hero.title}</h1>
        <p>{hero.description}</p>
        <div className="chat-hero-actions">
          <Link className="button-primary" href={toLocalizedPath(hero.primaryHref, locale)}>
            {hero.primaryLabel}
          </Link>
          <Link className="button-secondary" href={toLocalizedPath(hero.secondaryHref, locale)}>
            {hero.secondaryLabel}
          </Link>
        </div>
      </div>
      <div aria-hidden="true" className="chat-hero-visual">
        <div className="visual-window">
          <div className="visual-window-bar">
            <i />
            <i />
            <i />
          </div>
          <div className="visual-layout">
            <div className="visual-sidebar">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="visual-thread">
              <div className="visual-message is-accent" />
              <div className="visual-message" />
              <div className="visual-message is-short" />
              <div className="visual-composer" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="landing-section">
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="landing-card-grid">{children}</div>
    </section>
  );
}

export function LandingCard({
  title,
  href,
  description,
  icon,
  locale = 'en',
}: {
  title: string;
  href: string;
  description: string;
  icon: 'code' | 'layout' | 'server';
  locale?: Locale;
}) {
  const Icon = icon === 'layout' ? LayoutIcon : icon === 'server' ? ServerIcon : CodeIcon;
  return (
    <Link className="landing-card" href={toLocalizedPath(href, locale)}>
      <span className="landing-card-icon">
        <Icon />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="landing-card-link">
        Explore documentation <b aria-hidden="true">→</b>
      </span>
    </Link>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function SDKsSection({ locale = 'en' }: { locale?: Locale }) {
  const copy = landingCopy[locale];
  const cards = localizeCards(sdkCards, locale);

  return (
    <section className="docs-home-section" id="sdks">
      <SectionIntro
        eyebrow={copy.sdkEyebrow}
        title={copy.sdkTitle}
        description={copy.sdkDescription}
        actionLabel={copy.sdkAction}
        actionHref={toLocalizedPath('/docs/chat/sdk/v4/wasm/overview', locale)}
      />
      <div className="sdk-card-grid">
        {cards.map((card) => (
          <CardLink
            card={card}
            className="sdk-card"
            cta={locale === 'zh' ? '查看 SDK' : 'View SDK'}
            key={card.href}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

export function PlatformApiSection({ locale = 'en' }: { locale?: Locale }) {
  const copy = landingCopy[locale];
  const topics = localizeCards(apiTopics, locale);

  return (
    <section className="docs-home-section" id="platform-api">
      <SectionIntro
        eyebrow={copy.apiEyebrow}
        title={copy.apiTitle}
        description={copy.apiDescription}
        actionLabel={copy.apiAction}
        actionHref={toLocalizedPath('/docs/chat/platform-api/v3/overview', locale)}
      />
      <div className="platform-api-panel">
        <Link
          className="platform-api-hero-card"
          href={toLocalizedPath('/docs/chat/platform-api/v3/overview', locale)}
        >
          <span>{copy.apiHeroKicker}</span>
          <h3>{copy.apiHeroTitle}</h3>
          <p>{copy.apiHeroDescription}</p>
          <strong>
            {copy.apiHeroCta}
            <b aria-hidden="true">→</b>
          </strong>
        </Link>
        <div className="api-topic-list">
          {topics.map((topic) => (
            <CardLink
              card={topic}
              className="api-topic-card"
              cta={locale === 'zh' ? '打开文档' : 'Open docs'}
              key={topic.href}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SampleAppsSection({ locale = 'en' }: { locale?: Locale }) {
  const copy = landingCopy[locale];
  const cards = localizeCards(sampleApps, locale);

  return (
    <section className="docs-home-section" id="sample-apps">
      <SectionIntro
        eyebrow={copy.sampleEyebrow}
        title={copy.sampleTitle}
        description={copy.sampleDescription}
      />
      <div className="sample-app-grid">
        {cards.map((card) => (
          <CardLink
            card={card}
            className="sample-app-card"
            cta={locale === 'zh' ? '打开 GitHub' : 'Open GitHub'}
            key={card.href}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

export function FeaturedSamplesSection({ locale = 'en' }: { locale?: Locale }) {
  const copy = landingCopy[locale];
  const cards = localizeCards(featuredSamples, locale);

  return (
    <section className="docs-home-section" id="featured-samples">
      <SectionIntro
        eyebrow={copy.featuredEyebrow}
        title={copy.featuredTitle}
        description={copy.featuredDescription}
      />
      <div className="featured-sample-grid">
        {cards.map((card, index) => (
          <Link
            className="featured-sample-card"
            href={toLocalizedPath(card.href, locale)}
            key={card.href}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <small>{card.meta}</small>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <b aria-hidden="true">→</b>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FeaturesSection({ locale = 'en' }: { locale?: Locale }) {
  const copy = landingCopy[locale];
  const groups = localizeFeatureGroups(featureGroups, locale);

  return (
    <section className="docs-home-section docs-home-section-last" id="features">
      <SectionIntro
        eyebrow={copy.featureEyebrow}
        title={copy.featureTitle}
        description={copy.featureDescription}
      />
      <div className="feature-group-grid">
        {groups.map((group) => (
          <article className="feature-group-card" key={group.title}>
            <header>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </header>
            <div className="feature-mini-list">
              {group.links.map((feature) => (
                <Link
                  className="feature-mini-link"
                  href={toLocalizedPath(feature.href, locale)}
                  key={feature.href}
                >
                  <span>{feature.meta}</span>
                  <strong>{feature.title}</strong>
                  <p>{feature.description}</p>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
