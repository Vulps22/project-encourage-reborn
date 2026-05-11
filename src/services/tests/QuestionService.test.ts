import { QuestionService } from '../QuestionService';
import { dsClient, DSError } from '../../client';
import { Question, QuestionType } from '@vulps22/project-encourage-types';

jest.mock('../../client', () => ({
    dsClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    DSError: jest.requireActual('../../client').DSError,
}));

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

    beforeEach(() => {
        jest.clearAllMocks();
        questionService = new QuestionService();
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

});
