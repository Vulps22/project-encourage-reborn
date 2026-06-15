import { QuestionService } from '../QuestionService';
import { DatabaseClient } from '../../bot/services/DatabaseClient';
import { QuestionType } from '@vulps22/project-encourage-types';

jest.mock('../../bot/services/DatabaseClient');

describe('QuestionService', () => {
  let questionService: QuestionService;
  let mockDb: jest.Mocked<DatabaseClient>;

  const validUserId = '123456789012345678';
  const validServerId = '987654321098765432';

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getQuestion: jest.fn(),
      getRandomQuestion: jest.fn(),
      createQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      approveQuestion: jest.fn(),
      banQuestion: jest.fn(),
      countQuestionsByUser: jest.fn(),
      countQuestionsByServer: jest.fn(),
      banUserQuestions: jest.fn(),
      unbanUserQuestions: jest.fn(),
    } as any;

    questionService = new QuestionService(mockDb);
  });

  describe('createQuestion', () => {
    it('should successfully create a truth question', async () => {
      const mockQuestion = {
        id: 42,
        type: 'truth',
        question: 'What is your biggest fear?',
        user_id: validUserId,
        server_id: validServerId,
        is_approved: false,
        is_banned: false,
        created: new Date(),
      };

      mockDb.createQuestion.mockResolvedValue(mockQuestion as any);

      const result = await questionService.createQuestion(
        QuestionType.Truth,
        'What is your biggest fear?',
        validUserId,
        validServerId
      );

      expect(mockDb.createQuestion).toHaveBeenCalledWith(
        QuestionType.Truth,
        'What is your biggest fear?',
        validUserId,
        validServerId
      );
      expect(typeof result).not.toBe('string');
      if (typeof result !== 'string') {
        expect(result.id).toBe(42);
        expect(result.type).toBe('truth');
      }
    });

    it('should successfully create a dare question', async () => {
      const mockQuestion = {
        id: 99,
        type: 'dare',
        question: 'Do 20 pushups',
        user_id: validUserId,
        server_id: validServerId,
        is_approved: false,
        is_banned: false,
        created: new Date(),
      };

      mockDb.createQuestion.mockResolvedValue(mockQuestion as any);

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
      expect(mockDb.createQuestion).not.toHaveBeenCalled();
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
      expect(mockDb.createQuestion).not.toHaveBeenCalled();
    });

    it('should accept question exactly 5 characters', async () => {
      mockDb.createQuestion.mockResolvedValue({ id: 1, type: 'truth', question: 'Test?' } as any);

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Test?', validUserId, validServerId)
      ).resolves.not.toThrow();
    });

    it('should accept question exactly 500 characters', async () => {
      const maxLengthQuestion = 'a'.repeat(500);
      mockDb.createQuestion.mockResolvedValue({ id: 1, type: 'truth', question: maxLengthQuestion } as any);

      await expect(
        questionService.createQuestion(QuestionType.Truth, maxLengthQuestion, validUserId, validServerId)
      ).resolves.not.toThrow();
    });

    it('should propagate DS errors', async () => {
      mockDb.createQuestion.mockRejectedValue(new Error('DS connection failed'));

      await expect(
        questionService.createQuestion(QuestionType.Truth, 'Valid question', validUserId, validServerId)
      ).rejects.toThrow('DS connection failed');
    });
  });

  describe('getQuestionById', () => {
    it('should return question when found', async () => {
      const mockQuestion = {
        id: 123,
        type: 'truth',
        question: 'Test question?',
        user_id: validUserId,
        server_id: validServerId,
        is_approved: false,
        is_banned: false,
      };

      mockDb.getQuestion.mockResolvedValue(mockQuestion as any);

      const result = await questionService.getQuestionById(123);

      expect(mockDb.getQuestion).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when question not found', async () => {
      mockDb.getQuestion.mockResolvedValue(null);

      const result = await questionService.getQuestionById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserQuestionCount', () => {
    it('should return count of user questions', async () => {
      mockDb.countQuestionsByUser.mockResolvedValue(5);

      const result = await questionService.getUserQuestionCount(validUserId);

      expect(mockDb.countQuestionsByUser).toHaveBeenCalledWith(validUserId);
      expect(result).toBe(5);
    });
  });

  describe('getUserApprovedQuestionCount', () => {
    it('should return count of approved questions', async () => {
      mockDb.countQuestionsByUser.mockResolvedValue(3);

      const result = await questionService.getUserApprovedQuestionCount(validUserId);

      expect(mockDb.countQuestionsByUser).toHaveBeenCalledWith(validUserId, true, false);
      expect(result).toBe(3);
    });
  });

  describe('getUserBannedQuestionCount', () => {
    it('should return count of banned questions', async () => {
      mockDb.countQuestionsByUser.mockResolvedValue(2);

      const result = await questionService.getUserBannedQuestionCount(validUserId);

      expect(mockDb.countQuestionsByUser).toHaveBeenCalledWith(validUserId, undefined, true);
      expect(result).toBe(2);
    });
  });

  describe('banAllUserQuestions', () => {
    it('should ban all non-banned questions from a user', async () => {
      mockDb.banUserQuestions.mockResolvedValue(3);

      const result = await questionService.banAllUserQuestions(validUserId, '999888777666555444');

      expect(mockDb.banUserQuestions).toHaveBeenCalledWith(validUserId, '999888777666555444');
      expect(result).toBe(3);
    });

    it('should return 0 when user has no unbanned questions', async () => {
      mockDb.banUserQuestions.mockResolvedValue(0);

      const result = await questionService.banAllUserQuestions(validUserId, '999888777666555444');

      expect(result).toBe(0);
    });
  });

  describe('unbanUserBannedQuestions', () => {
    it('should unban questions banned with "User Banned" reason', async () => {
      mockDb.unbanUserQuestions.mockResolvedValue(2);

      const result = await questionService.unbanUserBannedQuestions(validUserId);

      expect(mockDb.unbanUserQuestions).toHaveBeenCalledWith(validUserId);
      expect(result).toBe(2);
    });

    it('should return 0 when no questions match criteria', async () => {
      mockDb.unbanUserQuestions.mockResolvedValue(0);

      const result = await questionService.unbanUserBannedQuestions(validUserId);

      expect(result).toBe(0);
    });
  });

  describe('getRandomQuestion', () => {
    it('should return a random question when available', async () => {
      const mockQuestion = {
        id: 42,
        type: QuestionType.Truth,
        question: 'What is your biggest secret?',
        is_approved: true,
        is_banned: false,
      };

      mockDb.getRandomQuestion.mockResolvedValue(mockQuestion as any);

      const result = await questionService.getRandomQuestion(QuestionType.Truth);

      expect(mockDb.getRandomQuestion).toHaveBeenCalledWith(QuestionType.Truth);
      expect(result).toEqual(mockQuestion);
    });

    it('should return null when no approved questions available', async () => {
      mockDb.getRandomQuestion.mockResolvedValue(null);

      const result = await questionService.getRandomQuestion(QuestionType.Truth);

      expect(result).toBeNull();
    });
  });
});
