import { NullChannelError } from '../NullChannelError';

describe('NullChannelError', () => {
    it('should create error with default message', () => {
        const error = new NullChannelError();

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(NullChannelError);
        expect(error.name).toBe('NullChannelError');
        expect(error.message).toBe('Interaction.channel is null');
    });

    it('should maintain proper stack trace when available', () => {
        // This test verifies the error includes stack trace information
        const error = new NullChannelError();
        
        expect(error.stack).toBeDefined();
        if (error.stack) {
            expect(error.stack).toContain('NullChannelError');
        }
    });

    it('should be throwable and catchable', () => {
        expect(() => {
            throw new NullChannelError();
        }).toThrow(NullChannelError);

        expect(() => {
            throw new NullChannelError();
        }).toThrow('Interaction.channel is null');
    });

    it('should work in try-catch blocks', () => {
        let caughtError: Error | null = null;

        try {
            throw new NullChannelError();
        } catch (error) {
            caughtError = error as Error;
        }

        expect(caughtError).toBeInstanceOf(NullChannelError);
        expect(caughtError?.name).toBe('NullChannelError');
        expect(caughtError?.message).toBe('Interaction.channel is null');
    });

    it('should have consistent error properties', () => {
        const error1 = new NullChannelError();
        const error2 = new NullChannelError();
        
        expect(error1.name).toBe(error2.name);
        expect(error1.message).toBe(error2.message);
        expect(error1.name).toBe('NullChannelError');
        expect(error1.message).toBe('Interaction.channel is null');
    });

    it('should inherit from Error correctly', () => {
        const error = new NullChannelError();
        
        expect(error instanceof Error).toBe(true);
        expect(error instanceof NullChannelError).toBe(true);
        expect(error.constructor).toBe(NullChannelError);
    });
});