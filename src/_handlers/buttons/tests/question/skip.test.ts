import { BotButtonInteraction } from '../../../../structures';
import skip from '../../question/skip';

describe.skip('skip button handler', () => {
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
      expect(skip.name).toBe('skip');
    });

    it('should have execute function', () => {
      expect(skip.execute).toBeDefined();
      expect(typeof skip.execute).toBe('function');
    });
  });

  describe('execute', () => {
    it('should reply with skip confirmation message', async () => {
      await skip.execute(mockInteraction);

      expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith('⏭️ Skipped!');
    });

    it('should read questionId from params', async () => {
      const paramsSpy = jest.spyOn(mockInteraction.params, 'get');

      await skip.execute(mockInteraction);

      expect(paramsSpy).toHaveBeenCalledWith('id');
    });

    it('should handle different question IDs', async () => {
      mockInteraction.params.set('id', '999');

      await skip.execute(mockInteraction);

      expect(mockInteraction.ephemeralReply).toHaveBeenCalledWith('⏭️ Skipped!');
    });

    it('should send ephemeral reply', async () => {
      await skip.execute(mockInteraction);

      const callArgs = (mockInteraction.reply as jest.Mock).mock.calls[0][0];
      expect(callArgs.ephemeral).toBe(true);
    });
  });
});
