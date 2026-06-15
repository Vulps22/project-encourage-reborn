/**
 * Error thrown when Interaction.channel is null
 */
export class NullChannelError extends Error {
    /**
     * Create a NullChannelError
     */
    constructor() {
        const message = 'Interaction.channel is null';

        super(message);
        this.name = 'NullChannelError';
        
        // Maintains proper stack trace for where the error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NullChannelError);
        }
    }
}