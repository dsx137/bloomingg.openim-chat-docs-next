import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const localRoot = '/docs/chat/platform-api/v3';
const contextKey = 'chat/platform-api/v3';
const contentRoot = 'content/docs/chat/platform-api/v3';
const zhContentRoot = 'content/zh/docs/chat/platform-api/v3';

const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const platformApiZhPath = resolve(root, 'src/generated/platform-api-zh-content.json');
const structurePath = resolve(root, 'data/structure/chat-pages.json');

const desiredPlatformOrder = [
  'overview',
  'prepare-to-use-api',
  'auth',
  'user',
  'relation',
  'group',
  'conversation',
  'message',
  'third',
  'migration-to-openim',
];

const removedPlatformRoots = [
  'channel',
  'migration',
  'moderation',
  'user/managing-session-tokens',
  'message/messaging-basics',
  'friend',
];
const removedRoutePrefixes = removedPlatformRoots.map((segment) => `${localRoot}/${segment}`);
const removedPlatformPages = [
  'user/creating-users/create-a-user',
  'user/listing-users/get-a-user',
  'user/managing-users/update-a-user',
].map((segment) => `${localRoot}/${segment}`);

const moduleOverviews = [
  {
    id: 'user',
    title: '概述',
    navLabel: '用户',
    description:
      'OpenIM Platform API 用户模块概览，覆盖用户注册、资料维护、在线状态、订阅状态和通知账号。',
    intro:
      '用户模块面向可信后端服务，用于把业务系统账号映射为 OpenIM 用户，并维护用户资料、在线状态和系统通知账号。管理员 Token 只能保存在后端，客户端不应直接调用这些管理端接口。',
    capabilities: [
      ['用户注册', '注册业务用户 ID，并写入昵称、头像和扩展字段。'],
      ['资料维护', '更新用户基础资料、扩展资料和全局消息接收选项。'],
      ['用户查询', '分页读取用户、批量获取用户资料、校验账号是否存在。'],
      ['在线状态', '查询用户在线状态、订阅状态和在线 Token 详情。'],
      ['通知账号', '创建、更新和搜索系统通知账号。'],
    ],
    commonLinks: [
      ['注册用户', '/docs/chat/platform-api/v3/user/user-register'],
      ['更新用户信息', '/docs/chat/platform-api/v3/user/update-user-info'],
      ['分页获取用户列表', '/docs/chat/platform-api/v3/user/get-users'],
      ['获取用户在线状态', '/docs/chat/platform-api/v3/user/get-users-online-status'],
      ['新增系统通知账号', '/docs/chat/platform-api/v3/user/add-notification-account'],
    ],
    advice: [
      '用户 ID 应以业务系统为权威来源。创建 OpenIM 用户前，先确认业务账号已经完成注册、风控和权限校验。',
      '客户端登录时，应先向业务后端请求登录凭证，再由后端调用认证接口签发用户 Token。',
    ],
  },
  {
    id: 'auth',
    title: '概述',
    navLabel: '认证',
    description: 'OpenIM Platform API 认证模块概览，覆盖管理员 Token、用户 Token、Token 解析和强制下线。',
    intro:
      '认证模块用于后端获取管理端调用凭证、为客户端签发用户 Token，并在安全场景下解析 Token 或强制用户下线。',
    capabilities: [
      ['管理员 Token', '通过管理员凭据获取后端调用管理端 API 所需的 Token。'],
      ['用户 Token', '为指定用户和平台签发客户端登录 Token。'],
      ['Token 解析', '校验 Token 并解析用户、平台等上下文信息。'],
      ['强制下线', '让指定用户端会话失效，适用于封禁、改密和风险处置。'],
    ],
    commonLinks: [
      ['获取管理员 Token', '/docs/chat/platform-api/v3/auth/get-admin-token'],
      ['获取用户 Token', '/docs/chat/platform-api/v3/auth/get-user-token'],
      ['解析 Token', '/docs/chat/platform-api/v3/auth/parse-token'],
      ['强制用户下线', '/docs/chat/platform-api/v3/auth/force-logout'],
    ],
    advice: [
      '管理员 Token 只应保存在可信后端服务中，不要写入前端环境变量、移动端包体或浏览器代码。',
      '用户 Token 的签发应绑定业务登录态，并结合业务侧风控、封禁和权限校验。',
    ],
  },
  {
    id: 'relation',
    title: '概述',
    navLabel: '关系',
    description: 'OpenIM Platform API 关系模块概览，覆盖好友申请、好友列表、好友关系管理和黑名单。',
    intro:
      '好友模块用于维护用户之间的好友关系、好友申请流程和黑名单数据。所有接口都应由可信后端根据业务规则调用。',
    capabilities: [
      ['好友关系', '添加、删除、导入、校验好友关系，并读取好友 ID 或好友资料。'],
      ['好友申请', '查询收到或发出的申请，处理好友申请和查询指定申请。'],
      ['黑名单', '加入黑名单、移除黑名单，以及分页或批量查询黑名单数据。'],
      ['资料维护', '设置好友备注、更新好友扩展信息。'],
      ['未处理计数', '获取当前用户未处理好友申请数量。'],
    ],
    commonLinks: [
      ['发送好友申请', '/docs/chat/platform-api/v3/friend/add-friend'],
      ['处理好友申请', '/docs/chat/platform-api/v3/friend/respond-friend-application'],
      ['获取好友列表', '/docs/chat/platform-api/v3/friend/get-friend-list'],
      ['加入黑名单', '/docs/chat/platform-api/v3/friend/add-black'],
      ['获取未处理好友申请数量', '/docs/chat/platform-api/v3/friend/get-self-unhandled-apply-count'],
    ],
    advice: [
      '好友关系通常需要结合业务侧隐私、风控和通知策略处理，后端应在调用前完成权限校验。',
      '黑名单会影响用户间互动能力，建议记录操作来源和操作人，便于审计。',
    ],
  },
  {
    id: 'group',
    title: '概述',
    navLabel: '群组',
    description: 'OpenIM Platform API 群组模块概览，覆盖建群、入群申请、成员管理、禁言和群资料维护。',
    intro:
      '群组模块用于由后端创建和管理群聊，包括群资料、群成员、入群申请、群主转让、禁言和全量数据读取。',
    capabilities: [
      ['群组管理', '创建群组、更新群资料、解散群组和转让群主。'],
      ['入群流程', '申请入群、处理入群申请、查询收到或发出的申请。'],
      ['成员管理', '邀请成员、移除成员、查询成员资料和成员列表。'],
      ['禁言控制', '禁言群成员、取消成员禁言、禁言群组和取消群组禁言。'],
      ['全量读取', '读取群成员用户 ID、用户加入群组 ID 和未处理申请数量。'],
    ],
    commonLinks: [
      ['创建群组', '/docs/chat/platform-api/v3/group/create-group'],
      ['邀请用户进群', '/docs/chat/platform-api/v3/group/invite-users-to-group'],
      ['获取群成员列表', '/docs/chat/platform-api/v3/group/get-group-member-list'],
      ['禁言群成员', '/docs/chat/platform-api/v3/group/mute-group-member'],
      ['获取未处理入群申请数量', '/docs/chat/platform-api/v3/group/get-group-application-unhandled-count'],
    ],
    advice: [
      '群组操作通常影响多个用户，建议后端记录 `operationID`、操作人、目标群组和成员列表。',
      '禁言、踢人和解散群组属于高影响操作，应结合业务权限和审计流程使用。',
    ],
  },
  {
    id: 'conversation',
    title: '概述',
    navLabel: '会话',
    description: 'OpenIM Platform API 会话模块概览，覆盖会话读取、批量设置、置顶、免打扰和离线推送用户。',
    intro:
      '会话模块用于后端读取和维护用户会话数据，包括排序会话、批量会话、置顶会话、免打扰会话和离线推送关联用户。',
    capabilities: [
      ['会话读取', '获取排序会话列表、全部会话、单个会话或批量会话。'],
      ['会话设置', '批量设置会话属性和扩展数据。'],
      ['离线推送', '读取会话离线推送关联的用户 ID。'],
      ['全量同步', '全量获取用户会话 ID。'],
      ['状态筛选', '读取置顶会话 ID 和免打扰会话 ID。'],
    ],
    commonLinks: [
      ['获取排序会话列表', '/docs/chat/platform-api/v3/conversation/get-sorted-conversation-list'],
      ['获取全部会话', '/docs/chat/platform-api/v3/conversation/get-all-conversations'],
      ['批量获取会话', '/docs/chat/platform-api/v3/conversation/get-conversations'],
      ['批量设置会话', '/docs/chat/platform-api/v3/conversation/set-conversations'],
      ['获取置顶会话 ID', '/docs/chat/platform-api/v3/conversation/get-pinned-conversation-ids'],
    ],
    advice: [
      '会话数据通常用于后台管理、数据修复和多端同步辅助，不建议由客户端直接调用管理端接口。',
      '批量设置会话前应确认目标用户和会话 ID 的归属关系，避免误改其他用户会话。',
    ],
  },
  {
    id: 'message',
    title: '概述',
    navLabel: '消息',
    description: 'OpenIM Platform API 消息模块概览，覆盖后端发送消息、系统通知、消息查询、已读标记和消息删除。',
    intro:
      '消息模块用于让可信后端发送消息、发送业务通知、查询消息、维护已读序列号，并在管理场景中撤回、清理或删除消息。',
    capabilities: [
      ['后端发送', '发送单条消息、批量发送消息或发送业务通知。'],
      ['消息查询', '按条件搜索消息，或按序列号拉取消息。'],
      ['已读维护', '标记消息或会话已读，设置会话已读序列号。'],
      ['消息删除', '清空会话消息、清空用户全部消息、逻辑删除或物理删除消息。'],
      ['状态辅助', '获取最新序列号、检查发送结果和获取服务器时间。'],
    ],
    commonLinks: [
      ['发送单条消息', '/docs/chat/platform-api/v3/message/send-msg'],
      ['批量发送消息', '/docs/chat/platform-api/v3/message/batch-send-msg'],
      ['搜索消息', '/docs/chat/platform-api/v3/message/search-msg'],
      ['撤回消息', '/docs/chat/platform-api/v3/message/revoke-msg'],
      ['获取服务器时间', '/docs/chat/platform-api/v3/message/get-server-time'],
    ],
    advice: [
      '后端发送消息前，应确认发送身份、目标会话和消息内容都来自可信业务流程。',
      '删除和物理删除消息属于高影响操作，建议先记录审计日志，并限制在后台管理或合规场景使用。',
    ],
  },
  {
    id: 'third',
    title: '概述',
    navLabel: '第三方服务',
    description: 'OpenIM Platform API 第三方服务模块概览，覆盖监控、FCM、应用角标、日志和对象存储。',
    intro:
      '第三方服务模块连接 OpenIM 周边能力，包括监控面板、推送 Token、应用角标、客户端日志和对象存储上传。',
    capabilities: [
      ['监控', '跳转 Prometheus 或 Grafana 监控面板。'],
      ['推送辅助', '更新 FCM Token，设置应用角标。'],
      ['日志管理', '上传、删除和搜索客户端日志。'],
      ['对象上传', '获取分片上传限制、初始化上传、刷新签名并完成上传。'],
      ['访问地址', '获取对象访问 URL 或通过对象路径重定向访问。'],
    ],
    commonLinks: [
      ['跳转监控面板', '/docs/chat/platform-api/v3/third/prometheus'],
      ['更新 FCM Token', '/docs/chat/platform-api/v3/third/fcm-update-token'],
      ['上传日志记录', '/docs/chat/platform-api/v3/third/upload-logs'],
      ['初始化分片上传', '/docs/chat/platform-api/v3/third/initiate-multipart-upload'],
      ['获取对象访问地址', '/docs/chat/platform-api/v3/third/access-url'],
    ],
    advice: [
      '对象存储签名和日志接口通常需要结合业务侧权限校验，避免任意用户上传或读取非授权资源。',
      '监控入口和日志查询适合后台使用，不应直接暴露给普通客户端。',
    ],
  },
];

const platformCategoryLabels = {
  user: '用户',
  auth: '认证',
  relation: '关系',
  group: '群组',
  conversation: '会话',
  message: '消息',
  third: '第三方服务',
  'migration-to-openim': '迁移到 OpenIM',
  'creating-users': '创建用户',
  'listing-users': '查询用户',
  'managing-users': '管理用户',
  presence: '在线状态',
  'notification-accounts': '通知账号',
  tokens: 'Token',
  sessions: '会话控制',
  'managing-friend-requests': '好友申请',
  'listing-friends': '查询好友',
  'managing-friends': '管理好友',
  blacklist: '黑名单',
  'managing-groups': '管理群组',
  'group-applications': '入群申请',
  'group-members': '群成员',
  'group-membership': '用户入群关系',
  'group-moderation': '群组禁言',
  'listing-conversations': '查询会话',
  'managing-conversations': '管理会话',
  'conversation-state': '会话状态',
  'sending-messages': '发送消息',
  'retrieving-messages': '查询消息',
  'read-status': '已读状态',
  'managing-messages': '管理消息',
  'deleting-messages': '删除消息',
  monitoring: '监控',
  push: '推送辅助',
  logs: '日志',
  'object-storage': '对象存储',
};

const childOrderByModule = {
  user: [
    'user/overview',
    'user/creating-users',
    'user/managing-users',
    'user/listing-users',
    'user/presence',
    'user/notification-accounts',
  ],
  auth: ['auth/overview', 'auth/tokens', 'auth/sessions'],
  relation: [
    'relation/overview',
    'relation/managing-friend-requests',
    'relation/listing-friends',
    'relation/managing-friends',
    'relation/blacklist',
  ],
  group: [
    'group/overview',
    'group/managing-groups',
    'group/group-applications',
    'group/group-membership',
    'group/group-members',
    'group/group-moderation',
  ],
  conversation: [
    'conversation/overview',
    'conversation/listing-conversations',
    'conversation/managing-conversations',
    'conversation/conversation-state',
  ],
  message: [
    'message/overview',
    'message/retrieving-messages',
    'message/sending-messages',
    'message/managing-messages',
    'message/read-status',
    'message/deleting-messages',
  ],
  third: ['third/overview', 'third/monitoring', 'third/push', 'third/logs', 'third/object-storage'],
};

const routeRelocations = [
  ['user/user-register', 'user/creating-users/user-register'],
  ['user/update-user-info', 'user/managing-users/update-user-info'],
  ['user/update-user-info-ex', 'user/managing-users/update-user-info-ex'],
  ['user/set-global-msg-recv-opt', 'user/managing-users/set-global-msg-recv-opt'],
  ['user/get-users-info', 'user/listing-users/get-users-info'],
  ['user/get-all-users-uid', 'user/listing-users/list-all-user-ids'],
  ['user/account-check', 'user/listing-users/check-user-accounts'],
  ['user/get-users', 'user/listing-users/list-users'],
  ['user/get-users-online-status', 'user/presence/get-users-online-status'],
  ['user/get-users-online-token-detail', 'user/presence/get-users-online-token-detail'],
  ['user/subscribe-users-status', 'user/presence/subscribe-users-status'],
  ['user/get-users-status', 'user/presence/get-users-status'],
  ['user/get-subscribe-users-status', 'user/presence/get-subscribe-users-status'],
  ['user/add-notification-account', 'user/notification-accounts/add-notification-account'],
  ['user/update-notification-account', 'user/notification-accounts/update-notification-account'],
  ['user/search-notification-account', 'user/notification-accounts/search-notification-account'],

  ['auth/get-admin-token', 'auth/tokens/get-admin-token'],
  ['auth/get-user-token', 'auth/tokens/get-user-token'],
  ['auth/parse-token', 'auth/tokens/parse-token'],
  ['auth/force-logout', 'auth/sessions/force-logout'],

  ['friend/delete-friend', 'friend/managing-friends/delete-friend'],
  ['friend/list-received-friend-applications', 'friend/managing-friend-requests/list-received-friend-requests'],
  ['friend/get-designated-friend-application', 'friend/managing-friend-requests/get-designated-friend-application'],
  ['friend/list-sent-friend-applications', 'friend/managing-friend-requests/list-sent-friend-requests'],
  ['friend/get-friend-list', 'friend/listing-friends/list-friends'],
  ['friend/get-designated-friends', 'friend/listing-friends/get-designated-friends'],
  ['friend/add-friend', 'friend/managing-friend-requests/apply-to-add-friend'],
  ['friend/respond-friend-application', 'friend/managing-friend-requests/respond-friend-apply'],
  ['friend/set-friend-remark', 'friend/managing-friends/set-friend-remark'],
  ['friend/add-black', 'friend/blacklist/add-black'],
  ['friend/get-black-list', 'friend/blacklist/list-blacks'],
  ['friend/get-specified-blacks', 'friend/blacklist/get-specified-blacks'],
  ['friend/remove-black', 'friend/blacklist/remove-black'],
  ['friend/import-friends', 'friend/managing-friends/import-friends'],
  ['friend/is-friend', 'friend/listing-friends/is-friend'],
  ['friend/get-friend-ids', 'friend/listing-friends/get-friend-ids'],
  ['friend/get-specified-friends-info', 'friend/listing-friends/get-specified-friends-info'],
  ['friend/update-friends', 'friend/managing-friends/update-friends'],
  ['friend/get-full-friend-user-ids', 'friend/listing-friends/get-full-friend-user-ids'],
  ['friend/get-self-unhandled-apply-count', 'friend/managing-friend-requests/get-self-unhandled-apply-count'],

  ['group/create-group', 'group/managing-groups/create-group'],
  ['group/set-group-info', 'group/managing-groups/set-group-info'],
  ['group/set-group-info-ex', 'group/managing-groups/set-group-info-ex'],
  ['group/join-group', 'group/group-applications/join-group'],
  ['group/quit-group', 'group/group-membership/quit-group'],
  ['group/respond-group-application', 'group/group-applications/respond-group-application'],
  ['group/transfer-group-owner', 'group/managing-groups/transfer-group-owner'],
  ['group/list-received-group-applications', 'group/group-applications/list-received-group-applications'],
  ['group/list-user-requested-group-applications', 'group/group-applications/list-user-requested-group-applications'],
  ['group/list-group-users-request-applications', 'group/group-applications/list-group-users-request-applications'],
  ['group/get-specified-user-group-request-info', 'group/group-applications/get-specified-user-group-request-info'],
  ['group/get-groups-info', 'group/managing-groups/get-groups-info'],
  ['group/kick-group-members', 'group/group-members/kick-group-members'],
  ['group/get-group-members-info', 'group/group-members/get-group-members-info'],
  ['group/get-group-member-list', 'group/group-members/get-group-member-list'],
  ['group/invite-users-to-group', 'group/group-members/invite-users-to-group'],
  ['group/get-joined-group-list', 'group/group-membership/get-joined-group-list'],
  ['group/dismiss-group', 'group/managing-groups/dismiss-group'],
  ['group/mute-group-member', 'group/group-moderation/mute-group-member'],
  ['group/cancel-mute-group-member', 'group/group-moderation/cancel-mute-group-member'],
  ['group/mute-group', 'group/group-moderation/mute-group'],
  ['group/cancel-mute-group', 'group/group-moderation/cancel-mute-group'],
  ['group/set-group-member-info', 'group/group-members/set-group-member-info'],
  ['group/get-group-abstract-info', 'group/managing-groups/get-group-abstract-info'],
  ['group/get-groups', 'group/managing-groups/get-groups'],
  ['group/get-group-member-user-ids', 'group/group-members/get-group-member-user-ids'],
  ['group/get-full-group-member-user-ids', 'group/group-members/get-full-group-member-user-ids'],
  ['group/get-full-join-group-ids', 'group/group-membership/get-full-join-group-ids'],
  ['group/get-group-application-unhandled-count', 'group/group-applications/get-group-application-unhandled-count'],

  ['conversation/get-sorted-conversation-list', 'conversation/listing-conversations/get-sorted-conversation-list'],
  ['conversation/get-all-conversations', 'conversation/listing-conversations/get-all-conversations'],
  ['conversation/get-conversation', 'conversation/listing-conversations/get-conversation'],
  ['conversation/get-conversations', 'conversation/listing-conversations/get-conversations'],
  ['conversation/set-conversations', 'conversation/managing-conversations/set-conversations'],
  ['conversation/get-conversation-offline-push-user-ids', 'conversation/conversation-state/get-conversation-offline-push-user-ids'],
  ['conversation/get-full-conversation-ids', 'conversation/conversation-state/get-full-conversation-ids'],
  ['conversation/get-owner-conversation', 'conversation/listing-conversations/get-owner-conversation'],
  ['conversation/get-not-notify-conversation-ids', 'conversation/conversation-state/get-not-notify-conversation-ids'],
  ['conversation/get-pinned-conversation-ids', 'conversation/conversation-state/get-pinned-conversation-ids'],

  ['message/newest-seq', 'message/retrieving-messages/newest-seq'],
  ['message/search-msg', 'message/retrieving-messages/search-msg'],
  ['message/send-msg', 'message/sending-messages/send-msg'],
  ['message/send-business-notification', 'message/sending-messages/send-business-notification'],
  ['message/pull-msg-by-seq', 'message/retrieving-messages/pull-msg-by-seq'],
  ['message/revoke-msg', 'message/managing-messages/revoke-msg'],
  ['message/mark-msgs-as-read', 'message/read-status/mark-msgs-as-read'],
  ['message/mark-conversation-as-read', 'message/read-status/mark-conversation-as-read'],
  ['message/get-conversations-has-read-and-max-seq', 'message/read-status/get-conversations-has-read-and-max-seq'],
  ['message/set-conversation-has-read-seq', 'message/read-status/set-conversation-has-read-seq'],
  ['message/clear-conversation-msg', 'message/deleting-messages/clear-conversation-msg'],
  ['message/user-clear-all-msg', 'message/deleting-messages/user-clear-all-msg'],
  ['message/delete-msgs', 'message/deleting-messages/delete-msgs'],
  ['message/delete-msg-physical-by-seq', 'message/deleting-messages/delete-msg-physical-by-seq'],
  ['message/delete-msg-physical', 'message/deleting-messages/delete-msg-physical'],
  ['message/batch-send-msg', 'message/sending-messages/batch-send-msg'],
  ['message/check-msg-is-send-success', 'message/sending-messages/check-msg-is-send-success'],
  ['message/get-server-time', 'message/retrieving-messages/get-server-time'],

  ['third/prometheus', 'third/monitoring/prometheus'],
  ['third/fcm-update-token', 'third/push/fcm-update-token'],
  ['third/set-app-badge', 'third/push/set-app-badge'],
  ['third/upload-logs', 'third/logs/upload-logs'],
  ['third/delete-logs', 'third/logs/delete-logs'],
  ['third/search-logs', 'third/logs/search-logs'],
  ['third/part-limit', 'third/object-storage/part-limit'],
  ['third/part-size', 'third/object-storage/part-size'],
  ['third/initiate-multipart-upload', 'third/object-storage/initiate-multipart-upload'],
  ['third/auth-sign', 'third/object-storage/auth-sign'],
  ['third/complete-multipart-upload', 'third/object-storage/complete-multipart-upload'],
  ['third/access-url', 'third/object-storage/access-url'],
  ['third/initiate-form-data', 'third/object-storage/initiate-form-data'],
  ['third/complete-form-data', 'third/object-storage/complete-form-data'],
  ['third/object-redirect', 'third/object-storage/object-redirect'],
].map(([from, to]) => [`${localRoot}/${from}`, `${localRoot}/${to}`]);
const routeRelocationMap = new Map(routeRelocations);

const linkReplacements = [
  [
    '/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel',
    '/docs/chat/platform-api/v3/group/create-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/inviting-a-user/invite-as-members-channel',
    '/docs/chat/platform-api/v3/group/invite-users-to-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/update-a-group-channel',
    '/docs/chat/platform-api/v3/group/set-group-info',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/delete-a-group-channel',
    '/docs/chat/platform-api/v3/group/dismiss-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/join-a-channel',
    '/docs/chat/platform-api/v3/group/join-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/managing-a-channel/leave-a-channel',
    '/docs/chat/platform-api/v3/group/quit-group',
  ],
  [
    '/docs/chat/platform-api/v3/channel/listing-users/list-members-of-a-group-channel',
    '/docs/chat/platform-api/v3/group/get-group-member-list',
  ],
  ['/docs/chat/platform-api/v3/channel/overview', '/docs/chat/platform-api/v3/group/create-group'],
  [
    '/docs/chat/platform-api/v3/user/creating-users/create-a-user',
    '/docs/chat/platform-api/v3/user/user-register',
  ],
  [
    '/docs/chat/platform-api/v3/user/listing-users/list-users',
    '/docs/chat/platform-api/v3/user/get-users',
  ],
  [
    '/docs/chat/platform-api/v3/user/listing-users/get-a-user',
    '/docs/chat/platform-api/v3/user/get-users-info',
  ],
  [
    '/docs/chat/platform-api/v3/user/managing-users/update-a-user',
    '/docs/chat/platform-api/v3/user/update-user-info',
  ],
  [
    '/docs/chat/platform-api/v3/user/managing-session-tokens/issue-a-session-token',
    '/docs/chat/platform-api/v3/auth/get-user-token',
  ],
  [
    '/docs/chat/platform-api/v3/user/managing-session-tokens/revoke-all-session-tokens',
    '/docs/chat/platform-api/v3/auth/force-logout',
  ],
  [
    '/docs/chat/platform-api/v3/message/messaging-basics/send-a-message',
    '/docs/chat/platform-api/v3/message/send-msg',
  ],
  [
    '/docs/chat/platform-api/v3/migration/migrate-messages',
    '/docs/chat/platform-api/v3/message/send-msg',
  ],
  [
    '/docs/chat/platform-api/v3/migration/overview',
    '/docs/chat/platform-api/v3/message/overview',
  ],
  [
    '/docs/chat/platform-api/v3/moderation/blocking-users/block-users',
    '/docs/chat/platform-api/v3/friend/add-black',
  ],
  [
    '/docs/chat/platform-api/v3/moderation/blocking-users/unblock-a-user',
    '/docs/chat/platform-api/v3/friend/remove-black',
  ],
  [
    '/docs/chat/platform-api/v3/moderation/muting-a-user/mute-a-member-in-a-group-channel',
    '/docs/chat/platform-api/v3/group/mute-group-member',
  ],
  [
    '/docs/chat/platform-api/v3/moderation/muting-a-user/unmute-a-member-in-a-group-channel',
    '/docs/chat/platform-api/v3/group/cancel-mute-group-member',
  ],
  [
    '/docs/chat/platform-api/v3/moderation/overview',
    '/docs/chat/platform-api/v3/group/mute-group-member',
  ],
];
const allLinkReplacements = [...routeRelocations, ...linkReplacements].sort(
  (a, b) => b[0].length - a[0].length,
);

const textReplacements = [
  ['### 群组频道', '### 群组'],
  [
    'OpenIM 使用群组能力承载群聊场景。文档中的“群组频道”概念在这里映射为 OpenIM 群组、群成员和入群申请。',
    'OpenIM 使用群组能力承载群聊场景。服务端可通过群组接口创建群组、邀请成员和处理入群流程。',
  ],
  [
    '[创建群组频道](/docs/chat/platform-api/v3/group/create-group)',
    '[创建群组](/docs/chat/platform-api/v3/group/create-group)',
  ],
  [
    '[创建群组频道](/docs/chat/platform-api/v3/group/managing-groups/create-group)',
    '[创建群组](/docs/chat/platform-api/v3/group/managing-groups/create-group)',
  ],
  [
    '[频道概览](/docs/chat/platform-api/v3/group/create-group)',
    '[群组接口](/docs/chat/platform-api/v3/group/create-group)',
  ],
  [
    '[创建用户](/docs/chat/platform-api/v3/user/user-register)',
    '[注册用户](/docs/chat/platform-api/v3/user/user-register)',
  ],
  [
    '[查询用户列表](/docs/chat/platform-api/v3/user/get-users)',
    '[分页获取用户列表](/docs/chat/platform-api/v3/user/get-users)',
  ],
  [
    '[获取用户](/docs/chat/platform-api/v3/user/get-users-info)',
    '[获取指定用户信息](/docs/chat/platform-api/v3/user/get-users-info)',
  ],
  [
    '[更新用户](/docs/chat/platform-api/v3/user/update-user-info)',
    '[更新用户信息](/docs/chat/platform-api/v3/user/update-user-info)',
  ],
  [
    '[签发会话 Token](/docs/chat/platform-api/v3/auth/get-user-token)',
    '[获取用户 Token](/docs/chat/platform-api/v3/auth/get-user-token)',
  ],
  [
    '[注销全部会话 Token](/docs/chat/platform-api/v3/auth/force-logout)',
    '[强制用户下线](/docs/chat/platform-api/v3/auth/force-logout)',
  ],
  [
    '[发送消息](/docs/chat/platform-api/v3/message/send-msg)',
    '[发送单条消息](/docs/chat/platform-api/v3/message/send-msg)',
  ],
  [
    '[迁移消息](/docs/chat/platform-api/v3/message/send-msg)',
    '[发送单条消息](/docs/chat/platform-api/v3/message/send-msg)',
  ],
  [
    '[迁移概览](/docs/chat/platform-api/v3/message/overview)',
    '[消息概览](/docs/chat/platform-api/v3/message/overview)',
  ],
  [
    '[屏蔽用户](/docs/chat/platform-api/v3/friend/add-black)',
    '[加入黑名单](/docs/chat/platform-api/v3/friend/add-black)',
  ],
  [
    '[取消屏蔽用户](/docs/chat/platform-api/v3/friend/remove-black)',
    '[移除黑名单](/docs/chat/platform-api/v3/friend/remove-black)',
  ],
  [
    '[禁言群组成员](/docs/chat/platform-api/v3/group/mute-group-member)',
    '[禁言群成员](/docs/chat/platform-api/v3/group/mute-group-member)',
  ],
  [
    '[禁言群组频道成员](/docs/chat/platform-api/v3/group/mute-group-member)',
    '[禁言群成员](/docs/chat/platform-api/v3/group/mute-group-member)',
  ],
  [
    '[解除群组成员禁言](/docs/chat/platform-api/v3/group/cancel-mute-group-member)',
    '[取消禁言群成员](/docs/chat/platform-api/v3/group/cancel-mute-group-member)',
  ],
  [
    '[解除群组频道成员禁言](/docs/chat/platform-api/v3/group/cancel-mute-group-member)',
    '[取消禁言群成员](/docs/chat/platform-api/v3/group/cancel-mute-group-member)',
  ],
  [
    '[内容审核概览](/docs/chat/platform-api/v3/group/mute-group-member)',
    '[禁言群成员](/docs/chat/platform-api/v3/group/mute-group-member)',
  ],
  [
    '[内容审核概览](/docs/chat/platform-api/v3/group/group-moderation/mute-group-member)',
    '[禁言群成员](/docs/chat/platform-api/v3/group/group-moderation/mute-group-member)',
  ],
];

await Promise.all([
  ...removedPlatformRoots.map((segment) =>
    rm(resolve(root, `${contentRoot}/${segment}`), { force: true, recursive: true }),
  ),
  ...removedPlatformRoots.map((segment) =>
    rm(resolve(root, `${zhContentRoot}/${segment}`), { force: true, recursive: true }),
  ),
  ...removedPlatformPages.flatMap((path) => [
    rm(resolve(root, routeContentFile(path)), { force: true }),
    rm(resolve(root, localizedContentFile(routeContentFile(path))), { force: true }),
  ]),
]);
await writeRootOverviewFiles();
await writeModuleOverviewFiles();

const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
const platformApiZh = JSON.parse(await readFile(platformApiZhPath, 'utf8'));

await applyRouteFileRelocations(routes);

const nextRoutes = upsertModuleOverviewRoutes(
  dedupeRoutesByPath(routes.filter((route) => !isRemovedPlatformPath(route.path)).map(relocateRoute)),
)
  .map((route, index) => ({ ...route, id: index + 1 }));

const platformContext = navigation.contexts.find((context) => context.key === contextKey);
if (!platformContext) {
  throw new Error(`Missing navigation context: ${contextKey}`);
}

platformContext.nodes = reorderPlatformNodes(buildPlatformNavigationNodes(nextRoutes));
platformContext.pageCount = nextRoutes.filter((route) => route.contextKey === contextKey).length;

platformApiZh.generatedAt = today;
for (const label of ['channel', 'migration', 'moderation']) {
  delete platformApiZh.navigationLabels?.[label];
}
for (const overview of moduleOverviews) {
  platformApiZh.navigationLabels = {
    ...platformApiZh.navigationLabels,
    [overview.id]: overview.navLabel,
  };
}
platformApiZh.navigationLabels = {
  ...platformApiZh.navigationLabels,
  ...platformCategoryLabels,
};

await Promise.all([
  writeFile(routesPath, `${JSON.stringify(nextRoutes, null, 2)}\n`, 'utf8'),
  writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8'),
  writeFile(platformApiZhPath, `${JSON.stringify(platformApiZh, null, 2)}\n`, 'utf8'),
  writeFile(
    structurePath,
    `${JSON.stringify(
      nextRoutes.map((route) => ({
        sourcePath: route.sourcePath,
        openimPath: route.path,
        title: route.title,
        context: route.contextKey,
        template: route.template,
        contentFile: route.contentFile,
      })),
      null,
      2,
    )}\n`,
    'utf8',
  ),
]);

await rewritePlatformContent(resolve(root, contentRoot));
await rewritePlatformContent(resolve(root, zhContentRoot));

console.log('Removed legacy OpenIM Platform API demo pages and reordered platform navigation.');

function isRemovedPlatformPath(path) {
  return (
    removedPlatformPages.includes(path) ||
    removedRoutePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  );
}

function dedupeRoutesByPath(routes) {
  const byPath = new Map();
  for (const route of routes) {
    byPath.set(route.path, route);
  }
  return [...byPath.values()];
}

async function applyRouteFileRelocations(routes) {
  const platformRoutes = routes.filter((route) => route.contextKey === contextKey);
  await Promise.all(
    platformRoutes.map(async (route) => {
      const nextPath = routeRelocationMap.get(route.path);
      if (!nextPath) return;
      const nextContentFile = routeContentFile(nextPath);
      await Promise.all([
        relocateContentFile(route.contentFile, nextContentFile, route.path, nextPath),
        relocateContentFile(
          localizedContentFile(route.contentFile),
          localizedContentFile(nextContentFile),
          route.path,
          nextPath,
        ),
      ]);
    }),
  );
}

async function relocateContentFile(fromFile, toFile, fromPath, toPath) {
  if (fromFile === toFile) return;
  const source = await readOptional(resolve(root, fromFile));
  if (!source) return;
  const next = source.split(fromPath).join(toPath);
  await mkdir(dirname(resolve(root, toFile)), { recursive: true });
  await writeFile(resolve(root, toFile), next, 'utf8');
  await rm(resolve(root, fromFile), { force: true });
}

async function readOptional(file) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    return undefined;
  }
}

function relocateRoute(route) {
  const path = routeRelocationMap.get(route.path);
  if (!path) return route;
  return {
    ...route,
    path,
    relativePath: path.replace(/^\/docs\//, ''),
    sourcePath: path,
    contentFile: routeContentFile(path),
  };
}

function routeContentFile(path) {
  return `${contentRoot}/${path.slice(localRoot.length).replace(/^\//, '')}.mdx`;
}

function localizedContentFile(file) {
  return file.replace(/^content\/docs\//, 'content/zh/docs/');
}

async function writeModuleOverviewFiles() {
  await Promise.all(
    moduleOverviews.flatMap((overview) => [
      writeOverviewMdx(`${contentRoot}/${overview.id}/overview.mdx`, overview),
      writeOverviewMdx(`${zhContentRoot}/${overview.id}/overview.mdx`, overview),
    ]),
  );
}

async function writeRootOverviewFiles() {
  await Promise.all([
    writeFile(resolve(root, `${contentRoot}/overview.mdx`), renderRootOverviewMdx(), 'utf8'),
    writeFile(resolve(root, `${zhContentRoot}/overview.mdx`), renderRootOverviewMdx(), 'utf8'),
  ]);
}

function renderRootOverviewMdx() {
  const frontmatter = {
    title: '概述',
    description: 'OpenIM Platform API 中文概览，覆盖服务端 REST API、Webhook 和后端运营能力。',
    product: 'platform-api',
    context: contextKey,
    template: 'overview',
    status: 'published',
    lastUpdated: today,
    version: 'v3',
    sourcePath: `${localRoot}/overview`,
  };

  return `---\n${renderFrontmatter(frontmatter)}\n---\n\nOpenIM Platform API 面向可信后端服务，提供用户、认证、好友、群组、会话、消息、上传、日志和运营管理相关的 REST 接口参考。中文文档保留 Platform API 的导航方式，具体能力、接口路径和请求字段以 OpenIM REST 已覆盖的文档为准。\n\n## 最常用\n\n### 认证\n\n在调用管理端 REST API 前，后端服务需要确认 API 地址、请求头和管理员 Token 的使用方式。客户端登录所需的用户 Token 也应由可信后端签发。\n\n- [接入准备](/docs/chat/platform-api/v3/prepare-to-use-api)\n- [获取管理员 Token](/docs/chat/platform-api/v3/auth/tokens/get-admin-token)\n- [获取用户 Token](/docs/chat/platform-api/v3/auth/tokens/get-user-token)\n\n### 用户管理\n\n通过 OpenIM 用户管理接口创建、更新、查询用户资料，并把注册、注销、权限等业务规则保留在业务系统中。\n\n- [注册用户](/docs/chat/platform-api/v3/user/creating-users/user-register)\n- [分页获取用户列表](/docs/chat/platform-api/v3/user/listing-users/list-users)\n- [获取指定用户信息](/docs/chat/platform-api/v3/user/listing-users/get-users-info)\n\n### 消息\n\n使用 OpenIM 消息接口从后端发送消息、发送业务通知、查询消息和维护消息状态。\n\n- [发送单条消息](/docs/chat/platform-api/v3/message/sending-messages/send-msg)\n- [批量发送消息](/docs/chat/platform-api/v3/message/sending-messages/batch-send-msg)\n- [搜索消息](/docs/chat/platform-api/v3/message/retrieving-messages/search-msg)\n\n## 推荐功能\n\n### 好友\n\nOpenIM 好友接口用于维护好友关系、好友申请和黑名单。\n\n- [申请添加好友](/docs/chat/platform-api/v3/friend/managing-friend-requests/apply-to-add-friend)\n- [查询好友列表](/docs/chat/platform-api/v3/friend/listing-friends/list-friends)\n- [加入黑名单](/docs/chat/platform-api/v3/friend/blacklist/add-black)\n\n### 群组\n\nOpenIM 使用群组能力承载群聊场景。服务端可通过群组接口创建群组、邀请成员和处理入群流程。\n\n- [创建群组](/docs/chat/platform-api/v3/group/managing-groups/create-group)\n- [邀请成员](/docs/chat/platform-api/v3/group/group-members/invite-users-to-group)\n- [禁言群成员](/docs/chat/platform-api/v3/group/group-moderation/mute-group-member)\n\n### 会话\n\n会话接口用于读取、批量设置会话信息，以及维护置顶、免打扰和离线推送关联数据。\n\n- [获取排序会话列表](/docs/chat/platform-api/v3/conversation/listing-conversations/get-sorted-conversation-list)\n- [批量获取会话](/docs/chat/platform-api/v3/conversation/listing-conversations/get-conversations)\n\n### 第三方服务\n\n第三方服务接口覆盖监控跳转、日志上传、对象存储上传签名和访问地址获取。\n\n- [跳转监控面板](/docs/chat/platform-api/v3/third/monitoring/prometheus)\n- [初始化分片上传](/docs/chat/platform-api/v3/third/object-storage/initiate-multipart-upload)\n\n## 资源\n\n| 字段 | 值 |\n| ---- | -- |\n| 支持情况 | OpenIM REST 已提供直接接口 |\n| 产品区域 | OpenIM 服务端 REST API |\n| 请求模型 | 后端到后端的 HTTP JSON 请求，使用 operationID 串联日志 |\n| 鉴权方式 | 管理端 REST API 使用 APP 管理员 Token |\n\n- [OpenIM REST API 介绍](https://docs.openim.io/restapi/apis/introduction)\n- [OpenIM 错误码](https://docs.openim.io/restapi/errCode)\n`;
}

async function writeOverviewMdx(file, overview) {
  await mkdir(dirname(resolve(root, file)), { recursive: true });
  await writeFile(resolve(root, file), renderOverviewMdx(overview), 'utf8');
}

function renderOverviewMdx(overview) {
  const path = `${localRoot}/${overview.id}/overview`;
  const frontmatter = {
    title: overview.title,
    description: overview.description,
    product: 'platform-api',
    context: contextKey,
    template: 'overview',
    status: 'published',
    lastUpdated: today,
    version: 'v3',
    sourcePath: path,
  };

  return `---\n${renderFrontmatter(frontmatter)}\n---\n\n${renderOverviewBody(overview)}\n`;
}

function renderOverviewBody(overview) {
  return `${overview.intro}

## 能力范围

| 能力 | 说明 |
| ---- | ---- |
${overview.capabilities.map(([capability, detail]) => `| ${capability} | ${detail} |`).join('\n')}

## 常用接口

${renderLinks(overview.commonLinks)}

## 接入建议

${overview.advice.join('\n\n')}

## 相关页面

${renderLinks([
  ['接入准备', '/docs/chat/platform-api/v3/prepare-to-use-api'],
  ['错误码', '/docs/chat/platform-api/v3/error-codes'],
])}`;
}

function renderLinks(links) {
  return links.map(([label, href]) => `- [${label}](${href})`).join('\n');
}

function renderFrontmatter(data) {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

function upsertModuleOverviewRoutes(routes) {
  const next = [...routes];
  for (const overview of moduleOverviews) {
    const path = `${localRoot}/${overview.id}/overview`;
    const contentFile = `${contentRoot}/${overview.id}/overview.mdx`;
    const existingIndex = next.findIndex((route) => route.path === path);
    const existing = existingIndex >= 0 ? next[existingIndex] : undefined;
    const firstModuleIndex = next.findIndex(
      (route) => route.path !== path && route.path.startsWith(`${localRoot}/${overview.id}/`),
    );
    const firstModuleRoute = firstModuleIndex >= 0 ? next[firstModuleIndex] : undefined;
    const maxSourceIndex = Math.max(...next.map((route) => route.sourceIndex ?? 0));
    const maxNavOrder = Math.max(...next.map((route) => route.navOrder ?? 0));
    const sourceIndex =
      existing?.sourceIndex ??
      (Number.isFinite(firstModuleRoute?.sourceIndex)
        ? firstModuleRoute.sourceIndex - 0.1
        : maxSourceIndex + 1);
    const navOrder =
      existing?.navOrder ??
      (Number.isFinite(firstModuleRoute?.navOrder)
        ? firstModuleRoute.navOrder - 0.1
        : maxNavOrder + 1);
    const record = {
      ...(existing ?? {}),
      id: 0,
      path,
      relativePath: path.replace(/^\/docs\//, ''),
      sourcePath: path,
      title: overview.title,
      description: overview.description,
      product: 'platform-api',
      version: 'v3',
      platform: null,
      contextKey,
      contextTitle: 'Platform API',
      template: 'overview',
      status: 'published',
      sourceIndex,
      contentFile,
      navOrder,
    };

    if (existingIndex >= 0) {
      next[existingIndex] = record;
    } else if (firstModuleIndex >= 0) {
      next.splice(firstModuleIndex, 0, record);
    } else {
      next.push(record);
    }
  }
  return next;
}

function reorderPlatformNodes(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered = desiredPlatformOrder.map((id) => byId.get(id)).filter(Boolean);
  const orderedIDs = new Set(desiredPlatformOrder);
  const remainder = nodes.filter((node) => !orderedIDs.has(node.id));
  return [...ordered, ...remainder];
}

function buildPlatformNavigationNodes(routes) {
  const platformRoutes = routes.filter((route) => route.contextKey === contextKey);
  const rootNode = {
    id: '',
    segment: '',
    title: '',
    href: null,
    type: 'folder',
    children: [],
    minIndex: Number.POSITIVE_INFINITY,
  };

  for (const route of platformRoutes) {
    const rest = route.path.slice(localRoot.length).replace(/^\//, '');
    if (!rest) continue;
    const segments = rest.split('/');
    let cursor = rootNode;
    let currentID = '';

    for (const [index, segment] of segments.entries()) {
      currentID = currentID ? `${currentID}/${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      let child = cursor.children.find((node) => node.id === currentID);
      if (!child) {
        child = {
          id: currentID,
          segment,
          title: isLeaf ? route.title : navigationLabel(segment),
          href: isLeaf ? route.path : null,
          type: isLeaf ? 'page' : 'folder',
          children: [],
          minIndex: route.navOrder,
        };
        cursor.children.push(child);
      }
      child.minIndex = Math.min(child.minIndex ?? route.navOrder, route.navOrder);
      if (isLeaf) {
        child.title = route.title;
        child.href = route.path;
        child.type = 'page';
      }
      cursor = child;
    }
  }

  sortNavigationNodes(rootNode.children);
  return rootNode.children;
}

function navigationLabel(segment) {
  return platformCategoryLabels[segment] ?? humanizeSegment(segment);
}

function sortNavigationNodes(nodes, parentID = '') {
  const explicitOrder = parentID ? (childOrderByModule[parentID] ?? []) : desiredPlatformOrder;
  const order = new Map(explicitOrder.map((id, index) => [id, index]));
  nodes.sort((a, b) => {
    const first = order.get(a.id) ?? Number.POSITIVE_INFINITY;
    const second = order.get(b.id) ?? Number.POSITIVE_INFINITY;
    return (
      first - second ||
      (a.minIndex ?? Number.POSITIVE_INFINITY) - (b.minIndex ?? Number.POSITIVE_INFINITY) ||
      a.title.localeCompare(b.title)
    );
  });
  for (const node of nodes) {
    sortNavigationNodes(node.children ?? [], node.id);
  }
}

function humanizeSegment(segment) {
  return segment
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bApi\b/g, 'API')
    .replace(/\bFcm\b/g, 'FCM')
    .replace(/\bId\b/g, 'ID');
}

async function rewritePlatformContent(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) {
        await rewritePlatformContent(file);
        return;
      }
      if (!entry.isFile() || !entry.name.endsWith('.mdx')) return;

      const original = await readFile(file, 'utf8');
      let next = original;
      for (const [from, to] of allLinkReplacements) {
        next = next.split(from).join(to);
      }
      for (const [from, to] of textReplacements) {
        next = next.split(from).join(to);
      }
      if (next !== original) {
        await writeFile(file, next, 'utf8');
      }
    }),
  );
}
