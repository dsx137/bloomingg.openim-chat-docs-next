import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ownership = JSON.parse(readFileSync('data/structure/wasm-api-ownership.json', 'utf8'));

const commercialMethods = [
  'speechToTextCapabilities',
  'speechToText',
  'getConversationGroupInfoWithConversations',
  'getConversationGroupIDsByConversationID',
  'removeConversationsFromGroups',
  'addConversationsToGroups',
  'setConversationGroupOrder',
  'getConversationGroups',
  'deleteConversationGroup',
  'updateConversationGroup',
  'createConversationGroup',
  'getConversationPinnedMsg',
  'setConversationPinnedMsg',
  'deleteMessages',
  'modifyMessage',
  'getSignalingInvitationInfoStartApp',
  'signalingGetTokenByRoomID',
  'signalingGetRoomByGroupID',
  'signalingHungUp',
  'signalingCancel',
  'signalingReject',
  'signalingAccept',
  'signalingInviteInGroup',
  'signalingInvite',
  'deleteGroupRequests',
  'deleteFriendRequests',
  'fetchSurroundingMessages',
  'getAdvancedHistoryMessageListReverse',
  'sendGroupMessageReadReceipt',
  'getGroupMessageReaderList',
];

const commercialEvents = [
  'OnChangedPinnedMsg',
  'OnConversationGroupAdded',
  'OnConversationGroupChanged',
  'OnConversationGroupDeleted',
  'OnConversationGroupMemberAdded',
  'OnConversationGroupMemberDeleted',
  'OnMsgDeleted',
  'OnMessageModified',
  'OnReceiveNewInvitation',
  'OnInviteeAccepted',
  'OnInviteeAcceptedByOtherDevice',
  'OnInviteeRejected',
  'OnInviteeRejectedByOtherDevice',
  'OnInvitationCancelled',
  'OnInvitationTimeout',
  'OnHangUp',
  'OnRoomParticipantConnected',
  'OnRoomParticipantDisconnected',
  'OnStreamChange',
  'OnFriendApplicationDeleted',
  'OnGroupApplicationDeleted',
  'OnRecvGroupReadReceipt',
];

const nonCommercialSamePageMethods = [
  'revokeMessage',
  'deleteMessageFromLocalStorage',
  'addFriend',
  'acceptFriendApplication',
  'acceptGroupApplication',
  'getAdvancedHistoryMessageList',
  'findMessageList',
];

const nonCommercialEvents = ['OnNewRecvMessageRevoked', 'OnRecvMessageRevoked', 'OnRecvC2CReadReceipt'];

function getPageCommercialInfo(pagePath) {
  const documentedMethods = ownership.methods.filter(
    (entry) => entry.page === pagePath && entry.status === 'documented',
  );
  const methods = documentedMethods
    .filter((entry) => entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const openSourceMethods = documentedMethods
    .filter((entry) => !entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const events = ownership.events
    .filter((entry) => entry.page === pagePath && entry.commercial)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (methods.length === 0 && events.length === 0) {
    return { kind: 'none', methods, openSourceMethods, events };
  }

  return {
    kind:
      documentedMethods.length > 0 && methods.length === documentedMethods.length
        ? 'full'
        : 'partial',
    methods,
    openSourceMethods,
    events,
  };
}

test('marks the commercial method inventory', () => {
  for (const name of commercialMethods) {
    const entry = ownership.methods.find((method) => method.name === name);
    assert.ok(entry, `missing method ${name}`);
    assert.equal(entry.commercial, true, `${name} must be commercial`);
  }
});

test('marks the commercial event inventory', () => {
  for (const name of commercialEvents) {
    const entry = ownership.events.find((event) => event.name === name);
    assert.ok(entry, `missing event ${name}`);
    assert.equal(entry.commercial, true, `${name} must be commercial`);
  }
});

test('does not mark open-source methods on mixed pages as commercial', () => {
  for (const name of nonCommercialSamePageMethods) {
    const entry = ownership.methods.find((method) => method.name === name);
    assert.ok(entry, `missing method ${name}`);
    assert.equal(entry.commercial, undefined, `${name} must not be commercial`);
  }
});

test('does not mark open-source events as commercial', () => {
  for (const name of nonCommercialEvents) {
    const entry = ownership.events.find((event) => event.name === name);
    assert.ok(entry, `missing event ${name}`);
    assert.equal(entry.commercial, undefined, `${name} must not be commercial`);
  }
});

test('classifies full commercial pages', () => {
  assert.equal(
    getPageCommercialInfo(
      '/sdk/wasm/conversation/managing-conversation-groups/manage-conversation-groups',
    ).kind,
    'full',
  );
  assert.equal(
    getPageCommercialInfo('/sdk/wasm/message/managing-messages/pin-conversation-messages').kind,
    'full',
  );
  assert.equal(
    getPageCommercialInfo('/sdk/wasm/calling/managing-calls/start-or-handle-a-call').kind,
    'full',
  );
});

test('classifies mixed commercial pages', () => {
  const deletePage = getPageCommercialInfo(
    '/sdk/wasm/message/managing-messages/delete-a-message',
  );
  assert.equal(deletePage.kind, 'partial');
  assert.deepEqual(deletePage.methods, ['deleteMessages']);
  assert.ok(deletePage.openSourceMethods.includes('revokeMessage') === false);
  assert.ok(deletePage.openSourceMethods.includes('deleteMessageFromLocalStorage'));

  assert.equal(
    getPageCommercialInfo('/sdk/wasm/message/managing-messages/revoke-a-message').kind,
    'none',
  );

  assert.equal(
    getPageCommercialInfo('/sdk/wasm/message/managing-messages/modify-a-message').kind,
    'full',
  );

  const history = getPageCommercialInfo(
    '/sdk/wasm/message/retrieving-messages/retrieve-message-history',
  );
  assert.equal(history.kind, 'partial');
  assert.deepEqual(history.methods, ['getAdvancedHistoryMessageListReverse']);
  assert.ok(history.openSourceMethods.includes('getAdvancedHistoryMessageList'));

  assert.equal(
    getPageCommercialInfo('/sdk/wasm/user/managing-friends/manage-friend-requests').kind,
    'partial',
  );
  assert.equal(
    getPageCommercialInfo('/sdk/wasm/group/managing-group-applications/manage-group-applications')
      .kind,
    'partial',
  );
});

test('matches commercial symbols in inline code text', () => {
  function matchCommercialSymbol(codeText, commercialNames) {
    if (commercialNames.size === 0) return null;
    const trimmed = codeText.trim();
    const withoutCall = trimmed.replace(/\(\s*\)$/, '');
    const candidates = [
      withoutCall,
      withoutCall.replace(/^OpenIM\./, ''),
      withoutCall.replace(/^CbEvents\./, ''),
      withoutCall.includes('.') ? (withoutCall.split('.').at(-1) ?? withoutCall) : withoutCall,
    ];
    for (const candidate of candidates) {
      if (commercialNames.has(candidate)) return candidate;
    }
    return null;
  }

  const names = new Set(['getAdvancedHistoryMessageListReverse', 'OnMsgDeleted']);
  assert.equal(
    matchCommercialSymbol('getAdvancedHistoryMessageListReverse()', names),
    'getAdvancedHistoryMessageListReverse',
  );
  assert.equal(
    matchCommercialSymbol('OpenIM.getAdvancedHistoryMessageListReverse', names),
    matchCommercialSymbol('openimsdk.getAdvancedHistoryMessageListReverse', names),
    'getAdvancedHistoryMessageListReverse',
  );
  assert.equal(matchCommercialSymbol('CbEvents.OnMsgDeleted', names), 'OnMsgDeleted');
  assert.equal(matchCommercialSymbol('getAdvancedHistoryMessageList()', names), null);
});

test('leaves non-commercial pages unmarked', () => {
  assert.equal(
    getPageCommercialInfo('/sdk/wasm/getting-started/authenticate-and-manage-session').kind,
    'none',
  );
});
