import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { DMInteractionError } from '../../bot/errors';
import { UserTrackingService } from '../UserTrackingService';

jest.mock('../../bot/services/DatabaseClient');
jest.mock('../../bot/utils', () => ({
  Logger: {
    debug: jest.fn(),
    error: jest.fn(),
  }
}));

const createMockInteraction = (
  userId: string,
  guildId: string | null,
  guildName: string = 'Test Server',
  ownerId: string = '111222333'
) => ({
  user: { id: userId },
  guildId: guildId,
  guild: guildId ? { name: guildName, ownerId: ownerId } : null
});

describe('UserTrackingService', () => {
  let service: UserTrackingService;
  let mockDb: jest.Mocked<DatabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockDb = {
      trackInteraction: jest.fn(),
    } as any;

    service = new UserTrackingService(mockDb);
  });

  afterEach(() => {
    service.stopCleanup();
    jest.useRealTimers();
  });

  describe('trackInteraction', () => {
    it('should throw DMInteractionError when guildId is null', async () => {
      const interaction = createMockInteraction('123456789', null);

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow(DMInteractionError);

      expect(mockDb.trackInteraction).not.toHaveBeenCalled();
    });

    it('should throw DMInteractionError when guild is null despite guildId existing', async () => {
      const interaction = {
        user: { id: '123456789' },
        guildId: '987654321',
        guild: null
      };

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow(DMInteractionError);

      expect(mockDb.trackInteraction).not.toHaveBeenCalled();
    });

    it('should call DS trackInteraction with correct args', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');
      mockDb.trackInteraction.mockResolvedValue(undefined);

      await service.trackInteraction(interaction as any);

      expect(mockDb.trackInteraction).toHaveBeenCalledWith('123456789', '987654321', '111222333');
    });

    it('should throw wrapped error when DS call fails', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');
      mockDb.trackInteraction.mockRejectedValue(new Error('DS connection failed'));

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow('Database tracking failed: DS connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');
      mockDb.trackInteraction.mockRejectedValue('Unknown error type');

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow('Database tracking failed: Unknown error');
    });

    it('should cache tracking data and skip DS calls for same user-server within 1 hour', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');
      mockDb.trackInteraction.mockResolvedValue(undefined);

      // First call should hit DS
      await service.trackInteraction(interaction as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(1);

      // Second call within TTL should be cached
      await service.trackInteraction(interaction as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(1);

      // Third call should also be cached
      await service.trackInteraction(interaction as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(1);
    });

    it('should call DS again after cache expires (1 hour)', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');
      mockDb.trackInteraction.mockResolvedValue(undefined);

      await service.trackInteraction(interaction as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(60 * 60 * 1000 + 1);

      await service.trackInteraction(interaction as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(2);
    });

    it('should track different user-server combinations separately', async () => {
      const interaction1 = createMockInteraction('123456789', '987654321', 'Server 1', '111222333');
      const interaction2 = createMockInteraction('123456789', '111222333', 'Server 2', '444555666');
      const interaction3 = createMockInteraction('999888777', '987654321', 'Server 1', '111222333');
      mockDb.trackInteraction.mockResolvedValue(undefined);

      await service.trackInteraction(interaction1 as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(1);

      await service.trackInteraction(interaction2 as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(2);

      await service.trackInteraction(interaction3 as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(3);

      // Cached — should NOT call DS
      await service.trackInteraction(interaction1 as any);
      expect(mockDb.trackInteraction).toHaveBeenCalledTimes(3);
    });
  });

  describe('DMInteractionError', () => {
    it('should have correct error message', () => {
      const error = new DMInteractionError();
      expect(error.message).toBe("I'm sorry, DM interactions are not currently supported");
      expect(error.name).toBe('DMInteractionError');
    });

    it('should be instanceof Error', () => {
      const error = new DMInteractionError();
      expect(error).toBeInstanceOf(Error);
    });
  });
});
