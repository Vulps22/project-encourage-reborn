import { QuestionNotFoundError } from '../QuestionNotFoundError';

describe('QuestionNotFoundError', () => {
    it('should create error with numeric question ID', () => {
        const questionId = 123;
        const error = new QuestionNotFoundError(questionId);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuestionNotFoundError);
        expect(error.name).toBe('QuestionNotFoundError');
        expect(error.message).toBe('Question with ID 123 not found');
    });

    it('should create error with string question ID', () => {
        const questionId = '456';
        const error = new QuestionNotFoundError(questionId);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuestionNotFoundError);
        expect(error.name).toBe('QuestionNotFoundError');
        expect(error.message).toBe('Question with ID 456 not found');
    });

    it('should create error with null question ID', () => {
        const error = new QuestionNotFoundError(null);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuestionNotFoundError);
        expect(error.name).toBe('QuestionNotFoundError');
        expect(error.message).toBe('Question with ID null not found');
    });

    it('should create error with undefined question ID', () => {
        const error = new QuestionNotFoundError(undefined);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuestionNotFoundError);
        expect(error.name).toBe('QuestionNotFoundError');
        expect(error.message).toBe('Question with ID undefined not found');
    });

    it('should create error with boolean question ID', () => {
        const error = new QuestionNotFoundError(false);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuestionNotFoundError);
        expect(error.name).toBe('QuestionNotFoundError');
        expect(error.message).toBe('Question with ID false not found');
    });

    it('should maintain proper stack trace when available', () => {
        // This test verifies the error includes stack trace information
        const error = new QuestionNotFoundError(999);
        
        expect(error.stack).toBeDefined();
        if (error.stack) {
            expect(error.stack).toContain('QuestionNotFoundError');
        }
    });

    it('should handle various question ID types', () => {
        const testCases = [
            123,
            '789',
            0,
            -1,
            BigInt(9007199254740991),
            'abc-123',
            {},
            []
        ];

        testCases.forEach(questionId => {
            const error = new QuestionNotFoundError(questionId);
            expect(error.message).toBe(`Question with ID ${questionId} not found`);
            expect(error.name).toBe('QuestionNotFoundError');
        });
    });

    it('should be throwable and catchable', () => {
        const questionId = 999;
        
        expect(() => {
            throw new QuestionNotFoundError(questionId);
        }).toThrow(QuestionNotFoundError);

        expect(() => {
            throw new QuestionNotFoundError(questionId);
        }).toThrow('Question with ID 999 not found');
    });

    it('should work in try-catch blocks', () => {
        const questionId = 'test-question-id';
        let caughtError: Error | null = null;

        try {
            throw new QuestionNotFoundError(questionId);
        } catch (error) {
            caughtError = error as Error;
        }

        expect(caughtError).toBeInstanceOf(QuestionNotFoundError);
        expect(caughtError?.name).toBe('QuestionNotFoundError');
        expect(caughtError?.message).toBe(`Question with ID ${questionId} not found`);
    });

    it('should handle edge case question IDs gracefully', () => {
        const edgeCases = [
            '',
            ' ',
            '\n',
            '\t',
            'question-with-very-long-id-that-might-cause-issues-in-some-systems',
            '💩', // emoji
            '中文', // non-latin characters
        ];

        edgeCases.forEach(questionId => {
            const error = new QuestionNotFoundError(questionId);
            expect(error.message).toBe(`Question with ID ${questionId} not found`);
            expect(error.name).toBe('QuestionNotFoundError');
        });
    });
});