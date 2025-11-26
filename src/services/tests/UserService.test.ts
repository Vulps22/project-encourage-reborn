import { UserService } from '../UserService';
import { DatabaseService } from '../DatabaseService';
import { Logger } from '../../utils';

// Mock Logger
jest.mock('../../utils', () => ({
  Logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock DatabaseService
jest.mock('../DatabaseService');

describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      get: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      query: jest.fn(),
    } as any;

    userService = new UserService(mockDb);
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
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

      mockDb.get.mockResolvedValue(mockUser);

      const result = await userService.getUser('123456789012345678');

      expect(mockDb.get).toHaveBeenCalledWith('core', 'users', { id: BigInt('123456789012345678') });
      expect(result).toEqual(mockUser);
      expect(Logger.debug).toHaveBeenCalledWith('Fetching user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 retrieved successfully');
    });

    it('should return null when user not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await userService.getUser('999999999999999999');

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith('User 999999999999999999 not found');
    });
  });

  describe('setUser', () => {
    it('should create new user when user does not exist', async () => {
      const newUser = {
        id: '123456789012345678',
        username: 'newuser',
        global_level: 0,
        global_level_xp: 0,
        banned_questions: 0,
        rules_accepted: false,
        is_banned: false,
        ban_reason: null,
        vote_count: 0,
        ban_message_id: null,
        delete_date: null,
        created_datetime: new Date(),
      };

      mockDb.get.mockResolvedValue(null);
      mockDb.insert.mockResolvedValue({
        affectedRows: 1,
        insertId: 1,
        rows: [newUser],
      });

      const result = await userService.setUser({ id: '123456789012345678', username: 'newuser' });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 created successfully');
      expect(result).toEqual(newUser);
    });

    it('should update existing user', async () => {
      const existingUser = {
        id: '123456789012345678',
        username: 'olduser',
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

      const updatedUser = { ...existingUser, username: 'newusername' };

      mockDb.get.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(updatedUser);
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      const result = await userService.setUser({ id: '123456789012345678', username: 'newusername' });

      expect(mockDb.update).toHaveBeenCalled();
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 updated successfully');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('banUser', () => {
    it('should ban user with reason', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await userService.banUser('123456789012345678', 'Spam');

      expect(mockDb.update).toHaveBeenCalledWith(
        'core',
        'users',
        {
          is_banned: true,
          ban_reason: 'Spam',
        },
        { id: BigInt('123456789012345678') }
      );
      expect(Logger.debug).toHaveBeenCalledWith('Banning user 123456789012345678 with reason: Spam');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 banned successfully');
    });

    it('should ban user with message ID', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await userService.banUser('123456789012345678', 'Spam', '999888777666555444');

      expect(mockDb.update).toHaveBeenCalledWith(
        'core',
        'users',
        {
          is_banned: true,
          ban_reason: 'Spam',
          ban_message_id: BigInt('999888777666555444'),
        },
        { id: BigInt('123456789012345678') }
      );
    });
  });

  describe('unbanUser', () => {
    it('should unban user and clear ban data', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 1, changedRows: 1 });

      await userService.unbanUser('123456789012345678');

      expect(mockDb.update).toHaveBeenCalledWith(
        'core',
        'users',
        {
          is_banned: false,
          ban_reason: null,
          ban_message_id: null,
        },
        { id: BigInt('123456789012345678') }
      );
      expect(Logger.debug).toHaveBeenCalledWith('Unbanning user 123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('User 123456789012345678 unbanned successfully');
    });
  });

  describe('getUserServerCount', () => {
    it('should return count of servers user is in', async () => {
      mockDb.count.mockResolvedValue(5);

      const result = await userService.getUserServerCount('123456789012345678');

      expect(mockDb.count).toHaveBeenCalledWith('core', 'server_users', { 
        user_id: BigInt('123456789012345678') 
      });
      expect(result).toBe(5);
    });
  });

  describe('getUserBannedServerCount', () => {
    it('should return count of servers user is banned from', async () => {
      mockDb.query.mockResolvedValue([{ count: '3' }]);

      const result = await userService.getUserBannedServerCount('123456789012345678');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        ['123456789012345678']
      );
      expect(result).toBe(3);
    });

    it('should return 0 when user is not banned from any servers', async () => {
      mockDb.query.mockResolvedValue([{ count: '0' }]);

      const result = await userService.getUserBannedServerCount('123456789012345678');

      expect(result).toBe(0);
    });

    it('should return 0 when query returns empty result', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await userService.getUserBannedServerCount('123456789012345678');

      expect(result).toBe(0);
    });
  });
});
