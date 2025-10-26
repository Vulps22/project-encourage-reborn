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
});
