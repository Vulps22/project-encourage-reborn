import { QuestionService } from '../QuestionService';
import { DatabaseService, MutationResult } from '../DatabaseService';
import { QuestionType } from '../../types';

// Mock DatabaseService
jest.mock('../DatabaseService');

describe('QuestionService', () => {
  let questionService: QuestionService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock DatabaseService
    mockDb = {
      insert: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      query: jest.fn(),
    } as any;

    questionService = new QuestionService(mockDb);
  });

  describe('createQuestion', () => {
    const validUserId = '123456789012345678';
    const validServerId = '987654321098765432';

    it('should successfully create a truth question', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 42,
        rows: [
          {
            id: 42,
            type: 'truth',
            question: 'What is your biggest fear?',
            user_id: validUserId,
            server_id: validServerId,
            is_approved: false,
            is_banned: false,
            created: new Date(),
          },
        ],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      const result = await questionService.createQuestion(
        QuestionType.Truth,
        'What is your biggest fear?',
        validUserId,
        validServerId
      );

      expect(mockDb.insert).toHaveBeenCalledWith('core', 'questions', {
        type: 'truth',
        question: 'What is your biggest fear?',
        user_id: validUserId,
        server_id: validServerId,
        is_approved: false,
        is_banned: false,
      });

      expect(typeof result).not.toBe('string');
      if (typeof result !== 'string') {
        expect(result).toEqual(mockResult.rows![0]);
        expect(result.id).toBe(42);
        expect(result.type).toBe('truth');
      }
    });

    it('should successfully create a dare question', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 99,
        rows: [
          {
            id: 99,
            type: 'dare',
            question: 'Do 20 pushups',
            user_id: validUserId,
            server_id: validServerId,
            is_approved: false,
            is_banned: false,
            created: new Date(),
          },
        ],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      const result = await questionService.createQuestion(
        QuestionType.Dare,
        'Do 20 pushups',
        validUserId,
        validServerId
      );

      expect(typeof result).not.toBe('string');
      if (typeof result !== 'string') {
        expect(result.type).toBe('dare');
        expect(result.question).toBe('Do 20 pushups');
      }
    });

    it('should reject question shorter than 5 characters', async () => {
      const result = await questionService.createQuestion(
        QuestionType.Truth,
        'Test',
        validUserId,
        validServerId
      );

      expect(result).toBe('Question must be at least 5 characters long');
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should reject question longer than 500 characters', async () => {
      const longQuestion = 'a'.repeat(501);

      const result = await questionService.createQuestion(
        QuestionType.Truth,
        longQuestion,
        validUserId,
        validServerId
      );

      expect(result).toBe('Question must be 500 characters or less');
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should accept question exactly 5 characters', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 1,
        rows: [{ id: 1, type: 'truth', question: 'Test?', user_id: validUserId, server_id: validServerId }],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Test?', validUserId, validServerId)
      ).resolves.not.toThrow();
    });

    it('should accept question exactly 500 characters', async () => {
      const maxLengthQuestion = 'a'.repeat(500);
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 1,
        rows: [{ id: 1, type: 'truth', question: maxLengthQuestion, user_id: validUserId, server_id: validServerId }],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await expect(
        questionService.createQuestion(QuestionType.Truth, maxLengthQuestion, validUserId, validServerId)
      ).resolves.not.toThrow();
    });

    it('should throw error when insertId is missing', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: undefined,
        rows: [],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Valid question', validUserId, validServerId)
      ).rejects.toThrow('Failed to insert question');
    });

    it('should throw error when rows array is empty', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 42,
        rows: [],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Valid question', validUserId, validServerId)
      ).rejects.toThrow('No question returned after insert');
    });

    it('should throw error when rows is undefined', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 42,
        rows: undefined,
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Valid question', validUserId, validServerId)
      ).rejects.toThrow('No question returned after insert');
    });

    it('should handle database errors', async () => {
      mockDb.insert.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Valid question', validUserId, validServerId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should set is_approved to false by default', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 1,
        rows: [{ id: 1, is_approved: false }],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await questionService.createQuestion(QuestionType.Truth, 'Test question', validUserId, validServerId);

      expect(mockDb.insert).toHaveBeenCalledWith(
        'core',
        'questions',
        expect.objectContaining({
          is_approved: false,
        })
      );
    });

    it('should set is_banned to false by default', async () => {
      const mockResult: MutationResult = {
        affectedRows: 1,
        insertId: 1,
        rows: [{ id: 1, is_banned: false }],
      };

      mockDb.insert.mockResolvedValue(mockResult);

      await questionService.createQuestion(QuestionType.Truth, 'Test question', validUserId, validServerId);

      expect(mockDb.insert).toHaveBeenCalledWith(
        'core',
        'questions',
        expect.objectContaining({
          is_banned: false,
        })
      );
    });
  });

  describe('getQuestionById', () => {
    it('should return question when found', async () => {
      const mockQuestion = {
        id: 123,
        type: 'truth',
        question: 'Test question?',
        user_id: '123456789012345678',
        server_id: '987654321098765432',
        is_approved: false,
        is_banned: false,
      };

      mockDb.get.mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionById(123);

      expect(mockDb.get).toHaveBeenCalledWith('core', 'questions', { id: BigInt(123) });
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when question not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await questionService.getQuestionById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserQuestionCount', () => {
    it('should return count of user questions', async () => {
      mockDb.count.mockResolvedValue(5);

      const result = await questionService.getUserQuestionCount('123456789012345678');

      expect(mockDb.count).toHaveBeenCalledWith('core', 'questions', { 
        user_id: BigInt('123456789012345678') 
      });
      expect(result).toBe(5);
    });

    it('should return 0 when user has no questions', async () => {
      mockDb.count.mockResolvedValue(0);

      const result = await questionService.getUserQuestionCount('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('getUserApprovedQuestionCount', () => {
    it('should return count of approved questions', async () => {
      mockDb.count.mockResolvedValue(3);

      const result = await questionService.getUserApprovedQuestionCount('123456789012345678');

      expect(mockDb.count).toHaveBeenCalledWith('core', 'questions', { 
        user_id: BigInt('123456789012345678'),
        is_approved: true,
        is_banned: false
      });
      expect(result).toBe(3);
    });
  });

  describe('getUserBannedQuestionCount', () => {
    it('should return count of banned questions', async () => {
      mockDb.count.mockResolvedValue(2);

      const result = await questionService.getUserBannedQuestionCount('123456789012345678');

      expect(mockDb.count).toHaveBeenCalledWith('core', 'questions', { 
        user_id: BigInt('123456789012345678'),
        is_banned: true 
      });
      expect(result).toBe(2);
    });
  });

  describe('banAllUserQuestions', () => {
    it('should ban all non-banned questions from a user', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 3, changedRows: 3 });

      const result = await questionService.banAllUserQuestions('123456789012345678', '999888777666555444');

      expect(mockDb.update).toHaveBeenCalledWith('core', 'questions', {
        is_banned: true,
        banned_by: BigInt('999888777666555444'),
        ban_reason: 'User Banned',
        datetime_banned: expect.any(Date)
      }, {
        user_id: BigInt('123456789012345678'),
        is_banned: false
      });
      expect(result).toBe(3);
    });

    it('should return 0 when user has no unbanned questions', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 0, changedRows: 0 });

      const result = await questionService.banAllUserQuestions('123456789012345678', '999888777666555444');

      expect(result).toBe(0);
    });
  });

  describe('unbanUserBannedQuestions', () => {
    it('should unban questions banned with "User Banned" reason', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 2, changedRows: 2 });

      const result = await questionService.unbanUserBannedQuestions('123456789012345678');

      expect(mockDb.update).toHaveBeenCalledWith('core', 'questions', {
        is_banned: false,
        banned_by: null,
        ban_reason: null,
        datetime_banned: null
      }, {
        user_id: BigInt('123456789012345678'),
        is_banned: true,
        ban_reason: 'User Banned'
      });
      expect(result).toBe(2);
    });

    it('should return 0 when no questions match criteria', async () => {
      mockDb.update.mockResolvedValue({ affectedRows: 0, changedRows: 0 });

      const result = await questionService.unbanUserBannedQuestions('123456789012345678');

      expect(result).toBe(0);
    });
  });

  describe('getRandomQuestion', () => {
    it('should return a random approved truth question', async () => {
      const mockQuestion = {
        id: 42,
        type: QuestionType.Truth,
        question: 'What is your biggest secret?',
        user_id: '123456789012345678',
        server_id: '987654321098765432',
        is_approved: true,
        approved_by: '111222333444555666',
        datetime_approved: new Date(),
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        datetime_banned: null,
        created: new Date(),
        message_id: null,
        is_deleted: false,
        datetime_deleted: null,
      };

      mockDb.query.mockResolvedValue([mockQuestion]);

      const result = await questionService.getRandomQuestion(QuestionType.Truth);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM "core"."questions"'),
        [QuestionType.Truth]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('is_approved = true'),
        [QuestionType.Truth]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('is_banned = false'),
        [QuestionType.Truth]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [QuestionType.Truth]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY RANDOM()'),
        [QuestionType.Truth]
      );
      expect(result).toEqual(mockQuestion);
    });

    it('should return a random approved dare question', async () => {
      const mockQuestion = {
        id: 99,
        type: QuestionType.Dare,
        question: 'Do 20 pushups',
        user_id: '123456789012345678',
        server_id: '987654321098765432',
        is_approved: true,
        approved_by: '111222333444555666',
        datetime_approved: new Date(),
        is_banned: false,
        ban_reason: null,
        banned_by: null,
        datetime_banned: null,
        created: new Date(),
        message_id: null,
        is_deleted: false,
        datetime_deleted: null,
      };

      mockDb.query.mockResolvedValue([mockQuestion]);

      const result = await questionService.getRandomQuestion(QuestionType.Dare);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        [QuestionType.Dare]
      );
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when no approved questions available', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await questionService.getRandomQuestion(QuestionType.Truth);

      expect(result).toBeNull();
    });

    it('should only return approved, non-banned, non-deleted questions', async () => {
      mockDb.query.mockResolvedValue([]);

      await questionService.getRandomQuestion(QuestionType.Truth);

      const callArgs = mockDb.query.mock.calls[0];
      const sql = callArgs[0] as string;

      expect(sql).toContain('is_approved = true');
      expect(sql).toContain('is_banned = false');
      expect(sql).toContain('is_deleted = false');
    });
  });
});

