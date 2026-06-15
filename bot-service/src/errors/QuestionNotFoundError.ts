/**
     * Error thrown when a Question is not found
 */
export class QuestionNotFoundError extends Error {
    /**
     * Create a QuestionNotFoundError
     */
    constructor(questionId: unknown) {
        const message = `Question with ID ${String(questionId)} not found`;

        super(message);
        this.name = 'QuestionNotFoundError';
        
        // Maintains proper stack trace for where the error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, QuestionNotFoundError);
        }
    }
}