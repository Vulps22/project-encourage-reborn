/**
 * Error thrown when DM interactions are attempted
 */
export class DMInteractionError extends Error {
  constructor() {
    super("I'm sorry, DM interactions are not currently supported");
    this.name = 'DMInteractionError';
  }
}
