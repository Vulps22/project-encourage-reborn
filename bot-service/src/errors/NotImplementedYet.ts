/**
 * Error thrown when a feature or method is not yet implemented
 */
export class NotImplementedYet extends Error {
    /**
     * Create a NotImplementedYet error
     * @param feature - Optional description of the feature that's not implemented
     */
    constructor(feature?: string) {
        const message = feature 
            ? `Feature not yet implemented: ${feature}`
            : 'This feature is not yet implemented';
        
        super(message);
        this.name = 'NotImplementedYet';
        
        // Maintains proper stack trace for where the error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NotImplementedYet);
        }
    }
}