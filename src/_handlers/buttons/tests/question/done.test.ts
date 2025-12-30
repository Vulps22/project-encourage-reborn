import { BotButtonInteraction } from '../../../../structures';
import done from '../../question/done';

describe('done button handler', () => {
  let mockInteraction: jest.Mocked<BotButtonInteraction>;

  beforeEach(() => {
    mockInteraction = {
      params: new Map([['id', '123']]),
      reply: jest.fn().mockResolvedValue(undefined),
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
      expect(done.name).toBe('done');
    });

    it('should have execute function', () => {
      expect(done.execute).toBeDefined();
      expect(typeof done.execute).toBe('function');
    });
  });

  describe('execute', () => {
    it('should reply with done confirmation message', async () => {
      await done.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '✅ Marked as DONE!',
        ephemeral: true,
      });
    });

    it('should read questionId from params', async () => {
      const paramsSpy = jest.spyOn(mockInteraction.params, 'get');

      await done.execute(mockInteraction);

      expect(paramsSpy).toHaveBeenCalledWith('id');
    });

    it('should handle different question IDs', async () => {
      mockInteraction.params.set('id', '456');

      await done.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '✅ Marked as DONE!',
        ephemeral: true,
      });
    });

    it('should send ephemeral reply', async () => {
      await done.execute(mockInteraction);

      const callArgs = (mockInteraction.reply as jest.Mock).mock.calls[0][0];
      expect(callArgs.ephemeral).toBe(true);
    });
  });
});
