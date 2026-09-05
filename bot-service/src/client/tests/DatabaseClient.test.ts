import { DatabaseClient } from '../DatabaseClient';
import { QuestionType } from '@vulps22/project-encourage-types';

const BASE  = 'http://ds:3000';
const TOKEN = 'test-ds-token';

const mockUser      = { id: '123', username: 'user', banned: false };
const mockServer    = { id: '456', name: 'server' };
const mockQuestion  = { id: 1, type: QuestionType.Truth, question: 'test?' };
const mockChallenge = { id: 1, user_id: '123' };
const mockVote      = { challenge_id: 1, done_count: 0, failed_count: 0 };
const mockConfig    = { id: 'config', lockdown: false };
const mockStorable  = { id: 'item1', name: 'item' };
const mockInventory = { qty: 5 };

describe('DatabaseClient', () => {
  let client: DatabaseClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new DatabaseClient(BASE, TOKEN);
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  function succeed(body: unknown) {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
    });
  }

  function expectCall(method: string, path: string, body?: unknown) {
    const opts: Record<string, unknown> = {
      method,
      headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(path),
      expect.objectContaining(opts)
    );
  }

  // ===== USER =====

  it('getUser → GET /api/v1/user/:id', async () => {
    succeed(mockUser);
    await client.getUser('123');
    expectCall('GET', '/api/v1/user/123');
  });

  it('upsertUser → POST /api/v1/user', async () => {
    succeed(mockUser);
    await client.upsertUser('123', 'user');
    expectCall('POST', '/api/v1/user', { id: '123', username: 'user' });
  });

  it('updateUser → PATCH /api/v1/user/:id', async () => {
    succeed(mockUser);
    await client.updateUser('123', { username: 'newname' });
    expectCall('PATCH', '/api/v1/user/123', { username: 'newname' });
  });

  it('banUser → PATCH /api/v1/user/:id/ban', async () => {
    succeed(mockUser);
    await client.banUser('123', 'spam');
    expectCall('PATCH', '/api/v1/user/123/ban', { ban_reason: 'spam' });
  });

  it('unbanUser → PATCH /api/v1/user/:id/unban', async () => {
    succeed(mockUser);
    await client.unbanUser('123');
    expectCall('PATCH', '/api/v1/user/123/unban', {});
  });

  // ===== INVENTORY =====

  it('getInventoryItem → GET /api/v1/user/:uid/inventory/:sid', async () => {
    succeed(mockInventory);
    await client.getInventoryItem('123', 'item1');
    expectCall('GET', '/api/v1/user/123/inventory/item1');
  });

  it('addInventoryItem → POST /api/v1/user/:uid/inventory/:sid', async () => {
    succeed(mockInventory);
    await client.addInventoryItem('123', 'item1', 2);
    expectCall('POST', '/api/v1/user/123/inventory/item1', { amount: 2 });
  });

  it('consumeInventoryItem → POST /api/v1/user/:uid/inventory/:sid/consume', async () => {
    succeed(mockInventory);
    await client.consumeInventoryItem('123', 'item1', 1);
    expectCall('POST', '/api/v1/user/123/inventory/item1/consume', { amount: 1 });
  });

  // ===== SERVER =====

  it('getServer → GET /api/v1/server/:id', async () => {
    succeed(mockServer);
    await client.getServer('456');
    expectCall('GET', '/api/v1/server/456');
  });

  it('upsertServer → POST /api/v1/server', async () => {
    succeed(mockServer);
    await client.upsertServer('456', 'srv', '123');
    expectCall('POST', '/api/v1/server', { id: '456', name: 'srv', user_id: '123' });
  });

  it('updateServer → PATCH /api/v1/server/:id', async () => {
    succeed(mockServer);
    await client.updateServer('456', { name: 'renamed' });
    expectCall('PATCH', '/api/v1/server/456', { name: 'renamed' });
  });

  // ===== QUESTION =====

  it('getQuestion → GET /api/v1/question/:id', async () => {
    succeed(mockQuestion);
    await client.getQuestion(1);
    expectCall('GET', '/api/v1/question/1');
  });

  it('searchQuestions → GET /api/v1/question/search', async () => {
    succeed([mockQuestion]);
    await client.searchQuestions('hello');
    expectCall('GET', '/api/v1/question/search');
  });

  it('getRandomQuestion → GET /api/v1/question/random', async () => {
    succeed(mockQuestion);
    await client.getRandomQuestion();
    expectCall('GET', '/api/v1/question/random');
  });

  it('createQuestion → POST /api/v1/question', async () => {
    succeed(mockQuestion);
    await client.createQuestion(QuestionType.Truth, 'q?', '123', '456');
    expectCall('POST', '/api/v1/question', { type: QuestionType.Truth, question: 'q?', user_id: '123', server_id: '456' });
  });

  it('updateQuestion → PATCH /api/v1/question/:id', async () => {
    succeed(mockQuestion);
    await client.updateQuestion(1, { question: 'updated?' });
    expectCall('PATCH', '/api/v1/question/1', { question: 'updated?' });
  });

  // ===== CHALLENGE =====

  it('createChallenge → POST /api/v1/challenge', async () => {
    succeed(mockChallenge);
    await client.createChallenge('123', 1, '456', null, 'user', QuestionType.Truth);
    expectCall('POST', '/api/v1/challenge', { user_id: '123', question_id: 1, server_id: '456', channel_id: null, username: 'user', type: QuestionType.Truth });
  });

  it('getChallengeByMessageId → GET /api/v1/challenge/message/:id', async () => {
    succeed(mockChallenge);
    await client.getChallengeByMessageId('msg1');
    expectCall('GET', '/api/v1/challenge/message/msg1');
  });

  it('setChallengeMessageId → PATCH /api/v1/challenge/:id/message', async () => {
    succeed({});
    await client.setChallengeMessageId(1, 'msg1');
    expectCall('PATCH', '/api/v1/challenge/1/message', { message_id: 'msg1' });
  });

  it('skipChallenge → PATCH /api/v1/challenge/:id/skip', async () => {
    succeed(mockChallenge);
    await client.skipChallenge(1);
    expectCall('PATCH', '/api/v1/challenge/1/skip', {});
  });

  // ===== VOTE =====

  it('initVote → POST /api/v1/vote/:challengeId', async () => {
    succeed(mockVote);
    await client.initVote(1);
    expectCall('POST', '/api/v1/vote/1');
  });

  it('getVotes → GET /api/v1/vote/:challengeId', async () => {
    succeed(mockVote);
    await client.getVotes(1);
    expectCall('GET', '/api/v1/vote/1');
  });

  it('recordVoteDone → POST /api/v1/vote/:challengeId/done', async () => {
    succeed(mockVote);
    await client.recordVoteDone(1, '123');
    expectCall('POST', '/api/v1/vote/1/done', { user_id: '123' });
  });

  it('recordVoteFail → POST /api/v1/vote/:challengeId/fail', async () => {
    succeed(mockVote);
    await client.recordVoteFail(1, '123');
    expectCall('POST', '/api/v1/vote/1/fail', { user_id: '123' });
  });

  it('finalizeVote → PATCH /api/v1/vote/:challengeId/finalise', async () => {
    succeed(mockVote);
    await client.finalizeVote(1, 'done');
    expectCall('PATCH', '/api/v1/vote/1/finalise', { result: 'done' });
  });

  // ===== CONFIG =====

  it('getConfig → GET /api/v1/config', async () => {
    succeed(mockConfig);
    await client.getConfig();
    expectCall('GET', '/api/v1/config');
  });

  // ===== STORABLE =====

  it('getStorable → GET /api/v1/storable/:id', async () => {
    succeed(mockStorable);
    await client.getStorable('item1');
    expectCall('GET', '/api/v1/storable/item1');
  });

  it('listStorables → GET /api/v1/storable', async () => {
    succeed([mockStorable]);
    await client.listStorables();
    expectCall('GET', '/api/v1/storable');
  });

  // ===== TRACK =====

  it('trackInteraction → POST /api/v1/track', async () => {
    succeed({});
    await client.trackInteraction('123', '456', '789');
    expectCall('POST', '/api/v1/track', { user_id: '123', server_id: '456', server_owner_id: '789' });
  });

  // ===== ANALYTICS =====

  it('logAnalyticsEvent → POST /api/v1/analytics/event', async () => {
    succeed({ success: true });
    await client.logAnalyticsEvent('command', 'dare', '123', '456');
    expectCall('POST', '/api/v1/analytics/event', {
      interaction_type: 'command',
      interaction_name: 'dare',
      user_id: '123',
      guild_id: '456',
    });
  });
});
