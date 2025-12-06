import { DatabaseService } from '../DatabaseService';
import { DMInteractionError } from '../../errors';
import { UserTrackingService } from '../UserTrackingService';

// Mock DatabaseService
jest.mock('../DatabaseService');

// Mock interaction objects
const createMockInteraction = (userId: string, guildId: string | null, guildName: string = 'Test Server', ownerId: string = '111222333') => ({
  user: { id: userId },
  guildId: guildId,
  guild: guildId ? { name: guildName, ownerId: ownerId } : null
});

describe('UserTrackingService', () => {
  let service: UserTrackingService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Create fresh mocks
    mockDb = new DatabaseService({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test'
    }) as jest.Mocked<DatabaseService>;

    service = new UserTrackingService(mockDb);

    // Reset mocks
    jest.clearAllMocks();
    
    // Clear timers to prevent setInterval from running during tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('trackInteraction', () => {
    it('should throw DMInteractionError when guildId is null', async () => {
      const interaction = createMockInteraction('123456789', null);
      
      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow(DMInteractionError);

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should successfully track interaction with valid user and server', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      await service.trackInteraction(interaction as any);

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT user.track_user_interaction($1, $2, $3)',
        [
          BigInt('123456789'),
          BigInt('987654321'),
          BigInt('111222333')
        ]
      );
    });

    it('should throw error when guild is null despite guildId existing', async () => {
      const interaction = {
        user: { id: '123456789' },
        guildId: '987654321',
        guild: null
      };

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow(DMInteractionError);

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');

      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow('Database tracking failed: Database connection failed');

      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle unknown errors gracefully', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');

      (mockDb.query as jest.Mock).mockRejectedValue('Unknown error type');

      await expect(service.trackInteraction(interaction as any))
        .rejects
        .toThrow('Database tracking failed: Unknown error');
    });

    it('should cache tracking data and skip database calls for same user-server within 1 hour', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      // First call should hit database
      await service.trackInteraction(interaction as any);
      expect(mockDb.query).toHaveBeenCalledTimes(1);

      // Second call within TTL should be cached (no database call)
      await service.trackInteraction(interaction as any);
      expect(mockDb.query).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third call should also be cached
      await service.trackInteraction(interaction as any);
      expect(mockDb.query).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should call database again after cache expires (1 hour)', async () => {
      const interaction = createMockInteraction('123456789', '987654321', 'Test Server', '111222333');

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      // First call
      await service.trackInteraction(interaction as any);
      expect(mockDb.query).toHaveBeenCalledTimes(1);

      // Advance time by 1 hour + 1ms
      jest.advanceTimersByTime(60 * 60 * 1000 + 1);

      // Second call after TTL should hit database again
      await service.trackInteraction(interaction as any);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should track different user-server combinations separately', async () => {
      const interaction1 = createMockInteraction('123456789', '987654321', 'Server 1', '111222333');
      const interaction2 = createMockInteraction('123456789', '111222333', 'Server 2', '444555666');
      const interaction3 = createMockInteraction('999888777', '987654321', 'Server 1', '111222333');

      (mockDb.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

      // Track user1 in server1
      await service.trackInteraction(interaction1 as any);
      expect(mockDb.query).toHaveBeenCalledTimes(1);

      // Track user1 in server2 (different server, should call DB)
      await service.trackInteraction(interaction2 as any);
      expect(mockDb.query).toHaveBeenCalledTimes(2);

      // Track user2 in server1 (different user, should call DB)
      await service.trackInteraction(interaction3 as any);
      expect(mockDb.query).toHaveBeenCalledTimes(3);

      // Track user1 in server1 again (cached, should NOT call DB)
      await service.trackInteraction(interaction1 as any);
      expect(mockDb.query).toHaveBeenCalledTimes(3); // Still 3
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
