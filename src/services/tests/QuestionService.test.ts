import { QuestionService } from '../QuestionService';
import { DatabaseService } from '../DatabaseService';
import { dsClient, DSError } from '../../client';
import { Question } from '../../interface';
import { QuestionType } from '../../types';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

jest.mock('../DatabaseService');

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
    id: 42,
    type: QuestionType.Truth,
    question: 'What is your biggest fear?',
    user_id: '123456789012345678',
    server_id: '987654321098765432',
    is_approved: false,
    approved_by: null,
    datetime_approved: null,
    is_banned: false,
    ban_reason: null,
    banned_by: null,
    datetime_banned: null,
    is_deleted: false,
    datetime_deleted: null,
    message_id: null,
    created: new Date(),
    ...overrides,
});

describe('QuestionService', () => {
    let questionService: QuestionService;
    let mockDb: jest.Mocked<DatabaseService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = { count: jest.fn(), update: jest.fn() } as any;
        questionService = new QuestionService(mockDb);
    });

    describe('getQuestionById', () => {
        it('should return question when found', async () => {
            const question = makeQuestion();
            (dsClient.get as jest.Mock).mockResolvedValue(question);

            const result = await questionService.getQuestionById(42);

            expect(dsClient.get).toHaveBeenCalledWith('/question/:id', { id: 42 });
            expect(result).toEqual(question);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'Not found'));

            const result = await questionService.getQuestionById(999);

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Internal error'));

            await expect(questionService.getQuestionById(42)).rejects.toThrow('Internal error');
        });
    });

    describe('getRandomQuestion', () => {
        it('should return a random question for the given type', async () => {
            const question = makeQuestion({ type: QuestionType.Truth });
            (dsClient.get as jest.Mock).mockResolvedValue(question);

            const result = await questionService.getRandomQuestion(QuestionType.Truth);

            expect(dsClient.get).toHaveBeenCalledWith('/question/random', undefined, { type: QuestionType.Truth });
            expect(result).toEqual(question);
        });

        it('should return null on 404', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(404, 'No questions available'));

            const result = await questionService.getRandomQuestion(QuestionType.Dare);

            expect(result).toBeNull();
        });

        it('should rethrow non-404 errors', async () => {
            (dsClient.get as jest.Mock).mockRejectedValue(new DSError(500, 'Server error'));

            await expect(questionService.getRandomQuestion(QuestionType.Truth)).rejects.toThrow('Server error');
        });
    });

    describe('createQuestion', () => {
        it('should post and return the created question', async () => {
            const question = makeQuestion();
            (dsClient.post as jest.Mock).mockResolvedValue(question);

            const result = await questionService.createQuestion(
                QuestionType.Truth,
                'What is your biggest fear?',
                '123456789012345678',
                '987654321098765432'
            );

            expect(dsClient.post).toHaveBeenCalledWith('/question', undefined, {
                type: QuestionType.Truth,
                question: 'What is your biggest fear?',
                user_id: '123456789012345678',
                server_id: '987654321098765432',
            });
            expect(result).toEqual(question);
        });

        it('should return error string when question is too short', async () => {
            const result = await questionService.createQuestion(QuestionType.Truth, 'Test', '123', '456');

            expect(result).toBe('Question must be at least 5 characters long');
            expect(dsClient.post).not.toHaveBeenCalled();
        });

        it('should return error string when question is too long', async () => {
            const result = await questionService.createQuestion(QuestionType.Truth, 'a'.repeat(501), '123', '456');

            expect(result).toBe('Question must be 500 characters or less');
            expect(dsClient.post).not.toHaveBeenCalled();
        });

        it('should accept question exactly 5 characters', async () => {
            (dsClient.post as jest.Mock).mockResolvedValue(makeQuestion({ question: 'Test?' }));

            const result = await questionService.createQuestion(QuestionType.Truth, 'Test?', '123', '456');

            expect(typeof result).not.toBe('string');
        });

        it('should accept question exactly 500 characters', async () => {
            const longQ = 'a'.repeat(500);
            (dsClient.post as jest.Mock).mockResolvedValue(makeQuestion({ question: longQ }));

            const result = await questionService.createQuestion(QuestionType.Truth, longQ, '123', '456');

            expect(typeof result).not.toBe('string');
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.post as jest.Mock).mockRejectedValue(new DSError(500, 'Failed to create question'));

            await expect(
                questionService.createQuestion(QuestionType.Truth, 'Valid question text', '123', '456')
            ).rejects.toThrow('Failed to create question');
        });
    });

    describe('updateQuestion', () => {
        it('should patch the question with the given data', async () => {
            (dsClient.patch as jest.Mock).mockResolvedValue(makeQuestion());

            await questionService.updateQuestion(42, { question: 'Updated question?' });

            expect(dsClient.patch).toHaveBeenCalledWith('/question/:id', { id: 42 }, { question: 'Updated question?' });
        });

        it('should throw when DS returns an error', async () => {
            (dsClient.patch as jest.Mock).mockRejectedValue(new DSError(404, 'Question not found'));

            await expect(questionService.updateQuestion(999, {})).rejects.toThrow('Question not found');
        });
    });

    describe('getUserQuestionCount', () => {
        it('should return count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(5);

            const result = await questionService.getUserQuestionCount('123456789012345678');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', { user_id: BigInt('123456789012345678') });
            expect(result).toBe(5);
        });
    });

    describe('getUserApprovedQuestionCount', () => {
        it('should return approved question count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(3);

            const result = await questionService.getUserApprovedQuestionCount('123456789012345678');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', {
                user_id: BigInt('123456789012345678'),
                is_approved: true,
                is_banned: false,
            });
            expect(result).toBe(3);
        });
    });

    describe('getUserBannedQuestionCount', () => {
        it('should return banned question count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(2);

            const result = await questionService.getUserBannedQuestionCount('123456789012345678');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', {
                user_id: BigInt('123456789012345678'),
                is_banned: true,
            });
            expect(result).toBe(2);
        });
    });

    describe('getServerQuestionCount', () => {
        it('should return server question count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(10);

            const result = await questionService.getServerQuestionCount('987654321098765432');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', { server_id: BigInt('987654321098765432') });
            expect(result).toBe(10);
        });
    });

    describe('getServerApprovedQuestionCount', () => {
        it('should return server approved question count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(8);

            const result = await questionService.getServerApprovedQuestionCount('987654321098765432');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', {
                server_id: BigInt('987654321098765432'),
                is_approved: true,
                is_banned: false,
            });
            expect(result).toBe(8);
        });
    });

    describe('getServerBannedQuestionCount', () => {
        it('should return server banned question count from db', async () => {
            (mockDb.count as jest.Mock).mockResolvedValue(1);

            const result = await questionService.getServerBannedQuestionCount('987654321098765432');

            expect(mockDb.count).toHaveBeenCalledWith('question', 'questions', {
                server_id: BigInt('987654321098765432'),
                is_banned: true,
            });
            expect(result).toBe(1);
        });
    });

    describe('banAllUserQuestions', () => {
        it('should ban all non-banned questions from a user', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 3, changedRows: 3 });

            const result = await questionService.banAllUserQuestions('123456789012345678', '999888777666555444');

            expect(mockDb.update).toHaveBeenCalledWith('question', 'questions', {
                is_banned: true,
                banned_by: BigInt('999888777666555444'),
                ban_reason: 'User Banned',
                datetime_banned: expect.any(Date),
            }, {
                user_id: BigInt('123456789012345678'),
                is_banned: false,
            });
            expect(result).toBe(3);
        });

        it('should return 0 when no questions to ban', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 0, changedRows: 0 });

            const result = await questionService.banAllUserQuestions('123456789012345678', '999888777666555444');

            expect(result).toBe(0);
        });
    });

    describe('unbanUserBannedQuestions', () => {
        it('should unban questions with "User Banned" reason', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 2, changedRows: 2 });

            const result = await questionService.unbanUserBannedQuestions('123456789012345678');

            expect(mockDb.update).toHaveBeenCalledWith('question', 'questions', {
                is_banned: false,
                banned_by: null,
                ban_reason: null,
                datetime_banned: null,
            }, {
                user_id: BigInt('123456789012345678'),
                is_banned: true,
                ban_reason: 'User Banned',
            });
            expect(result).toBe(2);
        });

        it('should return 0 when no questions match', async () => {
            (mockDb.update as jest.Mock).mockResolvedValue({ affectedRows: 0, changedRows: 0 });

            const result = await questionService.unbanUserBannedQuestions('123456789012345678');

            expect(result).toBe(0);
        });
    });
});
