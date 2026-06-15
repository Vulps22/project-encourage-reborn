import { UserProfileBuilder } from '../UserProfileBuilder';
import { questionService, serverService, userService } from '../../../services';
import { Logger } from '../../utils';

// Mock services
jest.mock('../../../services', () => ({
  userService: {
    getUser: jest.fn(),
    getUserServerCount: jest.fn(),
    getUserBannedServerCount: jest.fn(),
  },
  questionService: {
    getUserQuestionCount: jest.fn(),
    getUserApprovedQuestionCount: jest.fn(),
    getUserBannedQuestionCount: jest.fn(),
  },
  serverService: {
    getUserOwnedServerCount: jest.fn(),
  },
}));

// Mock Logger
jest.mock('../../utils', () => ({
  Logger: {
    debug: jest.fn(),
  },
}));

describe('UserProfileBuilder', () => {
  let userProfileBuilder: UserProfileBuilder;
  const mockUserService = userService as jest.Mocked<typeof userService>;
  const mockQuestionService = questionService as jest.Mocked<typeof questionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userProfileBuilder = new UserProfileBuilder();
  });

  describe('getUserProfile', () => {
    it('should return null when user not found', async () => {
      mockUserService.getUser.mockResolvedValue(null);

      const result = await userProfileBuilder.getUserProfile('123456789012345678');

      expect(result).toBeNull();
      expect(Logger.debug).toHaveBeenCalledWith('Fetching user profile for 123456789012345678');
    });

    it('should return complete user profile when user exists', async () => {
      const mockUser = {
        id: '123456789012345678',
        username: 'testuser',
        global_level: 5,
        global_level_xp: 250,
        banned_questions: 2,
        rules_accepted: true,
        is_banned: false,
        ban_reason: null,
        vote_count: 10,
        ban_message_id: null,
        delete_date: null,
        created_datetime: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockUserService.getUser.mockResolvedValue(mockUser);
      mockQuestionService.getUserQuestionCount.mockResolvedValue(10);
      mockQuestionService.getUserApprovedQuestionCount.mockResolvedValue(8);
      mockQuestionService.getUserBannedQuestionCount.mockResolvedValue(2);
      mockUserService.getUserServerCount.mockResolvedValue(5);
      (serverService.getUserOwnedServerCount as jest.Mock).mockResolvedValue(2);
      mockUserService.getUserBannedServerCount.mockResolvedValue(0);

      const result = await userProfileBuilder.getUserProfile('123456789012345678');

      expect(result).toEqual({
        id: '123456789012345678',
        rulesAccepted: true,
        isBanned: false,
        banReason: null,
        globalLevel: 5,
        globalXP: 250,
        totalQuestions: 10,
        approvedQuestions: 8,
        bannedQuestions: 2,
        totalServers: 5,
        serversOwned: 2,
        serversBanned: 0,
        createdDateTime: mockUser.created_datetime,
        deleteDate: null,
      });

      expect(mockUserService.getUser).toHaveBeenCalledWith('123456789012345678');
      expect(mockQuestionService.getUserQuestionCount).toHaveBeenCalledWith('123456789012345678');
      expect(mockQuestionService.getUserApprovedQuestionCount).toHaveBeenCalledWith('123456789012345678');
      expect(mockQuestionService.getUserBannedQuestionCount).toHaveBeenCalledWith('123456789012345678');
      expect(mockUserService.getUserServerCount).toHaveBeenCalledWith('123456789012345678');
      expect(mockUserService.getUserBannedServerCount).toHaveBeenCalledWith('123456789012345678');
      expect(Logger.debug).toHaveBeenCalledWith('User profile for 123456789012345678 retrieved successfully');
    });

    it('should handle banned user correctly', async () => {
      const mockUser = {
        id: '123456789012345678',
        username: 'banneduser',
        global_level: 0,
        global_level_xp: 0,
        banned_questions: 5,
        rules_accepted: true,
        is_banned: true,
        ban_reason: 'Spam',
        vote_count: 0,
        ban_message_id: '999888777666555444',
        delete_date: null,
        created_datetime: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockUserService.getUser.mockResolvedValue(mockUser);
      mockQuestionService.getUserQuestionCount.mockResolvedValue(5);
      mockQuestionService.getUserApprovedQuestionCount.mockResolvedValue(0);
      mockQuestionService.getUserBannedQuestionCount.mockResolvedValue(5);
      mockUserService.getUserServerCount.mockResolvedValue(0);
      (serverService.getUserOwnedServerCount as jest.Mock).mockResolvedValue(0);
      mockUserService.getUserBannedServerCount.mockResolvedValue(3);

      const result = await userProfileBuilder.getUserProfile('123456789012345678');

      expect(result?.isBanned).toBe(true);
      expect(result?.banReason).toBe('Spam');
      expect(result?.bannedQuestions).toBe(5);
      expect(result?.approvedQuestions).toBe(0);
    });

    it('should handle user with no questions', async () => {
      const mockUser = {
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
        created_datetime: new Date('2024-01-01T00:00:00.000Z'),
      };

      mockUserService.getUser.mockResolvedValue(mockUser);
      mockQuestionService.getUserQuestionCount.mockResolvedValue(0);
      mockQuestionService.getUserApprovedQuestionCount.mockResolvedValue(0);
      mockQuestionService.getUserBannedQuestionCount.mockResolvedValue(0);
      mockUserService.getUserServerCount.mockResolvedValue(3);
      (serverService.getUserOwnedServerCount as jest.Mock).mockResolvedValue(1);
      mockUserService.getUserBannedServerCount.mockResolvedValue(0);

      const result = await userProfileBuilder.getUserProfile('123456789012345678');

      expect(result?.totalQuestions).toBe(0);
      expect(result?.approvedQuestions).toBe(0);
      expect(result?.bannedQuestions).toBe(0);
    });
  });
});
