const callback = (category, key, title, slug, summary, requestType, responseType, options = {}) => ({
  category,
  key,
  title,
  slug,
  summary,
  requestType,
  responseType,
  timing: key.startsWith('before') ? 'before' : 'after',
  command: options.command ?? `callback${key[0].toUpperCase()}${key.slice(1)}Command`,
  edition: options.edition ?? 'open-source',
});

export const webhookCategoryTitles = {
  user: '用户',
  relation: '关系',
  group: '群组',
  message: '消息',
  push: '推送与在线状态',
  conversation: '会话',
};

export const webhookSpecs = [
  callback('user', 'beforeUserRegister', '用户注册前', 'before-user-register', '在用户注册到 OpenIM 前校验或调整用户资料。', 'CallbackBeforeUserRegisterReq', 'CallbackBeforeUserRegisterResp'),
  callback('user', 'afterUserRegister', '用户注册后', 'after-user-register', '在用户注册完成后同步用户资料。', 'CallbackAfterUserRegisterReq', 'CallbackAfterUserRegisterResp'),
  callback('user', 'beforeUpdateUserInfo', '更新用户资料前', 'before-update-user-info', '在更新用户资料前校验或调整昵称、头像和扩展字段。', 'CallbackBeforeUpdateUserInfoReq', 'CallbackBeforeUpdateUserInfoResp'),
  callback('user', 'afterUpdateUserInfo', '更新用户资料后', 'after-update-user-info', '在用户资料更新完成后同步变更。', 'CallbackAfterUpdateUserInfoReq', 'CallbackAfterUpdateUserInfoResp'),
  callback('user', 'beforeUpdateUserInfoEx', '按字段更新用户资料前', 'before-update-user-info-ex', '在按字段更新用户资料前校验或调整本次变更。', 'CallbackBeforeUpdateUserInfoExReq', 'CallbackBeforeUpdateUserInfoExResp'),
  callback('user', 'afterUpdateUserInfoEx', '按字段更新用户资料后', 'after-update-user-info-ex', '在按字段更新用户资料完成后同步变更。', 'CallbackAfterUpdateUserInfoExReq', 'CallbackAfterUpdateUserInfoExResp'),

  callback('relation', 'beforeAddFriend', '发起好友申请前', 'before-add-friend', '在发起好友申请前执行权限或风控校验。', 'CallbackBeforeAddFriendReq', 'CallbackBeforeAddFriendResp'),
  callback('relation', 'afterAddFriend', '发起好友申请后', 'after-add-friend', '在好友申请创建后同步申请数据。', 'CallbackAfterAddFriendReq', 'CallbackAfterAddFriendResp'),
  callback('relation', 'beforeAddFriendAgree', '同意好友申请前', 'before-add-friend-agree', '在同意好友申请前校验本次操作。', 'CallbackBeforeAddFriendAgreeReq', 'CallbackBeforeAddFriendAgreeResp'),
  callback('relation', 'afterAddFriendAgree', '同意好友申请后', 'after-add-friend-agree', '在好友关系建立后同步关系数据。', 'CallbackAfterAddFriendAgreeReq', 'CallbackAfterAddFriendAgreeResp'),
  callback('relation', 'afterDeleteFriend', '删除好友后', 'after-delete-friend', '在好友关系删除后同步关系变更。', 'CallbackAfterDeleteFriendReq', 'CallbackAfterDeleteFriendResp'),
  callback('relation', 'beforeSetFriendRemark', '设置好友备注前', 'before-set-friend-remark', '在设置好友备注前校验或调整备注内容。', 'CallbackBeforeSetFriendRemarkReq', 'CallbackBeforeSetFriendRemarkResp'),
  callback('relation', 'afterSetFriendRemark', '设置好友备注后', 'after-set-friend-remark', '在好友备注更新后同步变更。', 'CallbackAfterSetFriendRemarkReq', 'CallbackAfterSetFriendRemarkResp'),
  callback('relation', 'beforeAddBlack', '加入黑名单前', 'before-add-black', '在用户加入黑名单前校验本次操作。', 'CallbackBeforeAddBlackReq', 'CallbackBeforeAddBlackResp'),
  callback('relation', 'afterRemoveBlack', '移出黑名单后', 'after-remove-black', '在用户移出黑名单后同步关系变更。', 'CallbackAfterRemoveBlackReq', 'CallbackAfterRemoveBlackResp'),
  callback('relation', 'beforeImportFriends', '导入好友前', 'before-import-friends', '在批量导入好友前校验或过滤目标用户。', 'CallbackBeforeImportFriendsReq', 'CallbackBeforeImportFriendsResp'),
  callback('relation', 'afterImportFriends', '导入好友后', 'after-import-friends', '在好友导入完成后同步结果。', 'CallbackAfterImportFriendsReq', 'CallbackAfterImportFriendsResp'),

  callback('group', 'beforeCreateGroup', '创建群组前', 'before-create-group', '在创建群组前校验或调整群资料和初始成员。', 'CallbackBeforeCreateGroupReq', 'CallbackBeforeCreateGroupResp'),
  callback('group', 'afterCreateGroup', '创建群组后', 'after-create-group', '在群组创建完成后同步群资料和初始成员。', 'CallbackAfterCreateGroupReq', 'CallbackAfterCreateGroupResp'),
  callback('group', 'beforeMemberJoinGroup', '成员加入群组前', 'before-member-join-group', '在用户成为群成员前校验或调整成员资料。', 'CallbackBeforeMembersJoinGroupReq', 'CallbackBeforeMembersJoinGroupResp', { command: 'callbackBeforeMembersJoinGroupCommand' }),
  callback('group', 'beforeInviteUserToGroup', '邀请用户入群前', 'before-invite-user-to-group', '在邀请用户加入群组前校验邀请并可拒绝部分成员。', 'CallbackBeforeInviteUserToGroupReq', 'CallbackBeforeInviteUserToGroupResp', { command: 'callbackBeforeInviteJoinGroupCommand' }),
  callback('group', 'beforeApplyJoinGroup', '申请加入群组前', 'before-apply-join-group', '在用户申请加入群组前执行权限或风控校验。', 'CallbackJoinGroupReq', 'CallbackJoinGroupResp', { command: 'callbackBeforeJoinGroupCommand' }),
  callback('group', 'afterJoinGroup', '加入群组后', 'after-join-group', '在用户加入群组后同步成员变更。', 'CallbackAfterJoinGroupReq', 'CallbackAfterJoinGroupResp'),
  callback('group', 'afterQuitGroup', '退出群组后', 'after-quit-group', '在用户主动退出群组后同步成员变更。', 'CallbackQuitGroupReq', 'CallbackQuitGroupResp'),
  callback('group', 'afterKickGroupMember', '移出群成员后', 'after-kick-group-member', '在成员被移出群组后同步成员变更。', 'CallbackKillGroupMemberReq', 'CallbackKillGroupMemberResp', { command: 'callbackAfterKickGroupCommand' }),
  callback('group', 'afterDismissGroup', '解散群组后', 'after-dismiss-group', '在群组解散后同步群组状态。', 'CallbackDisMissGroupReq', 'CallbackDisMissGroupResp', { command: 'callbackAfterDisMissGroupCommand' }),
  callback('group', 'afterTransferGroupOwner', '转让群主后', 'after-transfer-group-owner', '在群主转让完成后同步群主变更。', 'CallbackTransferGroupOwnerReq', 'CallbackTransferGroupOwnerResp'),
  callback('group', 'beforeSetGroupMemberInfo', '设置群成员资料前', 'before-set-group-member-info', '在设置群成员资料前校验或调整字段。', 'CallbackBeforeSetGroupMemberInfoReq', 'CallbackBeforeSetGroupMemberInfoResp'),
  callback('group', 'afterSetGroupMemberInfo', '设置群成员资料后', 'after-set-group-member-info', '在群成员资料更新后同步变更。', 'CallbackAfterSetGroupMemberInfoReq', 'CallbackAfterSetGroupMemberInfoResp'),
  callback('group', 'beforeSetGroupInfo', '设置群资料前', 'before-set-group-info', '在设置群资料前校验或调整字段。', 'CallbackBeforeSetGroupInfoReq', 'CallbackBeforeSetGroupInfoResp'),
  callback('group', 'afterSetGroupInfo', '设置群资料后', 'after-set-group-info', '在群资料更新后同步变更。', 'CallbackAfterSetGroupInfoReq', 'CallbackAfterSetGroupInfoResp'),
  callback('group', 'beforeSetGroupInfoEx', '按字段设置群资料前', 'before-set-group-info-ex', '在按字段设置群资料前校验或调整本次变更。', 'CallbackBeforeSetGroupInfoExReq', 'CallbackBeforeSetGroupInfoExResp'),
  callback('group', 'afterSetGroupInfoEx', '按字段设置群资料后', 'after-set-group-info-ex', '在按字段设置群资料后同步变更。', 'CallbackAfterSetGroupInfoExReq', 'CallbackAfterSetGroupInfoExResp'),

  callback('message', 'beforeSendSingleMsg', '发送单聊消息前', 'before-send-single-message', '在单聊消息发送前执行内容审核、拦截或字段检查。', 'CallbackBeforeSendSingleMsgReq', 'CallbackBeforeSendSingleMsgResp'),
  callback('message', 'afterSendSingleMsg', '发送单聊消息后', 'after-send-single-message', '在单聊消息发送完成后同步消息事件。', 'CallbackAfterSendSingleMsgReq', 'CallbackAfterSendSingleMsgResp'),
  callback('message', 'beforeSendGroupMsg', '发送群聊消息前', 'before-send-group-message', '在群聊消息发送前执行内容审核、拦截或字段检查。', 'CallbackBeforeSendGroupMsgReq', 'CallbackBeforeSendGroupMsgResp'),
  callback('message', 'afterSendGroupMsg', '发送群聊消息后', 'after-send-group-message', '在群聊消息发送完成后同步消息事件。', 'CallbackAfterSendGroupMsgReq', 'CallbackAfterSendGroupMsgResp'),
  callback('message', 'beforeMsgModify', '消息写入前', 'before-message-modify', '在消息最终写入前调整允许修改的消息字段。', 'CallbackMsgModifyCommandReq', 'CallbackMsgModifyCommandResp'),
  callback('message', 'afterSingleMsgRead', '单聊消息已读后', 'after-single-message-read', '在单聊消息已读状态更新后同步已读事件。', 'CallbackSingleMsgReadReq', 'CallbackSingleMsgReadResp'),
  callback('message', 'afterGroupMsgRead', '群聊消息已读后', 'after-group-message-read', '在群聊消息已读状态更新后同步已读事件。', 'CallbackGroupMsgReadReq', 'CallbackGroupMsgReadResp'),
  callback('message', 'afterRevokeMsg', '消息撤回后', 'after-revoke-message', '在消息撤回完成后同步撤回事件。', 'CallbackAfterRevokeMsgReq', 'CallbackAfterRevokeMsgResp', { command: 'callbackBeforeAfterMsgCommand' }),

  callback('push', 'beforeOnlinePush', '单聊在线推送前', 'before-online-push', '在单聊在线推送前调整目标用户或推送策略。', 'CallbackBeforePushReq', 'CallbackBeforePushResp'),
  callback('push', 'beforeGroupOnlinePush', '群聊在线推送前', 'before-group-online-push', '在群聊在线推送前调整目标用户或推送策略。', 'CallbackBeforeSuperGroupOnlinePushReq', 'CallbackBeforeSuperGroupOnlinePushResp'),
  callback('push', 'beforeOfflinePush', '离线推送前', 'before-offline-push', '在离线推送前调整实际推送用户和离线推送信息。', 'CallbackBeforePushReq', 'CallbackBeforePushResp'),
  callback('push', 'afterUserOnline', '用户上线后', 'after-user-online', '在用户建立在线连接后同步在线状态。', 'CallbackUserOnlineReq', 'CallbackUserOnlineResp'),
  callback('push', 'afterUserOffline', '用户离线后', 'after-user-offline', '在用户连接断开后同步离线状态。', 'CallbackUserOfflineReq', 'CallbackUserOfflineResp'),
  callback('push', 'afterUserKickOff', '用户被强制下线后', 'after-user-kick-off', '在用户被强制下线后同步连接状态。', 'CallbackUserKickOffReq', 'CallbackUserKickOffResp'),

  callback('conversation', 'beforeCreateSingleChatConversations', '创建单聊会话前', 'before-create-single-chat-conversations', '在首次创建单聊会话前调整会话默认属性。', 'CallbackBeforeCreateSingleChatConversationsReq', 'CallbackBeforeCreateSingleChatConversationsResp', { edition: 'enterprise' }),
  callback('conversation', 'afterCreateSingleChatConversations', '创建单聊会话后', 'after-create-single-chat-conversations', '在单聊会话创建后同步完整会话属性。', 'CallbackAfterCreateSingleChatConversationsReq', 'CallbackAfterCreateSingleChatConversationsResp', { edition: 'enterprise' }),
  callback('conversation', 'beforeCreateGroupChatConversations', '创建群聊会话前', 'before-create-group-chat-conversations', '在首次创建群聊会话前调整会话默认属性。', 'CallbackBeforeCreateGroupChatConversationsReq', 'CallbackBeforeCreateGroupChatConversationsResp', { edition: 'enterprise' }),
  callback('conversation', 'afterCreateGroupChatConversations', '创建群聊会话后', 'after-create-group-chat-conversations', '在群聊会话创建后同步完整会话属性。', 'CallbackAfterCreateGroupChatConversationsReq', 'CallbackAfterCreateGroupChatConversationsResp', { edition: 'enterprise' }),
];

export function webhookRoute(spec) {
  return `/docs/chat/platform-api/v3/webhooks/${spec.category}/${spec.slug}`;
}
