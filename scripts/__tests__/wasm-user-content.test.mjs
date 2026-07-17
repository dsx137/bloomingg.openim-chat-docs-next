import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = 'content/zh/docs/chat/sdk/wasm/user';
const wasmRoot = 'content/zh/docs/chat/sdk/wasm';
const audit = JSON.parse(readFileSync('data/structure/wasm-content-audit.json', 'utf8'));

function read(relativePath) {
  return readFileSync(`${root}/${relativePath}.mdx`, 'utf8');
}

function readWasm(relativePath) {
  return readFileSync(`${wasmRoot}/${relativePath}.mdx`, 'utf8');
}

function auditPage(relativePath) {
  const currentPath = `/sdk/wasm/user/${relativePath}`;
  return audit.pages.find((page) => page.currentPath === currentPath);
}

test('friend request parameters match the pinned WASM declarations', () => {
  const source = read('managing-friends/manage-friend-requests');

  assert.match(source, /`reqMsg` 是申请附言/);
  assert.match(source, /`handleMsg`.*空字符串/);
  assert.doesNotMatch(source, /\| `ex`\s+\| `string`\s+\|/);
});

test('friend application events separate received and sent applications', () => {
  const source = read('managing-friends/manage-friend-requests');

  assert.match(source, /申请发起者和接收者都会收到/);
  assert.match(source, /data\.toUserID === currentUserID/);
});

test('friend search documents required switches and the data type', () => {
  const source = read('retrieving-users/retrieve-a-list-of-friends');

  for (const name of ['isSearchUserID', 'isSearchNickname', 'isSearchRemark']) {
    assert.match(
      source,
      new RegExp(name + '.+boolean.+必填'),
      name,
    );
  }
  assert.match(source, /当前只支持一个非空关键词/);
  assert.match(source, /`data` 是匹配当前关键词的 `SearchedFriendsInfo\[\]`/);
  assert.doesNotMatch(source, /WsResponse<SearchedFriendsInfo\[\]>/);
  assert.match(source, /`relationship`/);
});

test('blacklist pages use real fields and explain asymmetric message behavior', () => {
  const list = read('moderating-a-user/retrieve-a-list-of-blocked-users');
  const operations = read('moderating-a-user/block-and-unblock-other-members');

  assert.doesNotMatch(list, /\| `gender`/);
  assert.match(operations, /对方不能向当前用户发送消息/);
  assert.match(operations, /当前用户仍可向对方发送消息/);
});

test('Group pages document mute permissions and normalize mute timestamps', () => {
  const operations = readWasm('group/moderating-groups/mute-a-group-or-member');
  const list = readWasm('group/retrieving-group-members/retrieve-group-members');

  assert.match(operations, /群主可以禁言管理员和普通成员/);
  assert.match(operations, /管理员只能禁言普通成员/);
  assert.match(operations, /normalizeMuteEndTime/);
  assert.match(list, /normalizeMuteEndTime/);
  assert.match(list, /CbEvents\.OnGroupMemberDeleted/);
});

test('friend deletion removes rather than merges a cached friend', () => {
  const relationship = read('retrieving-users/retrieve-friend-information');
  const source = read('managing-friends/update-or-delete-friends');

  assert.match(relationship, /result.*`1`.*好友/);
  assert.match(relationship, /黑名单.*非好友/);
  assert.match(source, /function handleFriendDeleted/);
  assert.match(source, /removeFriend\(data\.userID\)/);
});

test('online status documents subscription without exposing getUserStatus', () => {
  const source = read(
    'retrieving-and-updating-user-information/retrieve-the-online-status-of-a-user',
  );

  assert.match(source, /3000/);
  assert.doesNotMatch(source, /getUserStatus/);
  assert.doesNotMatch(source, /OpenIM\.getGroupMemberList/);
  assert.doesNotMatch(source, /声明缺口|两层签名不一致/);
});

test('profile examples cover extension ownership and whole-value replacement', () => {
  const source = read('retrieving-and-updating-user-information/update-user-profile');

  assert.match(source, /## 更新扩展字段/);
  assert.match(source, /整体覆盖/);
  assert.match(source, /可信后端维护/);
});

test('profile updates restrict editable fields and separate refresh errors', () => {
  const source = read('retrieving-and-updating-user-information/update-user-profile');

  assert.doesNotMatch(source, /const payload: PartialUserItem/);
  assert.match(source, /type EditableSelfProfile/);
  assert.doesNotMatch(source, /await OpenIM\.setSelfInfo[\s\S]*return loadCurrentUser\(\);[\s\S]*setSelfInfo failed/);
});

test('user overview links every user-owned workflow and leaves group moderation to Groups', () => {
  const source = read('overview-user');

  assert.match(source, /管理好友申请/);
  assert.match(source, /更新或删除好友/);
  assert.match(source, /更新用户资料/);
  assert.doesNotMatch(source, /查询群内被禁言成员/);
});

test('exact-ID user lookup has a precise title', () => {
  const source = read('retrieving-users/retrieve-users');

  assert.match(source, /^title: '获取指定用户资料'$/m);
  assert.match(source, /## 调用结果与资料刷新/);
  assert.match(source, /没有面向任意公开用户资料的通用变更事件/);
});

test('every user-page event example includes matching cleanup', () => {
  const pages = [
    'managing-friends/manage-friend-requests',
    'managing-friends/update-or-delete-friends',
    'moderating-a-user/block-and-unblock-other-members',
    'moderating-a-user/retrieve-a-list-of-blocked-users',
    'retrieving-and-updating-user-information/retrieve-the-online-status-of-a-user',
    'retrieving-and-updating-user-information/update-user-profile',
    'retrieving-users/retrieve-a-list-of-friends',
    'retrieving-users/retrieve-friend-information',
  ];

  for (const page of pages) {
    const source = read(page);
    const onCount = source.match(/OpenIM\.on\(/g)?.length ?? 0;
    const offCount = source.match(/OpenIM\.off\(/g)?.length ?? 0;
    assert.equal(offCount, onCount, `${page}: expected one off() for every on()`);
  }
});

test('user-page audit records match the reviewed content', () => {
  assert.equal(auditPage('overview-user').disposition, 'adapt');
  const mergedLatestInfo = auditPage(
    'retrieving-and-updating-user-information/retrieve-the-latest-information-on-participants',
  );
  assert.equal(mergedLatestInfo.disposition, 'merge');
  assert.equal(
    mergedLatestInfo.redirectTo,
    '/sdk/wasm/user/retrieving-users/retrieve-users',
  );
  assert.ok(mergedLatestInfo.sdkMethods.includes('getUsersInfo'));

  const redirects = JSON.parse(
    readFileSync('data/structure/wasm-legacy-redirects.json', 'utf8'),
  );
  assert.deepEqual(
    redirects.find((entry) => entry.source === mergedLatestInfo.currentPath),
    {
      source: mergedLatestInfo.currentPath,
      destination: '/sdk/wasm/user/retrieving-users/retrieve-users',
    },
  );

  const online = auditPage(
    'retrieving-and-updating-user-information/retrieve-the-online-status-of-a-user',
  );
  const ownership = JSON.parse(
    readFileSync('data/structure/wasm-api-ownership.json', 'utf8'),
  );
  assert.equal(
    ownership.methods.find((item) => item.name === 'getUserStatus')?.status,
    'excluded-consolidated',
  );

  const selfInfoPages = [
    'overview-user',
    'retrieving-and-updating-user-information/update-user-profile',
  ];
  for (const path of selfInfoPages) {
    assert.ok(
      auditPage(path).openimSources.some((source) => source.endsWith('/onSelfUserInfoUpdate.md')),
      `${path}: missing immutable OnSelfInfoUpdated source`,
    );
  }
});
