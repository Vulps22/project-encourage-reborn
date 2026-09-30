/**
 * ButtonHandler type for defining button interaction handlers
 */
export type Handler<T> = {
    name: string;
    params?: Record<string, string>;
    /**
     * Whether this interaction can originate a new interaction chain (e.g. a
     * command, or a button/select on a message the bot posted independently)
     * versus only ever being reached as a continuation of another handler's
     * flow. Drives interaction event logging — continuations are not logged
     * as separate events.
     */
    interactionInitiator: boolean;
    execute: (interaction: T) => Promise<void>;

};