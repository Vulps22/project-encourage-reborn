import { ModerationClient } from '../ModerationClient';
import { TargetType } from '@vulps22/project-encourage-types';

const BASE  = 'http://ms:4001';
const TOKEN = 'test-ms-token';

describe('ModerationClient', () => {
  let client: ModerationClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new ModerationClient(BASE, TOKEN);
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

  function expectPost(path: string, body: unknown) {
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}${path}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
        headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }),
      })
    );
  }

  // ===== QUESTION =====

  it('submitQuestion → POST /api/v1/question', async () => {
    succeed({ success: true, questionId: 1 });
    await client.submitQuestion(1);
    expectPost('/api/v1/question', { questionId: 1 });
  });

  // ===== REPORT =====

  it('submitReport → POST /api/v1/report', async () => {
    succeed({ success: true, reportId: 42 });
    await client.submitReport('123', '456', TargetType.User, '789', 'bad content', 'spam');
    expectPost('/api/v1/report', {
      senderId:   '123',
      offenderId: '456',
      content:    'bad content',
      type:       TargetType.User,
      serverId:   '789',
      reason:     'spam',
    });
  });

  // ===== SERVER =====

  it('notifyServerJoined → POST /api/v1/server', async () => {
    succeed({ success: true });
    await client.notifyServerJoined('789', 'My Server', '123');
    expectPost('/api/v1/server', { id: '789', name: 'My Server', user_id: '123' });
  });
});
