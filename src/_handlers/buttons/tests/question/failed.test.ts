import { BotButtonInteraction } from '@vulps22/bot-interactions';
import failed from '../../question/failed';

describe.skip('failed button handler', () => {
  let mockInteraction: jest.Mocked<BotButtonInteraction>;

  beforeEach(() => {
    mockInteraction = {
      params: new Map([['id', '123']]),
      reply: jest.fn().mockResolvedValue(undefined),
      ephemeralReply: jest.fn().mockResolvedValue(undefined),
      user: {
        id: 'user-123',
        username: 'testuser',
      },
    } as unknown as jest.Mocked<BotButtonInteraction>;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('handler properties', () => {
    it('should have correct name', () => {
      expect(failed.name).toBe('failed');
    });

    it('should have execute function', () => {
      expect(failed.execute).toBeDefined();
      expect(typeof failed.execute).toBe('function');
    });
  });

  describe('execute', () => {
    it('should reply with failed confirmation message', async () => {
      await failed.execute(mockInteraction);

      expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Marked as FAILED!');
    });

    it('should read questionId from params', async () => {
      const paramsSpy = jest.spyOn(mockInteraction.params, 'get');

      await failed.execute(mockInteraction);

      expect(paramsSpy).toHaveBeenCalledWith('id');
    });

    it('should handle different question IDs', async () => {
      mockInteraction.params.set('id', '789');

      await failed.execute(mockInteraction);

      expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith('❌ Marked as FAILED!');
    });

    it('should send ephemeral reply', async () => {
      await failed.execute(mockInteraction);

      const callArgs = (mockInteraction.reply as jest.Mock).mock.calls[0][0];
      expect(callArgs.ephemeral).toBe(true);
    });
  });
});
