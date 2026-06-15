import { UserService } from '../UserService';
import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { Logger } from '../../bot/utils';

jest.mock('../../bot/utils', () => ({
  Logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../bot/services/DatabaseClient');

describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<DatabaseClient>;

  const mockUser = {
    id: '123456789012345678',
    username: 'testuser',
    global_level: 5,
    global_level_xp: 250,
    banned_questions: 0,
    rules_accepted: true,
    is_banned: false,
    ban_reason: null,
    vote_count: 10,
    ban_message_id: null,
    delete_date: null,
    created_datetime: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getUser: jest.fn(),
      upsertUser: jest.fn(),
      banUser: jest.fn(),
      unbanUser: jest.fn(),
      getUserServerCount: jest.fn(),
      getUserBannedServerCount: jest.fn(),
    } as any;

    userService = new UserService(mockDb);
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      mockDb.getUser.mockResolvedValue(mockUser);

      const result = await userService.getUser('123456789012345678');

      expect(mockDb.getUser).toHaveBeenCalledWith('123456789012345678');
      expect(result).toEqual(mockUser);
      expect(Logger.debug).toHaveBeenCalledWith('Fetching user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 retrieved successfully');
    });

    it('should return null when user not found', async () => {
      mockDb.getUser.mockResolvedValue(null);

      const result = await userService.getUser('999999999999999999');

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith('User 999999999999999999 not found');
    });
  });

  describe('setUser', () => {
    it('should upsert user and return result', async () => {
      mockDb.upsertUser.mockResolvedValue(mockUser);

      const result = await userService.setUser({ id: '123456789012345678', username: 'testuser' });

      expect(mockDb.upsertUser).toHaveBeenCalledWith('123456789012345678', 'testuser');
      expect(result).toEqual(mockUser);
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 upserted successfully');
    });

    it('should use empty string username when not provided', async () => {
      mockDb.upsertUser.mockResolvedValue(mockUser);

      await userService.setUser({ id: '123456789012345678' });

      expect(mockDb.upsertUser).toHaveBeenCalledWith('123456789012345678', '');
    });
  });

  describe('banUser', () => {
    it('should ban user with reason', async () => {
      mockDb.banUser.mockResolvedValue(mockUser);

      await userService.banUser('123456789012345678', 'Spam');

      expect(mockDb.banUser).toHaveBeenCalledWith('123456789012345678', 'Spam', undefined);
      expect(Logger.debug).toHaveBeenCalledWith('Banning user 123456789012345678 with reason: Spam');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 banned successfully');
    });

    it('should ban user with message ID', async () => {
      mockDb.banUser.mockResolvedValue(mockUser);

      await userService.banUser('123456789012345678', 'Spam', '999888777666555444');

      expect(mockDb.banUser).toHaveBeenCalledWith('123456789012345678', 'Spam', '999888777666555444');
    });
  });

  describe('unbanUser', () => {
    it('should unban user', async () => {
      mockDb.unbanUser.mockResolvedValue(mockUser);

      await userService.unbanUser('123456789012345678');

      expect(mockDb.unbanUser).toHaveBeenCalledWith('123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('Unbanning user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 unbanned successfully');
    });
  });

  describe('isUserBanned', () => {
    it('should return ban reason if user is banned', async () => {
      mockDb.getUser.mockResolvedValue({ ...mockUser, is_banned: true, ban_reason: 'Harassment' });

      const result = await userService.isUserBanned('123456789012345678');

      expect(result).toBe('Harassment');
    });

    it('should return default reason if banned with no reason', async () => {
      mockDb.getUser.mockResolvedValue({ ...mockUser, is_banned: true, ban_reason: null });

      const result = await userService.isUserBanned('123456789012345678');

      expect(result).toBe('No reason provided');
    });

    it('should return false if user is not banned', async () => {
      mockDb.getUser.mockResolvedValue({ ...mockUser, is_banned: false });

      const result = await userService.isUserBanned('123456789012345678');

      expect(result).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      mockDb.getUser.mockResolvedValue(null);

      const result = await userService.isUserBanned('123456789012345678');

      expect(result).toBe(false);
    });
  });

  describe('getUserServerCount', () => {
    it('should return count of servers user is in', async () => {
      mockDb.getUserServerCount.mockResolvedValue(5);

      const result = await userService.getUserServerCount('123456789012345678');

      expect(mockDb.getUserServerCount).toHaveBeenCalledWith('123456789012345678');
      expect(result).toBe(5);
    });
  });

  describe('getUserBannedServerCount', () => {
    it('should return count of banned servers', async () => {
      mockDb.getUserBannedServerCount.mockResolvedValue(3);

      const result = await userService.getUserBannedServerCount('123456789012345678');

      expect(mockDb.getUserBannedServerCount).toHaveBeenCalledWith('123456789012345678');
      expect(result).toBe(3);
    });
  });
});
