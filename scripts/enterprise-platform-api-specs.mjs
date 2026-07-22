export const enterpriseEndpoints = [
  endpoint('user', 'account-governance', 'ban-user', '封禁用户', '/user/ban_user', 'banUser', '封禁指定用户，阻止账号继续使用商业版服务。'),
  endpoint('user', 'account-governance', 'unban-user', '解除用户封禁', '/user/unban_user', 'unbanUser', '解除指定用户的封禁状态。'),
  endpoint('user', 'account-governance', 'unregister-user', '注销用户', '/user/unregister_user', 'unregisterUser', '批量注销不再使用服务的用户账号。'),
  endpoint('user', 'account-governance', 'list-disabled-users', '查询停用用户', '/user/page_find_disable_users', 'pageFindDisabledUsers', '按用户、状态和分页条件查询停用账号。'),

  endpoint('relation', 'managing-friend-requests', 'delete-sent-friend-requests', '删除发出的好友申请', '/friend/delete_friend_requests_from_user', 'DeleteFriendRequestsFromUser', '删除指定用户向其他用户发出的好友申请记录。'),
  endpoint('relation', 'managing-friend-requests', 'delete-received-friend-requests', '删除收到的好友申请', '/friend/delete_friend_requests_to_user', 'DeleteFriendRequestsToUser', '删除指定用户收到的好友申请记录。'),

  endpoint('group', 'group-applications', 'get-group-application-badge-count', '获取入群申请角标数', '/group/get_group_application_badge_count', 'getGroupApplicationBadgeCount', '获取用户当前待展示的入群申请角标数量。'),
  endpoint('group', 'group-applications', 'clear-group-application-badge-count', '清除入群申请角标数', '/group/clear_group_application_badge_count', 'clearGroupApplicationBadgeCount', '清除用户当前的入群申请角标计数。'),
  endpoint('group', 'group-applications', 'delete-user-group-requests', '删除用户发出的入群申请', '/group/delete_group_requests_from_user', 'DeleteGroupRequestsFromUser', '删除用户向指定群组发出的入群申请记录。'),
  endpoint('group', 'group-applications', 'delete-group-received-requests', '删除群组收到的入群申请', '/group/delete_group_requests_to_group', 'DeleteGroupRequestsToGroup', '删除指定群组收到的用户入群申请记录。'),

  endpoint('message', 'content-processing', 'translate-text', '翻译文本', '/third/translate_text', 'TranslateText', '将文本翻译为指定语言，并返回译文和检测到的源语言。'),
  endpoint('message', 'streaming-messages', 'append-stream-message', '追加流式消息分片', '/msg/append_stream_msg', 'AppendStreamMsg', '向已有流式消息追加一批文本分片，并可标记流式输出结束。'),
  {
    ...endpoint('message', 'streaming-messages', 'put-stream-message', '上传流式消息分片', '/msg/append_stream_msg', 'AppendStreamMsg', '通过 HTTP PUT 持续上传 UTF-8 流式消息内容。'),
    method: 'PUT',
    special: 'stream-put',
  },
  endpoint('message', 'read-status', 'mark-conversation-read', '标记会话已读位置', '/msg/mark_conversation_read', 'MarkConversationRead', '按消息 Seq 更新用户在指定会话中的已读位置。'),
  endpoint('message', 'managing-messages', 'modify-message', '修改消息内容', '/msg/modify_message', 'ModifyMessage', '修改指定会话和 Seq 对应的消息内容，并返回修改时间与次数。'),
  endpoint('message', 'unread-count', 'get-conversations-unread-count', '获取会话未读数', '/msg/get_conversations_unread_count', 'GetConversationsUnreadCount', '批量获取用户在指定会话中的未读消息数量。'),
  endpoint('message', 'unread-count', 'clear-conversations-unread-count', '清除会话未读数', '/msg/clear_conversations_unread_count', 'ClearConversationsUnreadCount', '批量清除用户在指定会话中的未读消息数量。'),
  endpoint('message', 'unread-count', 'reset-conversation-unread', '设置会话未读数', '/msg/reset_conversation_unread', 'ResetConversationUnread', '按用户和会话设置目标未读数，用于数据迁移或状态修正。'),

  endpoint('conversation', 'conversation-groups', 'create-conversation-group', '创建会话分组', '/conversation/create_conversation_group', 'CreateConversationGroup', '为用户创建会话分组，并可将一个会话加入新分组。'),
  endpoint('conversation', 'conversation-groups', 'update-conversation-group', '更新会话分组', '/conversation/update_conversation_group', 'UpdateConversationGroup', '更新会话分组名称、扩展字段或隐藏状态。'),
  endpoint('conversation', 'conversation-groups', 'delete-conversation-group', '删除会话分组', '/conversation/delete_conversation_group', 'DeleteConversationGroup', '删除用户的指定会话分组。'),
  endpoint('conversation', 'conversation-groups', 'list-conversation-groups', '查询会话分组', '/conversation/get_conversation_groups', 'GetConversationGroups', '查询用户的会话分组及版本信息。'),
  endpoint('conversation', 'conversation-groups', 'set-conversation-group-order', '设置会话分组顺序', '/conversation/set_conversation_group_order', 'SetConversationGroupOrder', '批量调整用户会话分组的展示顺序。'),
  endpoint('conversation', 'conversation-groups', 'add-conversations-to-groups', '将会话加入分组', '/conversation/add_conversations_to_groups', 'AddConversationsToGroups', '批量将会话加入一个或多个会话分组。'),
  endpoint('conversation', 'conversation-groups', 'remove-conversations-from-groups', '将会话移出分组', '/conversation/remove_conversations_from_groups', 'RemoveConversationsFromGroups', '批量将会话从一个或多个会话分组移出。'),

  endpoint('timer', 'managing-tasks', 'create-timer-task', '创建定时任务', '/timer/create_timer_task', 'CreateTimerTask', '创建一个按指定时间执行并回调业务服务的定时任务。'),
  endpoint('timer', 'managing-tasks', 'update-timer-task', '更新定时任务', '/timer/update_timer_task', 'UpdateTimerTask', '更新定时任务的执行时间、分类、重试和回调配置。'),
  endpoint('timer', 'managing-tasks', 'delete-timer-task', '删除定时任务', '/timer/delete_timer_task', 'DeleteTimerTask', '删除用户创建的指定定时任务。'),
  endpoint('timer', 'managing-tasks', 'get-timer-task', '获取定时任务', '/timer/get_timer_task', 'GetTimerTask', '获取指定定时任务的完整信息。'),
  endpoint('timer', 'managing-tasks', 'list-timer-tasks', '查询定时任务', '/timer/list_timer_task', 'ListTimerTasks', '按用户和任务分类分页查询定时任务。'),
];

export const meetingEndpoints = [
  meeting('meeting-management', 'book-meeting', '预约会议', '/book_meeting', 'BookMeeting', '预约一个未来开始的会议。'),
  meeting('meeting-management', 'create-immediate-meeting', '创建即时会议', '/create_immediate_meeting', 'CreateImmediateMeeting', '立即创建会议并返回实时音视频连接信息。'),
  meeting('meeting-management', 'join-meeting', '加入会议', '/join_meeting', 'JoinMeeting', '校验会议和密码后加入会议。'),
  meeting('meeting-management', 'get-meeting-token', '获取会议 Token', '/get_meeting_token', 'GetMeetingToken', '为指定用户获取会议实时音视频连接 Token。'),
  meeting('meeting-management', 'update-meeting', '更新会议', '/update_meeting', 'UpdateMeeting', '按字段更新会议资料、设置和受邀用户。'),
  meeting('meeting-management', 'get-meeting', '获取会议详情', '/get_meeting', 'GetMeeting', '获取指定会议的资料、设置和重复会议信息。'),
  meeting('meeting-management', 'list-meetings', '查询用户会议', '/get_meetings', 'GetMeetings', '按状态查询用户创建或参加的会议。'),
  meeting('meeting-management', 'invite-meeting-users', '邀请用户参加会议', '/invite_meeting_invitees', 'InviteMeetingInvitees', '邀请用户加入已有会议并返回处理结果。'),
  meeting('meeting-management', 'leave-meeting', '离开会议', '/leave_meeting', 'LeaveMeeting', '让指定用户离开当前会议。'),
  meeting('meeting-management', 'end-meeting', '结束会议', '/end_meeting', 'EndMeeting', '取消预约会议或结束进行中的会议。'),
  meeting('meeting-management', 'get-user-related-meetings', '查询用户相关会议', '/get_user_related_meetings', 'GetUserRelatedMeetings', '按状态和时间范围查询与用户相关的会议。'),

  meeting('meeting-settings', 'set-personal-setting', '设置个人会议偏好', '/set_personal_setting', 'SetPersonalMeetingSettings', '设置用户进入会议时的摄像头和麦克风偏好。'),
  meeting('meeting-settings', 'get-personal-setting', '获取个人会议偏好', '/get_personal_setting', 'GetPersonalMeetingSettings', '获取用户在指定会议中的个人音视频偏好。'),
  meeting('meeting-settings', 'operate-all-streams', '控制会议全员音视频', '/operate_meeting_all_stream', 'OperateRoomAllStream', '批量控制会议参与者的摄像头和麦克风状态。'),
  meeting('meeting-settings', 'modify-participant-name', '修改参会者名称', '/modify_meeting_participant_name', 'ModifyMeetingParticipantNickName', '修改指定参会者在会议中的展示名称。'),
  meeting('meeting-settings', 'remove-participants', '移除参会者', '/remove_participants', 'RemoveParticipants', '批量将参与者移出会议。'),
  meeting('meeting-settings', 'set-meeting-host', '设置主持人', '/set_meeting_host_info', 'SetMeetingHostInfo', '设置会议主持人和联合主持人。'),
  meeting('meeting-settings', 'clean-previous-meetings', '清理历史会议状态', '/clean_previous_meetings', 'CleanPreviousMeetings', '清理用户登录前遗留的会议连接状态。'),

  meeting('recurring-meetings', 'create-repeat-meeting', '创建重复会议', '/create_repeat_meeting', 'CreateRepeatMeeting', '创建重复会议规则并生成首个会议实例。'),
  meeting('recurring-meetings', 'update-repeat-meeting', '更新重复会议', '/update_repeat_meeting', 'UpdateRepeatMeeting', '更新重复会议规则及后续会议实例。'),
  meeting('recurring-meetings', 'delete-repeat-meeting', '删除重复会议', '/delete_repeat_meeting', 'DeleteRepeatMeeting', '删除重复会议定义。'),
  meeting('recurring-meetings', 'get-repeat-meeting', '获取重复会议', '/get_repeat_meeting', 'GetRepeatMeeting', '获取重复会议定义和生成状态。'),
  meeting('recurring-meetings', 'list-repeat-meetings', '查询重复会议', '/list_repeat_meetings', 'ListRepeatMeetings', '查询用户创建的重复会议。'),
  meeting('recurring-meetings', 'list-repeat-meeting-instances', '查询重复会议实例', '/list_repeat_meeting_instances', 'ListRepeatMeetingInstances', '查询重复会议已生成的会议实例。'),

  meeting('meeting-records', 'get-user-meeting-histories', '查询用户参会历史', '/get_user_meeting_histories', 'GetUserMeetingHistories', '按时间、状态和分页条件查询用户参会历史。'),
  meeting('meeting-records', 'get-user-hosted-meetings', '查询用户主持记录', '/get_user_hosted_meetings', 'GetUserHostedMeetings', '按时间和分页条件查询用户主持过的会议。'),
  meeting('meeting-records', 'get-meeting-records', '查询会议录制记录', '/get_meeting_records', 'GetMeetingRecords', '查询用户主持或参加的会议录制记录。'),
  meeting('meeting-records', 'get-records-by-meeting-ids', '按会议 ID 查询录制记录', '/get_meeting_records_by_meeting_ids', 'GetMeetingRecordsByMeetingIDs', '批量查询指定会议的录制记录。'),
  meeting('meeting-records', 'get-meeting-attendance', '获取会议出席情况', '/get_meeting_attendance', 'GetMeetingAttendance', '获取会议已出席和缺席的用户列表。'),
  meeting('meeting-records', 'delete-meeting-records', '删除会议录制记录', '/delete_meeting_records', 'DeleteMeetingRecords', '按会议房间 ID 删除录制记录。'),

  meeting('meeting-signaling', 'get-room-by-group-id', '按群组获取通话房间', '/signal_get_room_by_group_id', 'SignalGetRoomByGroupID', '获取群组当前关联的实时通话房间和参与者。', 'signal'),
  meeting('meeting-signaling', 'get-signal-rooms', '批量获取通话房间', '/signal_get_rooms', 'SignalGetRooms', '批量获取指定实时通话房间的信息。', 'signal'),
  meeting('meeting-signaling', 'get-signal-invitation', '获取通话邀请', '/get_signal_invitation_info', 'GetSignalInvitationInfo', '获取指定房间的实时通话邀请信息。', 'signal'),
  meeting('meeting-signaling', 'get-startup-invitation', '获取启动时通话邀请', '/get_signal_invitation_info_start_app', 'GetSignalInvitationInfoStartApp', '查询用户启动应用时需要恢复的实时通话邀请。', 'signal'),

  meeting('meeting-chat', 'send-meeting-chat', '发送会议聊天消息', '/send_meeting_chat', 'SendMeetingChat', '在会议中发送广播或定向聊天消息。'),
  meeting('meeting-chat', 'pull-meeting-chat', '拉取会议聊天消息', '/pull_meeting_chat', 'PullMeetingChat', '按创建时间和 Seq 增量拉取会议聊天消息。'),
  meeting('meeting-chat', 'revoke-meeting-chat', '撤回会议聊天消息', '/revoke_meeting_chat', 'RevokeMeetingChat', '按 Seq 撤回会议中的聊天消息。'),
];

function endpoint(module, category, slug, title, path, rpc, summary) {
  return { module, category, slug, title, path, rpc, summary, method: 'POST' };
}

function meeting(category, slug, title, path, rpc, summary, protoModule = 'meeting') {
  return {
    module: 'meeting',
    category,
    slug,
    title,
    path: `/rtc-meeting${path}`,
    rpc,
    summary,
    method: 'POST',
    protoModule: `openmeeting/${protoModule}`,
  };
}
